// ==========================================
// UTHMhub - Supabase Client (Scaffolded)
// ==========================================
// To enable Supabase:
// 1. Create a Supabase project at https://supabase.com
// 2. Copy your project URL and anon key
// 3. Add them to .env.local:
//    NEXT_PUBLIC_SUPABASE_URL=your-project-url
//    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
