import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Flag to temporarily suppress auth state changes (used during admin account creation)
export let skipAuthChange = false;
export const setSkipAuthChange = (value: boolean) => { skipAuthChange = value; };
