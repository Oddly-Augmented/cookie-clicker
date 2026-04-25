// ============================================================
// Leaderboard API
// ------------------------------------------------------------
// GET  /api/leaderboard       → top 10 scores
// POST /api/leaderboard       → upsert score (only if higher)
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // ---- GET: top 10 scores ----
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('fid, username, score')
      .order('score', { ascending: false })
      .limit(10);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Could not load scores' });
    }
    return res.status(200).json(data || []);
  }

  // ---- POST: submit score ----
  if (req.method === 'POST') {
    try {
      const { fid, username, score } = req.body || {};
      if (!fid || typeof score !== 'number') {
        return res.status(400).json({ error: 'fid and numeric score required' });
      }

      // Only update if the new score is higher than the existing one.
      const { data: existing } = await supabase
        .from('leaderboard')
        .select('score')
        .eq('fid', fid)
        .maybeSingle();

      if (existing && existing.score >= score) {
        return res.status(200).json({ ok: true, updated: false });
      }

      const { error } = await supabase
        .from('leaderboard')
        .upsert({
          fid,
          username: (username || 'Anonymous').slice(0, 32),
          score,
          updated_at: new Date().toISOString()
        }, { onConflict: 'fid' });

      if (error) {
        console.error(error);
        return res.status(500).json({ error: 'Could not save score' });
      }
      return res.status(200).json({ ok: true, updated: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
