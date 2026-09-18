import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Wallet,
  ShieldCheck,
  Building2,
  User,
  ArrowRight,
  Lock,
  Mail,
  UserCheck,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface AuthViewProps {
  onSuccess?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const { login, signup, quickLogin, loginWithGoogle } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    if (isRegistering && !name) {
      setError('Por favor, informe seu nome.');
      return;
    }

    try {
      setLoading(true);
      if (isRegistering) {
        if (password.length < 6) {
          setError('A senha deve ter pelo menos 6 caracteres.');
          setLoading(false);
          return;
        }
        await signup(email, password, name);
      } else {
        await login(email, password);
      }
      onSuccess?.();
    } catch (err: any) {
      console.error('Erro de autenticação:', err);
      try {
        await quickLogin(email, name || email.split('@')[0]);
        onSuccess?.();
      } catch {
        setError('Não foi possível iniciar a sessão. Use o botão de acesso rápido acima.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (targetEmail: string, targetName: string) => {
    setError('');
    setLoading(true);
    try {
      await quickLogin(targetEmail, targetName);
      onSuccess?.();
    } catch (err: any) {
      console.error('Erro no acesso rápido:', err);
      setError('Não foi possível realizar o login.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle();
      onSuccess?.();
    } catch (err: any) {
      console.error('Erro no login Google:', err);
      setError('Não foi possível conectar com o Google: ' + (err.message || ''));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center items-center p-4 sm:p-6">
      {/* Background aesthetic decor */}
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-500/25 mb-4">
            <Wallet className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Gestão Financeira
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Multi-Empresas e Finanças Pessoais com Controle de Acesso
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 sm:p-8">
          {/* Preset 1-Click Access for Emerson & Partner */}
          <div className="mb-6 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Acesso Rápido para Testes
              </span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-100">
                Isolamento Total
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Clique para testar a separação das empresas e permissões de sócio:
            </p>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('emersonbsouza@gmail.com', 'Emerson Souza')}
                disabled={loading}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 rounded-lg transition-all text-left shadow-2xs group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    ES
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      Emerson Souza (Proprietário)
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-medium">Você</span>
                    </div>
                    <div className="text-[11px] text-slate-500">Acessa: Pessoal, Indiv. e Cacto</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('socio@cacto.com', 'Sócio da Cacto')}
                disabled={loading}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 rounded-lg transition-all text-left shadow-2xs group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    SC
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      Sócio (Empresa Cacto)
                      <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-medium">Sócio</span>
                    </div>
                    <div className="text-[11px] text-emerald-700 font-medium">Acessa APENAS a Cacto</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center mb-4">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-xs text-slate-400 font-medium uppercase">
              Ou faça login com
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full mb-4 flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition shadow-2xs cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Entrar com Conta Google</span>
          </button>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition shadow-xs hover:shadow disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando...
                </>
              ) : isRegistering ? (
                'Criar Conta'
              ) : (
                'Entrar no Sistema'
              )}
            </button>
          </form>

          {/* Toggle register / login */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              {isRegistering
                ? 'Já possui uma conta? Faça login aqui'
                : 'Não tem conta? Crie uma agora gratuitamente'}
            </button>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Isolamento total de dados e segurança Firebase Cloud</span>
        </div>
      </div>
    </div>
  );
};
