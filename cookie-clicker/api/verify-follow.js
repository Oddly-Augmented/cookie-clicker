export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const viewer_fid = req.query.viewer_fid;
  if (!viewer_fid) {
    return res.status(400).json({ error: 'Missing viewer_fid' });
  }

  const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
  if (!NEYNAR_API_KEY) {
    console.error('Missing NEYNAR_API_KEY in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const oddlyFid = String(process.env.ADMIN_FID || '1014465');

  try {
    const neynarRes = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${oddlyFid}&viewer_fid=${viewer_fid}`, {
      headers: {
        'api_key': NEYNAR_API_KEY,
        'accept': 'application/json'
      }
    });

    if (!neynarRes.ok) {
      console.error('Neynar API returned an error:', neynarRes.status);
      return res.status(500).json({ error: 'Neynar API error' });
    }

    const data = await neynarRes.json();
    const user = data.users && data.users[0];
    
    if (!user) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    const following = user.viewer_context?.following === true;
    return res.status(200).json({ following });

  } catch (err) {
    console.error('Verify Follow error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
