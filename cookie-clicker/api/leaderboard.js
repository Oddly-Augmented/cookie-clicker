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
      let { data, error } = await supabase
        .from('leaderboard')
        .select('fid, username, score, prestige_level, ascensions, has_nft, follows_oddly')
        .neq('fid', 1014465) // Exclude admin
        .order('score', { ascending: false })
        .limit(100);

      if (error && error.message && error.message.includes('does not exist')) {
        // Fallback if the user hasn't created the new columns in Supabase yet
        const fallback = await supabase
          .from('leaderboard')
          .select('fid, username, score, prestige_level, ascensions')
          .neq('fid', 1014465) // Exclude admin
          .order('score', { ascending: false })
          .limit(100);
        data = fallback.data;
        error = fallback.error;
      }

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
      const { fid, username, score, prestige_level, ascensions, has_nft, follows_oddly } = req.body || {};
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

      let upsertData = {
        fid,
        username: (username || 'Anonymous').slice(0, 32),
        score,
        prestige_level: prestige_level || 0,
        ascensions: ascensions || 0,
        has_nft: has_nft || false,
        follows_oddly: follows_oddly || false,
        updated_at: new Date().toISOString()
      };

      let { error: upsertErr } = await supabase
        .from('leaderboard')
        .upsert(upsertData, { onConflict: 'fid' });

      if (upsertErr && upsertErr.message && upsertErr.message.includes('does not exist')) {
        // Fallback to basic columns
        delete upsertData.has_nft;
        delete upsertData.follows_oddly;
        const fallback = await supabase
          .from('leaderboard')
          .upsert(upsertData, { onConflict: 'fid' });
        upsertErr = fallback.error;
      }

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

