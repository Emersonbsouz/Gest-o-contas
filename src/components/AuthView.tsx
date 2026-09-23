import React, { useState } from 'react';
import { AlertCircle, Loader2, Lock, Mail, ShieldCheck, User, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthViewProps {
  onSuccess?: () => void;
}

function getAuthErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: string }).code)
    : '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha inválidos.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já possui uma conta.';
    case 'auth/invalid-email':
      return 'Informe um e-mail válido.';
    case 'auth/weak-password':
      return 'A senha é muito fraca. Use pelo menos 6 caracteres.';
    case 'auth/popup-closed-by-user':
      return 'O login com Google foi cancelado.';
    case 'auth/popup-blocked':
      return 'O navegador bloqueou a janela de login do Google.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
    default:
      return error instanceof Error ? error.message : 'Não foi possível concluir a autenticação.';
  }
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const { login, signup, resetPassword, loginWithGoogle } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim() || !password) {
      setError('Preencha o e-mail e a senha.');
      return;
    }

    if (isRegistering && !name.trim()) {
      setError('Informe seu nome.');
      return;
    }

    if (isRegistering && password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      if (isRegistering) {
        await signup(email, password, name);
      } else {
        await login(email, password);
      }
      onSuccess?.();
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await loginWithGoogle();
      onSuccess?.();
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Digite seu e-mail acima para recuperar a senha.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setMessage('Enviamos um link de recuperação para o seu e-mail.');
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-500/25 mb-4">
            <Wallet className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Gestor de Contas</h1>
          <p className="text-sm text-slate-300 mt-1">Gestão financeira pessoal e multiempresa</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              {isRegistering ? 'Criar sua conta' : 'Entrar no sistema'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isRegistering
                ? 'Cadastre-se para criar e administrar suas empresas.'
                : 'Use seu e-mail e senha ou entre com sua Conta Google.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full mb-5 flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Entrar com Conta Google
          </button>

          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">ou</span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nome completo</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    placeholder="Seu nome"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="seuemail@exemplo.com"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Senha</label>
                {!isRegistering && (
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={loading}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={isRegistering ? 'new-password' : 'current-password'}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Carregando...' : isRegistering ? 'Criar conta' : 'Entrar no sistema'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering((value) => !value);
                setError('');
                setMessage('');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              {isRegistering ? 'Já possui conta? Entrar' : 'Não possui conta? Criar cadastro'}
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Autenticação protegida pelo Firebase</span>
        </div>
      </div>
    </div>
  );
};
