import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_ANON_KEY!;

const email = 'raphael@tracebud.com';
const password = 'tracebud';

async function main() {
  const supabase = createClient(url, key);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    console.error('Login failed:', error);
    process.exit(1);
  }

  process.stdout.write(data.session.access_token);
}

main();