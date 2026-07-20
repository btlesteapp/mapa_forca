import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://orllnjvsygipmnitskvr.supabase.co';
const supabaseAnonKey = 'sb_publishable_KOVUz_YqKka7FwWFgMzvgQ_MeN6U9hP';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
