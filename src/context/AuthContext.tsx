import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  recoveringPassword: boolean;
  sessionError: string;
  updatePassword: (password: string) => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toAppUser(user: User): AppUser {
  const displayName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split('@')[0] ||
    'Usuário';

  return {
    uid: user.id,
    email: user.email || null,
    displayName,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [recoveringPassword, setRecoveringPassword] = useState(
    () => sessionStorage.getItem('gestao-contas:password-recovery') === 'true'
  );
  const recoveryRef = useRef(recoveringPassword);

  useEffect(() => {
    let mounted = true;

    const restoreSession = supabase.auth.getSession();
    restoreSession.then(({ data, error }) => {
      if (!mounted) return;
      if (error) console.error('[Supabase Auth] Erro ao restaurar sessão:', error);
      if (error) setSessionError('Não foi possível restaurar sua sessão. Tente entrar novamente.');
      if (!data.session) {
        recoveryRef.current = false;
        setRecoveringPassword(false);
        sessionStorage.removeItem('gestao-contas:password-recovery');
      }
      setCurrentUser(data.session?.user && !recoveryRef.current ? toAppUser(data.session.user) : null);
      setLoading(false);
    }).catch(() => {
      if (!mounted) return;
      setSessionError('Não foi possível restaurar sua sessão. Tente entrar novamente.');
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY') {
        recoveryRef.current = true;
        sessionStorage.setItem('gestao-contas:password-recovery', 'true');
        setRecoveringPassword(true);
      } else if (event === 'SIGNED_OUT') {
        recoveryRef.current = false;
        sessionStorage.removeItem('gestao-contas:password-recovery');
        setRecoveringPassword(false);
      }
      setCurrentUser(session?.user && !recoveryRef.current ? toAppUser(session.user) : null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    setSessionError('');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: pass,
    });
    if (error) throw error;
    if (!data.session?.user) throw new Error('Não foi possível abrir a sessão no Supabase.');
    setCurrentUser(toAppUser(data.session.user));
  };

  const signup = async (email: string, pass: string, name: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    setSessionError('');
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: pass,
      options: {
        data: { full_name: cleanName },
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
    if (error) throw error;
    if (data.session?.user) setCurrentUser(toAppUser(data.session.user));
  };

  const resetPassword = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) throw new Error('Informe seu e-mail para recuperar a senha.');

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    recoveryRef.current = false;
    sessionStorage.removeItem('gestao-contas:password-recovery');
    setRecoveringPassword(false);
    setCurrentUser(null);
  };

  const updatePassword = async (password: string) => {
    if (!recoveryRef.current) throw new Error('Abra o link de recuperação enviado ao seu e-mail.');
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    recoveryRef.current = false;
    sessionStorage.removeItem('gestao-contas:password-recovery');
    setRecoveringPassword(false);
    setCurrentUser(toAppUser(data.user));
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, recoveringPassword, sessionError, updatePassword, login, signup, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
}
