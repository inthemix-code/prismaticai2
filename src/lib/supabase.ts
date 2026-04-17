import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const CLIENT_ID_STORAGE_KEY = 'prismatic.client_id';

export function getClientId(): string {
  if (typeof window === 'undefined') return '';
  let id = window.localStorage.getItem(CLIENT_ID_STORAGE_KEY);
  if (!id) {
    const rand = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    id = `client-${rand}`;
    window.localStorage.setItem(CLIENT_ID_STORAGE_KEY, id);
  }
  return id;
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  global: {
    headers: {
      'x-client-id': getClientId(),
    },
  },
});
