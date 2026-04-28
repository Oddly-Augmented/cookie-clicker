async function testNeynar() {
  const oddlyFid = '1014465';
  const testViewerFid = '3'; // using some random fid to test
  
  const res = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${oddlyFid}&viewer_fid=${testViewerFid}`, {
    headers: {
      'api_key': '58E7793F-6090-4814-B85C-6F6B85B82E24',
      'accept': 'application/json'
    }
  });
  
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

testNeynar();
