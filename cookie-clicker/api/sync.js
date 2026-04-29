import { getSupabase } from './_supabase.js';

export default async function handler(req, res) {
  let supabase;
  try {
    supabase = getSupabase();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  // GET: Load save state
  if (req.method === 'GET') {
    const { fid } = req.query;
    if (!fid) return res.status(400).json({ error: 'Missing fid' });

    try {
      const { data, error } = await supabase
        .from('saves')
        .select('state, updated_at')
        .eq('fid', fid)
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
    const { fid, state } = req.body;
    if (!fid || !state) return res.status(400).json({ error: 'Missing fid or state' });

    // SECURITY NOTE: In a production app, you should verify the Quick Auth JWT 
    // from the 'Authorization' header to ensure the request is actually from the user.
    // For now, we are trusting the fid provided in the body.

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
          fid, 
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
