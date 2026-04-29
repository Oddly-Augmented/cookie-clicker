import { getSupabase } from './_supabase.js';
import { verifyAuth } from './_auth.js';

export default async function handler(req, res) {
  let supabase;
  try {
    supabase = getSupabase();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  // Verify the Quick Auth JWT. From here on we trust only the FID
  // from the token — never the fid from req.body or req.query.
  const auth = await verifyAuth(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  const authedFid = auth.fid;

  // GET: Load save state
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('saves')
        .select('state, updated_at')
        .eq('fid', authedFid)
        .maybeSingle();

      if (error) throw error;
      return res.status(200).json(data || { state: null });
    } catch (err) {
      console.error('Sync GET error:', err);
      return res.status(500).json({ error: 'Failed to load save' });
    }
  }

  // POST: Save state
  if (req.method === 'POST') {
    const { state } = req.body || {};
    if (!state) return res.status(400).json({ error: 'Missing state' });

    // Server-side sanitization: fix NaN/null/Infinity before saving
    const fix = (v, fallback = 0) => {
      if (v === null || v === undefined || typeof v !== 'number' || !Number.isFinite(v)) return fallback;
      return Math.min(v, 1e300);
    };
    state.cookies = fix(state.cookies);
    state.totalEarned = fix(state.totalEarned);
    state.lifetimeEarned = fix(state.lifetimeEarned);
    state.prestigeLevel = fix(state.prestigeLevel);
    state.prestigePoints = fix(state.prestigePoints);
    state.totalClicks = fix(state.totalClicks);
    if (state.owned && typeof state.owned === 'object') {
      for (const key of Object.keys(state.owned)) {
        state.owned[key] = fix(state.owned[key]);
      }
    }

    try {
      const { error } = await supabase
        .from('saves')
        .upsert({
          fid: authedFid, // Use authenticated fid, not one from the body.
          state,
          updated_at: new Date().toISOString()
        }, { onConflict: 'fid' });

      if (error) throw error;
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('Sync POST error:', err);
      return res.status(500).json({ error: 'Failed to sync save' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
