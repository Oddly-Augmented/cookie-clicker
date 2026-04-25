// ============================================================
// Shared Supabase client
// ------------------------------------------------------------
// Imported by every API route. We construct the client lazily so
// that a missing env var produces a clean 500 with a useful log
// message instead of a cryptic FUNCTION_INVOCATION_FAILED.
// ============================================================

import { createClient } from '@supabase/supabase-js';

let cached = null;

export function getSupabase() {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    const missing = [
      !url && 'SUPABASE_URL',
      !key && 'SUPABASE_SERVICE_KEY'
    ].filter(Boolean).join(', ');
    throw new Error(`Missing Supabase env vars: ${missing}. Set them in Vercel → Project → Settings → Environment Variables, then redeploy.`);
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return cached;
}
