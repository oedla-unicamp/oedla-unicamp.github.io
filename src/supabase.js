import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jnspgpmdmouvkmoqaxlc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impuc3BncG1kbW91dmttb3FheGxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMjYyMDMsImV4cCI6MjA5NzcwMjIwM30.Kv5gZ3R_Z2KoIKzE1sKzf2j0FAFOr_4Sl6G38Wj3-Hk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export { SUPABASE_URL };
