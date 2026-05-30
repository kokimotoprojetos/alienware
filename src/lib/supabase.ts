/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient: any = null;

try {
  if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-id')) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } else {
    console.warn('[Supabase Client] URL ou Anon Key ausente ou padrão.');
  }
} catch (e) {
  console.error('[Supabase Client] Erro na inicialização:', e);
}

export const supabase = supabaseClient;
