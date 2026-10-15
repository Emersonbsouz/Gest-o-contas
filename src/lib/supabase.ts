import { createLocalClient } from './localClient';
import { createClient } from '@supabase/supabase-js';

// Local development must never connect to the online database, including previews.
const isLocalEnvironment = import.meta.env.DEV || (
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
);

export const SUPABASE_URL = isLocalEnvironment
  ? 'http://127.0.0.1:54321'
  : import.meta.env.VITE_SUPABASE_URL || 'https://gvyqdcridjxvjtkfsqvf.supabase.co';

export const SUPABASE_PUBLISHABLE_KEY = isLocalEnvironment
  ? 'local-development-placeholder'
  : import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_SrUMlE1ErAoryNIJKE_48Q_UnQ-ypZX';

const remoteClient = () => createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storageKey: isLocalEnvironment ? 'gestao-contas-local-auth' : undefined,
    persistSession: true,
    autoRefreshToken: !isLocalEnvironment,
    detectSessionInUrl: !isLocalEnvironment,
  },
});

export const supabase = isLocalEnvironment ? createLocalClient() as unknown as ReturnType<typeof createClient> : remoteClient();
