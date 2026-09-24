import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { migrateFirebaseDataToSupabase } from '../services/firebaseMigrationService';
import { establishSupabaseSession } from '../services/supabaseAuthBridge';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toAppUser(user: { uid: string; email: string | null; displayName: string | null }): AppUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split('@')[0] || 'Usuário',
  };
}

async function migrateAuthenticatedUser(user: FirebaseUser, password?: string) {
  try {
    await establishSupabaseSession(user, password);
    const summary = await migrateFirebaseDataToSupabase(user);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('supabaseMigrationLastResult', JSON.stringify(summary));
      window.localStorage.setItem('supabaseMigrationLastRun', new Date().toISOString());
    }
    console.info('[migration] Firebase -> Supabase concluída', summary);
  } catch (error) {
    console.error('[migration] Firebase -> Supabase pendente/falhou', error);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user ? toAppUser(user) : null);
      setLoading(false);

      if (user) {
        void migrateAuthenticatedUser(user);
      }
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      setCurrentUser(toAppUser(result.user));
      await migrateAuthenticatedUser(result.user);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      setCurrentUser(toAppUser(credential.user));
      await migrateAuthenticatedUser(credential.user, pass);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, pass: string, name: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    setLoading(true);

    try {
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (cleanName) {
        await updateProfile(credential.user, { displayName: cleanName });
      }
      setCurrentUser({
        ...toAppUser(credential.user),
        displayName: cleanName || credential.user.email?.split('@')[0] || 'Usuário',
      });
      await migrateAuthenticatedUser(credential.user, pass);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('Informe seu e-mail para recuperar a senha.');
    }
    await sendPasswordResetEmail(auth, cleanEmail);
  };

  const logout = async () => {
    setLoading(true);
    try {
      await Promise.allSettled([signOut(auth), supabase.auth.signOut()]);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login,
        loginWithGoogle,
        signup,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
