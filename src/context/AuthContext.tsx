import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

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
  logout: () => Promise<void>;
  quickLogin: (email: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_STORAGE_KEY = 'controle_financeiro_session_user';
const LOGGED_OUT_STORAGE_KEY = 'controle_financeiro_logged_out';

// Stable UID strictly matching existing Firestore company documents for Emerson Souza
export const DEFAULT_APP_USER: AppUser = {
  uid: 'user_ZW1lcnNvbmJzb3V6YUBn',
  email: 'emersonbsouza@gmail.com',
  displayName: 'Emerson Souza',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const appUser: AppUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Usuário',
        };
        setCurrentUser(appUser);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const appUser: AppUser = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || result.user.email?.split('@')[0] || 'Usuário',
      };
      setCurrentUser(appUser);
    } catch (err: any) {
      console.warn('Erro ao autenticar com Google:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const appUser: AppUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || cleanEmail.split('@')[0],
      };
      setCurrentUser(appUser);
    } catch (err: any) {
      console.error('Erro no login:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, pass: string, name: string) => {
    const cleanEmail = email.trim().toLowerCase();
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (name.trim()) {
        try {
          await updateProfile(cred.user, { displayName: name.trim() });
        } catch {}
      }
      const appUser: AppUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: name.trim() || cleanEmail.split('@')[0],
      };
      setCurrentUser(appUser);
    } catch (err: any) {
      console.error('Erro no cadastro:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (e) {
      console.error('Erro no logout:', e);
    } finally {
      setLoading(false);
    }
  };

  // Quick login helper: uses a standard password for convenience in this environment
  const quickLogin = async (email: string, name: string) => {
    const standardPass = 'Empresa123!#';
    const cleanEmail = email.trim().toLowerCase();
    setLoading(true);

    try {
      // Try login first
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, standardPass);
      const appUser: AppUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || name,
      };
      setCurrentUser(appUser);
    } catch (err: any) {
      // If user doesn't exist, try signup
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          const cred = await createUserWithEmailAndPassword(auth, cleanEmail, standardPass);
          await updateProfile(cred.user, { displayName: name });
          const appUser: AppUser = {
            uid: cred.user.uid,
            email: cred.user.email,
            displayName: name,
          };
          setCurrentUser(appUser);
        } catch (signupErr) {
          console.error('Erro no login/cadastro rápido:', signupErr);
          throw signupErr;
        }
      } else {
        throw err;
      }
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
        logout,
        quickLogin,
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
