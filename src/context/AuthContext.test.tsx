import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { AuthView } from '../components/AuthView';
import { PasswordRecoveryView } from '../components/PasswordRecoveryView';

const auth = vi.hoisted(() => ({
  getSession: vi.fn(), onAuthStateChange: vi.fn(), signInWithPassword: vi.fn(),
  signUp: vi.fn(), signOut: vi.fn(), updateUser: vi.fn(), resetPasswordForEmail: vi.fn(),
}));
vi.mock('../lib/supabase', () => ({ supabase: { auth } }));
const user = { id: 'test-user', email: 'test@example.com', user_metadata: {} };
let emit: (event: string, session: unknown) => void;

function Screens() {
  const { loading, currentUser, recoveringPassword } = useAuth();
  if (loading) return <p>Restaurando sessão</p>;
  if (recoveringPassword) return <PasswordRecoveryView />;
  if (currentUser) return <p>Área autenticada</p>;
  return <AuthView />;
}

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  auth.onAuthStateChange.mockImplementation((callback) => {
    emit = callback;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });
});
afterEach(cleanup);

async function loginForm() {
  render(<AuthProvider><Screens /></AuthProvider>);
  await screen.findByRole('button', { name: 'Entrar no sistema' });
  fireEvent.change(screen.getByPlaceholderText('seuemail@exemplo.com'), { target: { value: 'test@example.com' } });
  fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'invalid-password' } });
}

test('keeps the login form mounted during a request and displays invalid credentials', async () => {
  let resolve: (value: unknown) => void;
  auth.signInWithPassword.mockImplementation(() => new Promise((done) => { resolve = done; }));
  await loginForm();
  fireEvent.click(screen.getByRole('button', { name: 'Entrar no sistema' }));
  expect(screen.getByPlaceholderText('seuemail@exemplo.com')).toBeTruthy();
  expect(screen.queryByText('Restaurando sessão')).toBeNull();
  await act(async () => resolve({ data: {}, error: new Error('Invalid login credentials') }));
  expect(await screen.findByText('E-mail ou senha inválidos.')).toBeTruthy();
  expect((screen.getByPlaceholderText('seuemail@exemplo.com') as HTMLInputElement).value).toBe('test@example.com');
});

test('explains network failures and permits another login attempt', async () => {
  auth.signInWithPassword.mockRejectedValue(new TypeError('Failed to fetch'));
  await loginForm();
  fireEvent.click(screen.getByRole('button', { name: 'Entrar no sistema' }));
  expect(await screen.findByText(/Não foi possível conectar ao serviço de login/)).toBeTruthy();
  expect((screen.getByRole('button', { name: 'Entrar no sistema' }) as HTMLButtonElement).disabled).toBe(false);
});

test('leaves the loading screen when restoring the session rejects', async () => {
  auth.getSession.mockRejectedValue(new TypeError('Failed to fetch'));
  render(<AuthProvider><Screens /></AuthProvider>);
  expect(await screen.findByText(/Não foi possível restaurar sua sessão/)).toBeTruthy();
});

test('opens password recovery, validates confirmation, preserves it on refresh, and updates the password', async () => {
  const mounted = render(<AuthProvider><Screens /></AuthProvider>);
  await screen.findByRole('button', { name: 'Entrar no sistema' });
  act(() => emit('PASSWORD_RECOVERY', { user }));
  expect(screen.getByText('Definir nova senha')).toBeTruthy();
  expect(screen.queryByText('Área autenticada')).toBeNull();
  mounted.unmount();
  auth.getSession.mockResolvedValue({ data: { session: { user } }, error: null });
  render(<AuthProvider><Screens /></AuthProvider>);
  await screen.findByLabelText('Nova senha');
  fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'new-test-password' } });
  fireEvent.change(screen.getByLabelText('Confirmar nova senha'), { target: { value: 'mismatch' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }));
  expect(await screen.findByText('As senhas não coincidem.')).toBeTruthy();
  expect(auth.updateUser).not.toHaveBeenCalled();
  auth.updateUser.mockResolvedValue({ data: { user }, error: null });
  fireEvent.change(screen.getByLabelText('Confirmar nova senha'), { target: { value: 'new-test-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }));
  await screen.findByText('Área autenticada');
  expect(auth.updateUser).toHaveBeenCalledWith({ password: 'new-test-password' });
  expect(sessionStorage.getItem('gestao-contas:password-recovery')).toBeNull();
});

test('keeps recovery open if updating the password fails', async () => {
  render(<AuthProvider><Screens /></AuthProvider>);
  await screen.findByRole('button', { name: 'Entrar no sistema' });
  act(() => emit('PASSWORD_RECOVERY', { user }));
  auth.updateUser.mockResolvedValue({ data: {}, error: new Error('Password should be at least 6 characters') });
  for (const label of ['Nova senha', 'Confirmar nova senha']) {
    fireEvent.change(screen.getByLabelText(label), { target: { value: 'new-test-password' } });
  }
  fireEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }));
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(screen.queryByText('Área autenticada')).toBeNull();
});

test('returns to login when recovery is cancelled', async () => {
  render(<AuthProvider><Screens /></AuthProvider>);
  await screen.findByRole('button', { name: 'Entrar no sistema' });
  act(() => emit('PASSWORD_RECOVERY', { user }));
  auth.signOut.mockImplementation(async () => { emit('SIGNED_OUT', null); return { error: null }; });
  fireEvent.click(screen.getByRole('button', { name: 'Voltar ao login' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Entrar no sistema' })).toBeTruthy());
  expect(sessionStorage.getItem('gestao-contas:password-recovery')).toBeNull();
});
