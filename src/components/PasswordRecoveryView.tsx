import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from './AuthView';

export function PasswordRecoveryView() {
  const { updatePassword, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < 6) return setError('A senha deve ter pelo menos 6 caracteres.');
    if (password !== confirmation) return setError('As senhas não coincidem.');
    setBusy(true);
    try {
      await updatePassword(password);
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    setBusy(true);
    try {
      await logout();
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-xl">
        <h1 className="text-xl font-bold text-slate-900">Definir nova senha</h1>
        <p className="text-sm text-slate-500 mt-2 mb-6">Escolha uma nova senha para acessar o Gestor de Contas.</p>
        {error && <p role="alert" className="text-sm text-rose-700 mb-4">{error}</p>}
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm text-slate-700">
            Nova senha
            <input type="password" autoComplete="new-password" required minLength={6} value={password}
              onChange={(event) => setPassword(event.target.value)} disabled={busy}
              className="block w-full border rounded-lg p-3 mt-1" />
          </label>
          <label className="block text-sm text-slate-700">
            Confirmar nova senha
            <input type="password" autoComplete="new-password" required minLength={6} value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)} disabled={busy}
              className="block w-full border rounded-lg p-3 mt-1" />
          </label>
          <button type="submit" disabled={busy} className="w-full bg-indigo-600 text-white rounded-lg p-3 disabled:opacity-50">
            {busy ? 'Salvando...' : 'Salvar nova senha'}
          </button>
          <button type="button" disabled={busy} onClick={cancel} className="w-full text-indigo-600 text-sm disabled:opacity-50">
            Voltar ao login
          </button>
        </form>
      </div>
    </div>
  );
}
