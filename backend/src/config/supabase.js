import { createClient } from '@supabase/supabase-js';
import config from './env.js';

let supabaseAdmin = null;

if (config.supabaseUrl && config.supabaseServiceRoleKey) {
  supabaseAdmin = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export const getSupabaseAdmin = () => supabaseAdmin;
