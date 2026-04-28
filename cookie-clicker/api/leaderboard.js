// ============================================================
// Leaderboard API
// ------------------------------------------------------------
// GET  /api/leaderboard       → top 100 scores with prestige
// POST /api/leaderboard       → upsert score (only if higher)
// ============================================================

import { getSupabase } from './_supabase.js';

export default async function handler(req, res) {
  let supabase;
  try {
    supabase = getSupabase();
  } catch (err) {
    console.error('Leaderboard config error:', err.message);
    return res.status(500).json({ error: err.message });
  }

  // ---- GET: top 100 scores with prestige ----
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('fid, username, score, prestige_level, ascensions, has_nft')
        .order('score', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Leaderboard SELECT error:', error);
        return res.status(500).json({ error: error.message || 'Could not load scores' });
      }
      return res.status(200).json(data || []);
    } catch (err) {
      console.error('Leaderboard GET unexpected:', err);
      return res.status(500).json({ error: err.message || 'Internal error' });
    }
  }

  // ---- POST: submit score with prestige ----
  if (req.method === 'POST') {
    try {
      const { fid, username, score, prestige_level, ascensions, has_nft } = req.body || {};
      if (!fid || typeof score !== 'number') {
        return res.status(400).json({ error: 'fid and numeric score required' });
      }

      // Only update if the new score is higher than the existing one.
      const { data: existing, error: selectErr } = await supabase
        .from('leaderboard')
        .select('score')
        .eq('fid', fid)
        .maybeSingle();

      if (selectErr) {
        console.error('Leaderboard SELECT (post) error:', selectErr);
        return res.status(500).json({ error: selectErr.message });
      }

      if (existing && existing.score >= score) {
        return res.status(200).json({ ok: true, updated: false });
      }

      const { error: upsertErr } = await supabase
        .from('leaderboard')
        .upsert({
          fid,
          username: (username || 'Anonymous').slice(0, 32),
          score,
          prestige_level: prestige_level || 0,
          ascensions: ascensions || 0,
          has_nft: has_nft || false,
          updated_at: new Date().toISOString()
        }, { onConflict: 'fid' });

      if (upsertErr) {
        console.error('Leaderboard UPSERT error:', upsertErr);
        return res.status(500).json({ error: upsertErr.message });
      }
      return res.status(200).json({ ok: true, updated: true });
    } catch (err) {
      console.error('Leaderboard POST unexpected:', err);
      return res.status(500).json({ error: err.message || 'Internal error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

