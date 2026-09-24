import type { User as FirebaseUser } from 'firebase/auth';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabase } from '../lib/supabase';

async function callBridge(
  firebaseUser: FirebaseUser,
  options: { password?: string; mode: 'password' | 'magiclink' }
) {
  const token = await firebaseUser.getIdToken(true);
  const response = await fetch(`${SUPABASE_URL}/functions/v1/firebase-auth-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      password: options.password,
      mode: options.mode,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.detail || payload?.error || 'Falha ao vincular Firebase ao Supabase.');
  }
  return payload;
}

export async function establishSupabaseSession(
  firebaseUser: FirebaseUser,
  password?: string
) {
  const email = (firebaseUser.email || '').trim().toLowerCase();
  if (!email) throw new Error('Usuário Firebase sem e-mail não pode ser migrado automaticamente.');

  const current = await supabase.auth.getSession();
  if (current.data.session?.user?.email?.toLowerCase() === email) {
    return current.data.session;
  }

  if (password) {
    const firstLogin = await supabase.auth.signInWithPassword({ email, password });
    if (firstLogin.data.session) return firstLogin.data.session;

    await callBridge(firebaseUser, { password, mode: 'password' });

    const migratedLogin = await supabase.auth.signInWithPassword({ email, password });
    if (migratedLogin.data.session) return migratedLogin.data.session;
  }

  const bridge = await callBridge(firebaseUser, { mode: 'magiclink' });
  if (!bridge.hashedToken) throw new Error('A ponte de autenticação não retornou token de sessão.');

  const verified = await supabase.auth.verifyOtp({
    token_hash: bridge.hashedToken,
    type: 'magiclink',
  });
  if (verified.error || !verified.data.session) {
    throw verified.error || new Error('Não foi possível abrir a sessão Supabase.');
  }
  return verified.data.session;
}
