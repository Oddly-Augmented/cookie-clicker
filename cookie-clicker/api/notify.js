// ============================================================
// Daily push-notification job
// ------------------------------------------------------------
// Triggered by Vercel cron once a day. Reads every notification
// token from Supabase, batches by destination URL (max 100 per
// request), and sends a friendly "come back and bake" reminder.
// ============================================================

import { getSupabase } from './_supabase.js';
import { randomUUID } from 'node:crypto';

const MESSAGES = [
  { title: 'Your bakers miss you',     body: 'Pop in and collect your daily bonus.' },
  { title: 'Fresh cookies are ready',  body: 'Tap to claim your idle batch.' },
  { title: 'Golden cookie alert',      body: 'A 5x bonus could appear any minute now.' },
  { title: 'Daily bonus is waiting',   body: 'Come grab a stack of free cookies.' },
  { title: 'The oven is hot',          body: 'Time for another round of clicking.' }
];

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let supabase;
  try {
    supabase = getSupabase();
  } catch (err) {
    console.error('Notify config error:', err.message);
    return res.status(500).json({ error: err.message });
  }

  try {
    const { data: rows, error } = await supabase
      .from('notifications')
      .select('fid, url, token');

    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Could not load tokens' });
    }
    if (!rows || rows.length === 0) {
      return res.status(200).json({ ok: true, sent: 0, note: 'no subscribers' });
    }

    // Group tokens by destination URL (each Farcaster client has its own).
    const byUrl = new Map();
    for (const row of rows) {
      if (!byUrl.has(row.url)) byUrl.set(row.url, []);
      byUrl.get(row.url).push(row.token);
    }

    const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    const targetUrl = 'https://cookie-clicker-hv5w.vercel.app/';
    const notificationId = randomUUID();

    let totalSent = 0;
    const errors = [];

    for (const [url, tokens] of byUrl.entries()) {
      for (let i = 0; i < tokens.length; i += 100) {
        const batch = tokens.slice(i, i + 100);
        try {
          const r = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              notificationId,
              title: msg.title.slice(0, 32),
              body:  msg.body.slice(0, 128),
              targetUrl,
              tokens: batch
            })
          });
          if (!r.ok) errors.push(`${url}: ${r.status}`);
          else totalSent += batch.length;

          try {
            const result = await r.json();
            const invalid = [
              ...(result?.result?.invalidTokens || []),
              ...(result?.result?.rateLimitedTokens || [])
            ];
            if (invalid.length) {
              await supabase.from('notifications').delete().in('token', invalid);
            }
          } catch { /* response wasn't JSON, ignore */ }
        } catch (err) {
          errors.push(`${url}: ${err.message}`);
        }
      }
    }

    return res.status(200).json({ ok: true, sent: totalSent, errors });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
