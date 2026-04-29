// ============================================================
// Quick Auth — Farcaster JWT verification helper
// ------------------------------------------------------------
// Verifies the Bearer token sent by sdk.quickAuth.fetch() and
// returns the FID (token.sub) of the authenticated user.
//
// Usage:
//   import { verifyAuth } from './_auth.js';
//   const auth = await verifyAuth(req);
//   if (!auth.ok) return res.status(401).json({ error: auth.error });
//   const fid = auth.fid; // Trust this — never trust a fid from the request body.
// ============================================================

import { createClient, Errors } from '@farcaster/quick-auth';

// One client instance per warm Lambda
let _client = null;
function getClient() {
  if (_client) return _client;
  _client = createClient();
  return _client;
}

export async function verifyAuth(req) {
  const auth = req.headers?.authorization || req.headers?.Authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Missing Authorization header' };
  }
  const token = auth.slice('Bearer '.length).trim();
  if (!token) {
    return { ok: false, status: 401, error: 'Empty token' };
  }

  // The domain that issued the token must match the host running the app.
  // Vercel sets `host` on every incoming request.
  const domain = (req.headers?.host || '').split(':')[0];
  if (!domain) {
    return { ok: false, status: 500, error: 'Missing host header' };
  }

  try {
    const payload = await getClient().verifyJwt({ token, domain });
    const fid = Number(payload?.sub);
    if (!Number.isFinite(fid)) {
      return { ok: false, status: 401, error: 'Token has no FID' };
    }
    return { ok: true, fid, payload };
  } catch (err) {
    if (err instanceof Errors.InvalidTokenError) {
      return { ok: false, status: 401, error: 'Invalid token' };
    }
    console.error('verifyAuth unexpected error:', err);
    return { ok: false, status: 500, error: 'Auth verification failed' };
  }
}

// The single hardcoded admin FID — kept here so it lives in one spot.
// Override in Vercel with `ADMIN_FID` env var.
export const ADMIN_FID = Number(process.env.ADMIN_FID || 1014465);
