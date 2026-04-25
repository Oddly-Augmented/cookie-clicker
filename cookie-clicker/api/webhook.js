// ============================================================
// Farcaster Mini App webhook
// ------------------------------------------------------------
// Receives events when users add/remove the app or
// enable/disable notifications, and stores their notification
// token in Supabase so the daily cron job can push to them.
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Farcaster sends a JFS-signed payload. We don't verify the
    // signature here for simplicity — the URL itself is the secret.
    // Body shape: { header, payload, signature } where each is base64url JSON.
    const body = req.body || {};
    const payloadB64 = body.payload;
    const headerB64  = body.header;
    if (!payloadB64 || !headerB64) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    const header  = JSON.parse(Buffer.from(headerB64,  'base64url').toString());
    const fid     = header.fid;
    const event   = payload.event;

    if (!fid || !event) {
      return res.status(400).json({ error: 'Missing fid or event' });
    }

    if (event === 'frame_added' || event === 'notifications_enabled') {
      const url   = payload.notificationDetails?.url;
      const token = payload.notificationDetails?.token;
      if (url && token) {
        await supabase
          .from('notifications')
          .upsert({ fid, url, token }, { onConflict: 'fid' });
      }
    } else if (event === 'frame_removed' || event === 'notifications_disabled') {
      await supabase.from('notifications').delete().eq('fid', fid);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
