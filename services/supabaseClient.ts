import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './supabaseConfig';

const supabaseUrl = supabaseConfig.url;
const supabaseAnonKey = supabaseConfig.anonKey;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key missing. Authentication features will not work.');
}

export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey
);
