// ============================================================
// Sync Followers API
// ------------------------------------------------------------
// POST /api/sync-followers  → Fetches all followers of Oddly
//   from Neynar, then updates the `follows_oddly` column in
//   the Supabase leaderboard table for any matching FIDs.
//
// Also resets follows_oddly=false for leaderboard users who
// are NOT in the follower list (handles unfollows).
// ============================================================

import { getSupabase } from './_supabase.js';

const ODDLY_FID = Number(process.env.ADMIN_FID || 1014465);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
  if (!NEYNAR_API_KEY) {
    return res.status(500).json({ error: 'Missing NEYNAR_API_KEY env var' });
  }

  let supabase;
  try {
    supabase = getSupabase();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  try {
    // 1. Fetch ALL followers of Oddly from Neynar (paginated, max 100 per page)
    const followerFids = [];
    let cursor = null;
    let pageCount = 0;
    const MAX_PAGES = 50; // Safety limit: 50 pages × 100 = 5000 followers max

    do {
      let url = `https://api.neynar.com/v2/farcaster/followers?fid=${ODDLY_FID}&limit=100`;
      if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;

      const neynarRes = await fetch(url, {
        headers: {
          'x-api-key': NEYNAR_API_KEY,
          'accept': 'application/json'
        }
      });

      if (!neynarRes.ok) {
        const errText = await neynarRes.text();
        console.error('Neynar API error:', neynarRes.status, errText);
        return res.status(500).json({ error: `Neynar API returned ${neynarRes.status}` });
      }

      const data = await neynarRes.json();
      const users = data.users || [];

      for (const entry of users) {
        const fid = entry.user?.fid;
        if (fid) followerFids.push(fid);
      }

      cursor = data.next?.cursor || null;
      pageCount++;
    } while (cursor && pageCount < MAX_PAGES);

    console.log(`Fetched ${followerFids.length} followers of FID ${ODDLY_FID} in ${pageCount} pages`);

    // 2. Get all FIDs currently in the leaderboard
    const { data: lbRows, error: lbErr } = await supabase
      .from('leaderboard')
      .select('fid');

    if (lbErr) {
      console.error('Supabase leaderboard read error:', lbErr);
      return res.status(500).json({ error: lbErr.message });
    }

    const leaderboardFids = (lbRows || []).map(r => r.fid);
    const followerSet = new Set(followerFids);

    // 3. Determine which leaderboard users are followers and which are not
    const followingFids = leaderboardFids.filter(fid => followerSet.has(fid));
    const notFollowingFids = leaderboardFids.filter(fid => !followerSet.has(fid));

    let updated = 0;
    let cleared = 0;

    // 4. Set follows_oddly = true for followers
    if (followingFids.length > 0) {
      // Supabase .in() supports up to ~1000 items, batch if needed
      for (let i = 0; i < followingFids.length; i += 500) {
        const batch = followingFids.slice(i, i + 500);
        const { error } = await supabase
          .from('leaderboard')
          .update({ follows_oddly: true })
          .in('fid', batch);
        if (error) console.error('Update followers error:', error);
        else updated += batch.length;
      }
    }

    // 5. Set follows_oddly = false for non-followers
    if (notFollowingFids.length > 0) {
      for (let i = 0; i < notFollowingFids.length; i += 500) {
        const batch = notFollowingFids.slice(i, i + 500);
        const { error } = await supabase
          .from('leaderboard')
          .update({ follows_oddly: false })
          .in('fid', batch);
        if (error) console.error('Clear non-followers error:', error);
        else cleared += batch.length;
      }
    }

    return res.status(200).json({
      ok: true,
      totalFollowers: followerFids.length,
      leaderboardUsers: leaderboardFids.length,
      markedAsFollowing: updated,
      markedAsNotFollowing: cleared,
      pagesScanned: pageCount
    });

  } catch (err) {
    console.error('sync-followers error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
