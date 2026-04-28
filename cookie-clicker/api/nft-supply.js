// api/nft-supply.js
export default async function handler(req, res) {
  // Mock supply for now since we don't have DB access to create new tables
  return res.status(200).json({ supply: 42, max: 100 });
}
