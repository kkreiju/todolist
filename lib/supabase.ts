import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://invalid.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'missing-anon-key';
export const supabase = createClient(url, key);
export const imageBucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'task-backgrounds';

export function assertSupabaseConfig() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase configuration. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.');
  }
}
