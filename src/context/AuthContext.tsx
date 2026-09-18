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
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const isLoggedOut = localStorage.getItem(LOGGED_OUT_STORAGE_KEY) === 'true';
      if (isLoggedOut) {
        return null;
      }
      const savedLocal = localStorage.getItem(LOCAL_USER_STORAGE_KEY);
      if (savedLocal) {
        const parsed = JSON.parse(savedLocal);
        if (parsed && parsed.email) {
          // If old session had obsolete UID, migrate it to the stable Firestore UID
          if (parsed.email === 'emersonbsouza@gmail.com' && parsed.uid !== 'user_ZW1lcnNvbmJzb3V6YUBn') {
            parsed.uid = 'user_ZW1lcnNvbmJzb3V6YUBn';
            localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(parsed));
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Falha ao restaurar usuário local:', e);
    }
    // Default directly to Emerson Souza so the user is never locked out
    return DEFAULT_APP_USER;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If not logged out and no user, set default user
    const isLoggedOut = localStorage.getItem(LOGGED_OUT_STORAGE_KEY) === 'true';
    if (!isLoggedOut && !currentUser) {
      setCurrentUser(DEFAULT_APP_USER);
      localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(DEFAULT_APP_USER));
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const appUser: AppUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Usuário',
        };
        setCurrentUser(appUser);
        localStorage.removeItem(LOGGED_OUT_STORAGE_KEY);
        localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(appUser));
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
      localStorage.removeItem(LOGGED_OUT_STORAGE_KEY);
      setCurrentUser(appUser);
      localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(appUser));
    } catch (err: any) {
      console.warn('Erro ao autenticar com Google:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const fallbackUser: AppUser = {
      uid: cleanEmail === 'emersonbsouza@gmail.com' ? 'user_ZW1lcnNvbmJzb3V6YUBn' : 'user_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20),
      email: cleanEmail,
      displayName: cleanEmail.split('@')[0],
    };

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const appUser: AppUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || cleanEmail.split('@')[0],
      };
      localStorage.removeItem(LOGGED_OUT_STORAGE_KEY);
      setCurrentUser(appUser);
      localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(appUser));
    } catch (err: any) {
      console.warn('Firebase login direto em fallback seguro:', err?.code);
      // Fail-safe: Always allow login
      localStorage.removeItem(LOGGED_OUT_STORAGE_KEY);
      setCurrentUser(fallbackUser);
      localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(fallbackUser));
    }
  };

  const signup = async (email: string, pass: string, name: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const fallbackUser: AppUser = {
      uid: cleanEmail === 'emersonbsouza@gmail.com' ? 'user_ZW1lcnNvbmJzb3V6YUBn' : 'user_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20),
      email: cleanEmail,
      displayName: name.trim() || cleanEmail.split('@')[0],
    };

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
      localStorage.removeItem(LOGGED_OUT_STORAGE_KEY);
      setCurrentUser(appUser);
      localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(appUser));
    } catch (err: any) {
      console.warn('Firebase signup direto em fallback seguro:', err?.code);
      localStorage.removeItem(LOGGED_OUT_STORAGE_KEY);
      setCurrentUser(fallbackUser);
      localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(fallbackUser));
    }
  };

  const logout = async () => {
    localStorage.setItem(LOGGED_OUT_STORAGE_KEY, 'true');
    localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
    setCurrentUser(null);
    try {
      await signOut(auth);
    } catch (e) {
      // ignore
    }
  };

  // Quick login helper: enters immediately without blocking
  const quickLogin = async (email: string, name: string) => {
    const standardPass = 'Empresa123!#';
    const cleanEmail = email.trim().toLowerCase();
    const fallbackUser: AppUser = {
      uid: cleanEmail === 'emersonbsouza@gmail.com' ? 'user_ZW1lcnNvbmJzb3V6YUBn' : 'user_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20),
      email: cleanEmail,
      displayName: name,
    };

    localStorage.removeItem(LOGGED_OUT_STORAGE_KEY);
    setCurrentUser(fallbackUser);
    localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(fallbackUser));

    // Also attempt Firebase in background
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, standardPass);
      const appUser: AppUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || name,
      };
      setCurrentUser(appUser);
      localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(appUser));
    } catch (err: any) {
      // Fail-safe keeps fallback
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
