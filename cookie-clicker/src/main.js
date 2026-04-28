import './style.css';
import { sdk } from '@farcaster/miniapp-sdk';
import { createThirdwebClient, getContract, encode, waitForReceipt } from "thirdweb";
import { claimTo, getActiveClaimCondition, totalSupply } from "thirdweb/extensions/erc1155";
import { allowance, approve } from "thirdweb/extensions/erc20";
import { defineChain } from "thirdweb/chains";

const thirdwebClient = createThirdwebClient({
  clientId: "24a76854b807bca33c794a450e4a69d7",
});

const nftContract = getContract({
  client: thirdwebClient,
  chain: defineChain(8453),
  address: "0xB8a942d85A42b926C23B7f33A255b8DF384b15c8",
});

const usdcContract = getContract({
  client: thirdwebClient,
  chain: defineChain(8453),
  address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", // Base USDC
});

// ============================================================
// Upgrade definitions
// ============================================================
const UPGRADES = [
  { id: 'cursor',  name: 'Click Bot',     emoji: '🤖',  kind: 'click', power: 1,        baseCost: 15,             orbit: 'inner' },
  { id: 'spoon',   name: 'Auto-Liker',    emoji: '💜',  kind: 'click', power: 5,        baseCost: 100,            orbit: 'inner' },
  { id: 'whisk',   name: 'Recast Engine', emoji: '🔁',  kind: 'click', power: 25,       baseCost: 1_500,          orbit: 'inner' },
  { id: 'mixer',   name: 'Based Node',    emoji: '🔵',  kind: 'click', power: 100,      baseCost: 25_000,         orbit: 'inner' },
  { id: 'grandma', name: 'Click Farm',    emoji: '📱',  kind: 'cps',   power: 1,        baseCost: 50,             orbit: 'mid' },
  { id: 'farm',    name: 'AI Clicker',    emoji: '🧠',  kind: 'cps',   power: 5,        baseCost: 500,            orbit: 'mid' },
  { id: 'mine',    name: 'Crypto Miner',  emoji: '⛏️', kind: 'cps',   power: 25,       baseCost: 5_000,          orbit: 'mid' },
  { id: 'factory', name: 'Meme Factory',  emoji: '🐸',  kind: 'cps',   power: 100,      baseCost: 50_000,         orbit: 'mid' },
  { id: 'bank',    name: 'DeFi Protocol', emoji: '🏦',  kind: 'cps',   power: 500,      baseCost: 500_000,        orbit: 'outer' },
  { id: 'temple',  name: 'Farcaster Hub', emoji: '🟣',  kind: 'cps',   power: 2_500,    baseCost: 5_000_000,      orbit: 'outer' },
  { id: 'wizard',  name: 'LLM Cluster',   emoji: '🖥️', kind: 'cps',   power: 12_500,   baseCost: 50_000_000,     orbit: 'outer', fx: 'shoot' },
  { id: 'rocket',  name: 'AGI',           emoji: '🌌',  kind: 'cps',   power: 60_000,   baseCost: 500_000_000,    orbit: 'outer' },
  { id: 'quantum', name: 'Quantum Chain', emoji: '⚛️', kind: 'cps',   power: 250_000,  baseCost: 5_000_000_000,  orbit: 'outer' },
  { id: 'dao',     name: 'DAO Council',   emoji: '🏛️', kind: 'cps',   power: 1_500_000,baseCost: 50_000_000_000, orbit: 'outer' },
  { id: 'meta',    name: 'Metaverse',     emoji: '🌐',  kind: 'cps',   power: 10_000_000,baseCost:500_000_000_000, orbit: 'outer' },
  { id: 'singularity',name:'Singularity', emoji: '✨',  kind: 'cps',   power:100_000_000,baseCost:5_000_000_000_000,orbit:'outer' },
];

const COST_MULTIPLIER = 1.15;
const MAX_ORBIT = 8; // visual cap only

// --- Tier upgrades (generated): each doubles a building's output ---
const TIER_DEFS = [
  { at: 1,  costMult: 10,     tag: 'v2.0' },
  { at: 5,  costMult: 100,    tag: 'Pro' },
  { at: 25, costMult: 5_000,  tag: 'Ultra' },
  { at: 50, costMult: 100_000,tag: 'Quantum' },
];
const TIER_UPGRADES = UPGRADES.flatMap(u =>
  TIER_DEFS.map(t => ({
    id: `${u.id}_t${t.at}`, buildingId: u.id, name: `${u.name} ${t.tag}`,
    emoji: u.emoji, need: t.at, cost: Math.ceil(u.baseCost * t.costMult),
    desc: `${u.name} output ×2`
  }))
);

// --- Prestige upgrades (persist across resets) ---
const PRESTIGE_UPGRADES = [
  { id: 'genesis',  name: 'Genesis Block',    emoji: '🧱', cost: 1,   desc: 'Start each run with 10,000 cookies' },
  { id: 'diamond',  name: 'Diamond Hands',    emoji: '💎', cost: 2,   desc: '+50% offline earnings' },
  { id: 'moon',     name: 'Moon Math',        emoji: '🌙', cost: 3,   desc: 'Golden cookies appear 3× more often' },
  { id: 'whale',    name: 'Whale Wallet',     emoji: '🐋', cost: 5,   desc: 'Start with 5 free Click Farms' },
  { id: 'lucky',    name: 'Lucky Drops',      emoji: '🍀', cost: 8,   desc: 'Golden cookie bonus is 25×' },
  { id: 'fomo',     name: 'FOMO Shield',      emoji: '🛡️', cost: 12,  desc: 'Daily bonus is 5× larger' },
  { id: 'protocol', name: 'Protocol Upgrade', emoji: '⬆️', cost: 15,  desc: '+100% all building output' },
  { id: 'recursive',name: 'Recursive AGI',    emoji: '🔄', cost: 25,  desc: 'Prestige chips give +5% CpS each' },
  { id: 'wagmi',    name: 'WAGMI',            emoji: '🚀', cost: 50,  desc: 'All CpS ×3' },
];

const ACHIEVEMENTS = [
  // Cookie milestones
  { id: 'c1',    need: 1,               label: 'First Click',        emoji: '🍪', kind: 'cookies' },
  { id: 'c2',    need: 100,             label: 'Getting Started',    emoji: '🥠', kind: 'cookies' },
  { id: 'c3',    need: 1_000,           label: 'A Thousand!',        emoji: '🎉', kind: 'cookies' },
  { id: 'c4',    need: 10_000,          label: '10K Club',           emoji: '🌟', kind: 'cookies' },
  { id: 'c5',    need: 100_000,         label: 'Six Figures',        emoji: '💰', kind: 'cookies' },
  { id: 'c6',    need: 1_000_000,       label: 'Millionaire',        emoji: '💎', kind: 'cookies' },
  { id: 'c7',    need: 10_000_000,      label: 'Deca-Millionaire',   emoji: '💫', kind: 'cookies' },
  { id: 'c8',    need: 100_000_000,     label: 'Centimillionaire',   emoji: '🌕', kind: 'cookies' },
  { id: 'c9',    need: 1_000_000_000,   label: 'Billionaire',        emoji: '👑', kind: 'cookies' },
  { id: 'c10',   need: 100_000_000_000, label: 'Cookie Whale',       emoji: '🐋', kind: 'cookies' },
  // Click milestones
  { id: 'cl1',   need: 100,     label: '100 Clicks',         emoji: '👆', kind: 'clicks' },
  { id: 'cl2',   need: 1_000,   label: '1K Clicks',          emoji: '✋', kind: 'clicks' },
  { id: 'cl3',   need: 10_000,  label: '10K Clicks',         emoji: '💪', kind: 'clicks' },
  { id: 'cl4',   need: 100_000, label: '100K Clicks',        emoji: '🤖', kind: 'clicks' },
  // Building milestones
  { id: 'b1',    need: 1,   label: 'First Purchase',     emoji: '📝', kind: 'buildings' },
  { id: 'b2',    need: 10,  label: '10 Buildings',       emoji: '🏗️', kind: 'buildings' },
  { id: 'b3',    need: 50,  label: '50 Buildings',       emoji: '🏢', kind: 'buildings' },
  { id: 'b4',    need: 100, label: '100 Buildings',      emoji: '🏙️', kind: 'buildings' },
  { id: 'b5',    need: 200, label: '200 Buildings',      emoji: '🌆', kind: 'buildings' },
  // Tier milestones
  { id: 't1',    need: 1,   label: 'First Upgrade',      emoji: '⬆️', kind: 'tiers' },
  { id: 't2',    need: 10,  label: '10 Upgrades',        emoji: '🔧', kind: 'tiers' },
  { id: 't3',    need: 25,  label: '25 Upgrades',        emoji: '⚙️', kind: 'tiers' },
  // Prestige milestones
  { id: 'p1',    need: 1,   label: 'First Prestige',     emoji: '🔝', kind: 'ascensions' },
  { id: 'p2',    need: 3,   label: 'Triple Prestige',    emoji: '♾️', kind: 'ascensions' },
  { id: 'p3',    need: 10,  label: 'Prestige Master',    emoji: '🌠', kind: 'ascensions' },
  // Special
  { id: 'sg',    need: 1_000_000, label: '1M CpS',        emoji: '⚡', kind: 'cps' },
  // Ad support
  { id: 'ad1',   need: 1,         label: 'Ad Supporter',  emoji: '📺', kind: 'adViews' },
  // Social
  { id: 'f1',    need: 1,         label: 'Follow odd',    emoji: '💜', kind: 'follow' },
];

// ============================================================
// State (persisted in localStorage)
// ============================================================
const SAVE_KEY = 'farClick:v2';

const defaultState = () => ({
  cookies: 0,
  totalEarned: 0,
  lifetimeEarned: 0,
  totalClicks: 0,
  owned: Object.fromEntries(UPGRADES.map(u => [u.id, 0])),
  tiersBought: [],
  unlocked: [],
  // Prestige
  prestigeLevel: 0,
  prestigeChips: 0,
  prestigeUpgrades: [],
  ascensions: 0,
  // Meta
  lastPlayed: Date.now(),
  lastDailyClaim: 0,
  promptedAdd: false,
  lastSubmittedScore: 0,
  // Ad boost
  adBoostEnd: 0,
  lastAdBoost: 0,
  adViews: 0,
  // Web3
  ownsGoldenNFT: false
});

// Migrate from v1 save
function migrateV1() {
  try {
    const old = localStorage.getItem('cookieClicker:v1');
    if (!old) return null;
    const d = JSON.parse(old);
    return { ...defaultState(), ...d, lifetimeEarned: d.totalEarned || 0, totalClicks: 0, tiersBought: [], prestigeLevel: 0, prestigeChips: 0, prestigeUpgrades: [], ascensions: 0 };
  } catch { return null; }
}

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const saved = { ...defaultState(), ...JSON.parse(raw) };
      // Guard against null values from corrupted saves
      saved.prestigeLevel = saved.prestigeLevel ?? 0;
      saved.prestigeChips = saved.prestigeChips ?? 0;
      saved.prestigeUpgrades = saved.prestigeUpgrades ?? [];
      saved.ascensions = saved.ascensions ?? 0;
      saved.lifetimeEarned = saved.lifetimeEarned ?? saved.totalEarned ?? 0;
      saved.totalClicks = saved.totalClicks ?? 0;
      saved.lastSubmittedScore = saved.lastSubmittedScore ?? 0;
      saved.adBoostEnd = saved.adBoostEnd ?? 0;
      saved.lastAdBoost = saved.lastAdBoost ?? 0;
      saved.adViews = saved.adViews ?? 0;
      saved.ownsGoldenNFT = saved.ownsGoldenNFT ?? false;
      saved.followsOddly = saved.followsOddly ?? false;
      return saved;
    }
    const migrated = migrateV1();
    if (migrated) return migrated;
    return defaultState();
  } catch { return defaultState(); }
}

function saveState() {
  state.lastPlayed = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    syncToCloud();
  } catch (e) {
    console.error('Local save failed', e);
  }
}

let lastCloudSync = 0;
let isCloudLoading = true;
async function syncToCloud() {
  if (isCloudLoading) return; // Wait for initial load to finish
  const now = Date.now();
  if (now - lastCloudSync < 10000) return; // Sync at most every 10 seconds
  
  try {
    const ctx = await sdk.context;
    const fid = ctx?.user?.fid;
    if (!fid) return;

    lastCloudSync = now;
    await sdk.quickAuth.fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fid, state })
    });
  } catch (e) {
    console.error('Cloud sync failed', e);
  }
}

async function loadFromCloud() {
  try {
    const ctx = await sdk.context;
    const fid = ctx?.user?.fid;
    if (!fid) {
      isCloudLoading = false;
      return;
    }

    const r = await sdk.quickAuth.fetch(`/api/sync?fid=${fid}`);
    if (!r.ok) {
      isCloudLoading = false;
      return;
    }
    
    const data = await r.json();
    if (!data || !data.state) {
      isCloudLoading = false;
      return;
    }

    const cloudState = data.state;
    
    // Simple conflict resolution: Cloud wins if it has more lifetime cookies
    // or if the local save is non-existent.
    const cloudCookies = cloudState.lifetimeEarned || 0;
    const localCookies = state.lifetimeEarned || 0;
    
    if (cloudCookies > localCookies) {
      console.log(`Cloud sync: Found better save (${fmt(cloudCookies)} > ${fmt(localCookies)})`);
      state = Object.assign(state, cloudState);
      localStorage.setItem(SAVE_KEY, JSON.stringify(state)); // Direct save to avoid re-syncing immediately
      renderOrbits();
      render();
      toast('☁️', 'Cloud Sync', 'Progress restored from your account.');
    }
    isCloudLoading = false;
  } catch (e) {
    console.error('Cloud load failed', e);
    isCloudLoading = false;
  }
}

setInterval(saveState, 3000);
window.addEventListener('beforeunload', saveState);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveState(); });

// ============================================================
// Helpers
// ============================================================
const cost     = u => Math.ceil(u.baseCost * COST_MULTIPLIER ** state.owned[u.id]);

// Multiplier from tier upgrades for a building
const tierMult = uid => Math.pow(2, TIER_UPGRADES.filter(t => t.buildingId === uid && state.tiersBought.includes(t.id)).length);

// Global multipliers
const milkMult     = () => 1 + state.unlocked.length * 0.01;
const prestigeMult = () => {
  const rate = state.prestigeUpgrades.includes('recursive') ? 5 : 1;
  return 1 + state.prestigeLevel * rate / 100;
};
const protocolMult = () => state.prestigeUpgrades.includes('protocol') ? 2 : 1;
const wagmiMult    = () => state.prestigeUpgrades.includes('wagmi') ? 3 : 1;
const nftMult      = () => state.ownsGoldenNFT ? 2 : 1;
const globalMult   = () => milkMult() * prestigeMult() * protocolMult() * wagmiMult() * nftMult();

const adBoostActive = () => Date.now() < (state.adBoostEnd || 0);
const adBoostMult   = () => adBoostActive() ? 1.5 : 1;

const perClick = () => (1 + UPGRADES.filter(u => u.kind === 'click').reduce((s, u) => s + u.power * state.owned[u.id] * tierMult(u.id), 0)) * globalMult() * adBoostMult();
const perSec   = () => UPGRADES.filter(u => u.kind === 'cps').reduce((s, u) => s + u.power * state.owned[u.id] * tierMult(u.id), 0) * globalMult() * adBoostMult();

// Prestige calculation
const calcPrestigeLevel = () => Math.floor(Math.sqrt(state.lifetimeEarned / 1e9));
const newChipsOnAscend  = () => Math.max(0, calcPrestigeLevel() - state.prestigeLevel);
const totalBuildings    = () => Object.values(state.owned).reduce((a, b) => a + b, 0);

const fmt = n => {
  if (n < 1_000) return Math.floor(n).toString();
  const units = ['K', 'M', 'B', 'T', 'Qa', 'Qi'];
  let i = -1;
  while (n >= 1_000 && i < units.length - 1) { n /= 1_000; i++; }
  return n.toFixed(n < 10 ? 2 : n < 100 ? 1 : 0) + units[i];
};

// ============================================================
// Elements
// ============================================================
const $ = id => document.getElementById(id);
const countEl    = $('count'),    perClickEl = $('perClick'),  perSecEl = $('perSec');
const cookieBtn  = $('cookie'),   shopEl     = $('shop'),      fxEl      = $('fx');
const profileBtn = $('profileBtn');
const lbModal    = $('lbModal'),  lbList     = $('lbList'),    lbClose   = $('lbClose'),  lbYou = $('lbYou');
const userModal  = $('userModal'),userClose  = $('userClose');
const paneUserStats = $('paneUserStats'), paneUserNft = $('paneUserNft');
const userStatsContent = $('userStatsContent');
const profileTabs = document.querySelectorAll('.profile-tab-btn');
const userTabs = document.querySelectorAll('.user-tab-btn');
const paneLeaderboard = $('paneLeaderboard');
const paneAchievements = $('paneAchievements');
const profileTitle = $('profileTitle');
const userTitle = $('userTitle');
const achList    = $('achList'),  achProgress = $('achProgress');
const bonusBar   = $('bonusBar'), bonusProgress = $('bonusProgress'), bonusLabel = $('bonusLabel');
const shopBtn    = $('shopBtn'),  shopDrawer = $('shopDrawer'),shopClose = $('shopClose'), shopBadge = $('shopAffordable');
const quickNftBtn = $('quickNftBtn');
const tabBtns    = document.querySelectorAll('.tab-btn');
const orbits     = { inner: $('orbit-inner'), mid: $('orbit-mid'), outer: $('orbit-outer') };

let activeTab = 'click'; // current shop tab

// ============================================================
// Toasts
// ============================================================
function toast(emoji, text, sub = '') {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span class="t-emoji">${emoji}</span>
                 <span class="t-body"><b>${text}</b>${sub ? `<small>${sub}</small>` : ''}</span>`;
  toastsEl.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3500);
}

// ============================================================
// Shop — items split into Click + CPS tabs
// ============================================================
UPGRADES.forEach(u => {
  const row = document.createElement('button');
  row.className = 'shop-item';
  row.dataset.id = u.id;
  row.dataset.kind = u.kind;
  row.innerHTML = `
    <span class="emoji">${u.emoji}</span>
    <span class="info">
      <span class="name">${u.name} <span class="count" data-count></span></span>
      <span class="effect">+${fmt(u.power)} ${u.kind === 'click' ? '/click' : '/sec'}</span>
    </span>
    <span class="cost" data-cost></span>`;
  row.addEventListener('click', () => buy(u));
  shopEl.appendChild(row);
});

// Tier upgrade rows
TIER_UPGRADES.forEach(t => {
  const row = document.createElement('button');
  row.className = 'shop-item tier-item';
  row.dataset.id = t.id;
  row.dataset.kind = 'upgrade';
  row.innerHTML = `
    <span class="emoji">${t.emoji}</span>
    <span class="info">
      <span class="name">${t.name}</span>
      <span class="effect">${t.desc} (need ${t.need})</span>
    </span>
    <span class="cost" data-cost>${fmt(t.cost)}</span>`;
  row.addEventListener('click', () => buyTier(t));
  shopEl.appendChild(row);
});

// NFT Row
const nftBtn = document.createElement('button');
nftBtn.className = 'shop-item shop-nft tab-hidden';
nftBtn.dataset.kind = 'nft';
nftBtn.innerHTML = `
  <span class="emoji">💎</span>
  <span class="info">
    <span class="name">Golden Cookie NFT</span>
    <span class="effect">2× Multiplier & Golden visual! <span id="nftSupplyText">Loading supply...</span></span>
  </span>
  <span class="cost" id="nftCost" style="color:#4caf50;">$2</span>`;
nftBtn.addEventListener('click', () => buyGoldenNFT());
shopEl.appendChild(nftBtn);

// Fetch live NFT supply from blockchain
(async function updateNftSupply() {
  try {
    const [claimed, condition] = await Promise.all([
      totalSupply({ contract: nftContract, id: 0n }),
      getActiveClaimCondition({ contract: nftContract, tokenId: 0n })
    ]);
    const max = condition.maxClaimableSupply || 100n;
    const el = document.getElementById('nftSupplyText');
    if (el) el.textContent = `${claimed}/${max} claimed`;
  } catch (e) {
    console.error('Supply fetch failed:', e);
    const el = document.getElementById('nftSupplyText');
    if (el) el.textContent = 'Max Supply: 100';
  }
})();

function buyTier(t) {
  if (state.tiersBought.includes(t.id)) return;
  if (state.owned[t.buildingId] < t.need) return;
  if (state.cookies < t.cost) return;
  state.cookies -= t.cost;
  state.tiersBought.push(t.id);
  toast(t.emoji, t.name, t.desc);
  haptic('medium');
  render();
}

function buy(u) {
  const c = cost(u);
  if (state.cookies < c) return;
  state.cookies -= c;
  state.owned[u.id] += 1;
  haptic('light');
  renderOrbits();
  render();
}

window.buyGoldenNFT = async function() {
  try {
    toast('💎', 'Connecting...', 'Requesting wallet address');
    
    // 1. Get the user's connected wallet address via Farcaster SDK
    const accounts = await sdk.wallet.ethProvider.request({ method: 'eth_requestAccounts' });
    const userAddress = accounts[0];

    const ctx = await sdk.context;
    const fid = ctx?.user?.fid;

    // Admin (Oddly) can always re-buy for testing purposes
    if (fid !== 1014465 && state.ownsGoldenNFT) {
      toast('💎', 'You already own this NFT!');
      return;
    }

    if (!userAddress) throw new Error('No wallet connected');

    // 2. Fetch the active claim condition to get the exact required price
    const condition = await getActiveClaimCondition({ 
      contract: nftContract, 
      tokenId: 0n 
    });
    const pricePerToken = condition.pricePerToken;
    const currency = condition.currency;

    // 3. Handle ERC20 (USDC) Approval if needed
    if (pricePerToken > 0n && currency.toLowerCase() === usdcContract.address.toLowerCase()) {
      toast('💎', 'Checking allowance...', 'Verifying USDC approval');
      const currentAllowance = await allowance({
        contract: usdcContract,
        owner: userAddress,
        spender: nftContract.address
      });

      if (currentAllowance < pricePerToken) {
        // Approve only the exact price + 10% buffer for Thirdweb platform fees
        // For a $2 NFT this approves ~$2.20 worth of USDC, not the user's entire balance
        const approvalAmount = pricePerToken + (pricePerToken / 10n);
        toast('💎', 'Approval needed', `Please approve $${Number(approvalAmount) / 1e6} USDC`);
        const approveTx = approve({
          contract: usdcContract,
          spender: nftContract.address,
          amountWei: approvalAmount
        });
        const approveData = await encode(approveTx);
        
        const approveHash = await sdk.wallet.ethProvider.request({
          method: 'eth_sendTransaction',
          params: [{
            from: userAddress,
            to: usdcContract.address,
            data: approveData,
            value: '0x0'
          }]
        });

        toast('💎', 'Approving...', 'Waiting for the blockchain to confirm approval...');
        await waitForReceipt({
          client: thirdwebClient,
          chain: defineChain(8453),
          transactionHash: approveHash
        });
        
        toast('✅', 'USDC Approved!', 'The network is syncing. Tap Buy again in a few seconds to claim your NFT!');
        return; // Stop the flow here to let Warpcast's simulation nodes catch up before the user clicks Buy again
      }
    }

    toast('💎', 'Confirm Purchase', 'Requesting final purchase transaction...');
    
    // 4. Dynamically generate the claim transaction using Thirdweb
    const tx = claimTo({
      contract: nftContract,
      to: userAddress,
      tokenId: 0n,
      quantity: 1n,
    });
    
    const data = await encode(tx);
    
    let priceInWei = 0n;
    if (typeof tx.value === 'function') {
      priceInWei = await tx.value();
    } else if (tx.value !== undefined) {
      priceInWei = await tx.value;
    }

    // 5. Send the claim transaction
    const result = await sdk.wallet.ethProvider.request({
      method: 'eth_sendTransaction',
      params: [{
        from: userAddress,
        to: nftContract.address,
        value: '0x' + priceInWei.toString(16),
        data: data
      }]
    });
    
    if (result) {
      state.ownsGoldenNFT = true;
      saveState();
      toast('💎', 'Golden NFT Acquired!', '2x multiplier active and your cookie is golden!');
      haptic('heavy');
      render();
      // Refresh supply count
      try {
        const newClaimed = await totalSupply({ contract: nftContract, id: 0n });
        const el = document.getElementById('nftSupplyText');
        if (el) el.textContent = `${newClaimed}/100 claimed`;
      } catch {}
    }
  } catch (err) {
    console.error('NFT Purchase failed:', err);
    toast('❌', 'Transaction failed or canceled');
  }
};

// Tabs
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    activeTab = btn.dataset.tab;
    tabBtns.forEach(b => b.classList.toggle('active', b === btn));
    render();
  });
});

if (quickNftBtn) {
  quickNftBtn.addEventListener('click', () => {
    shopDrawer.classList.remove('hidden');
    requestAnimationFrame(() => shopDrawer.classList.add('open'));
    document.querySelector('.openads-floating')?.style.setProperty('display', 'none', 'important');
    activeTab = 'nft';
    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === 'nft'));
    haptic('light');
    render();
  });
}

// Drawer open/close
shopBtn.addEventListener('click', () => {
  shopDrawer.classList.remove('hidden');
  requestAnimationFrame(() => shopDrawer.classList.add('open'));
  document.querySelector('.openads-floating')?.style.setProperty('display', 'none', 'important');
  haptic('light');
});
shopClose.addEventListener('click', closeShop);
shopDrawer.addEventListener('click', e => { if (e.target === shopDrawer) closeShop(); });
function closeShop() {
  shopDrawer.classList.remove('open');
  document.querySelector('.openads-floating')?.style.setProperty('display', 'block', 'important');
  setTimeout(() => shopDrawer.classList.add('hidden'), 250);
}

// ============================================================
// Orbits + sparkles
// ============================================================
function renderOrbits() {
  for (const ring of Object.values(orbits)) ring.innerHTML = '';
  const groups = { inner: [], mid: [], outer: [] };
  for (const u of UPGRADES) {
    const n = Math.min(state.owned[u.id], MAX_ORBIT);
    for (let i = 0; i < n; i++) groups[u.orbit].push(u);
  }
  for (const [ring, list] of Object.entries(groups)) {
    list.forEach((u, i) => {
      const angle = (i / list.length) * 360;
      const helper = document.createElement('span');
      helper.className = 'helper' + (u.fx ? ` fx-${u.fx}` : '');
      helper.style.transform = `rotate(${angle}deg) translateY(var(--r)) rotate(${-angle}deg)`;
      helper.textContent = u.emoji;
      orbits[ring].appendChild(helper);
    });
  }
}
function spawnSparkle() {
  if (state.owned.wizard <= 0) return;
  const s = document.createElement('span');
  s.className = 'sparkle';
  s.textContent = '✨';
  s.style.setProperty('--a', `${Math.random() * 360}deg`);
  fxEl.appendChild(s);
  s.addEventListener('animationend', () => s.remove());
}

// ============================================================
// Golden Cookie — random 5x click bonus
// ============================================================
let bonusActive = false;
let bonusBarInterval = null;

function scheduleGoldenCookie() {
  const delay = state.prestigeUpgrades.includes('moon') ? 0.5 : 1;
  setTimeout(showGoldenCookie, (120 + Math.random() * 180) * 1000 * delay);
}

function showGoldenCookie() {
  const gc = document.createElement('div');
  gc.className = 'golden-cookie';
  gc.textContent = '✨🍪';
  gc.style.left = `${15 + Math.random() * 70}%`;
  gc.style.top  = `${20 + Math.random() * 60}%`;
  document.body.appendChild(gc);

  const expire = setTimeout(() => {
    gc.classList.add('fade-out');
    setTimeout(() => gc.remove(), 500);
    scheduleGoldenCookie();
  }, 15_000);

  gc.addEventListener('click', () => {
    clearTimeout(expire);
    gc.classList.add('fade-out');
    setTimeout(() => gc.remove(), 300);
    activateBonus();
  });
}

function activateBonus() {
  bonusActive = true;
  clearInterval(bonusBarInterval);

  const DURATION = 30_000;
  const end = Date.now() + DURATION;
  bonusBar.classList.add('active');
  bonusProgress.style.width = '100%';

  bonusBarInterval = setInterval(() => {
    const remaining = Math.max(0, end - Date.now());
    bonusProgress.style.width = `${(remaining / DURATION) * 100}%`;
    bonusLabel.textContent   = `✨ 5× BONUS — ${Math.ceil(remaining / 1000)}s`;
    if (remaining <= 0) {
      clearInterval(bonusBarInterval);
      bonusActive = false;
      bonusBar.classList.remove('active');
      toast('⏰', 'Bonus ended', 'Keep clicking!');
    }
  }, 200);

  const bonusMult = state.prestigeUpgrades.includes('lucky') ? 10 : 5;
  toast('✨', 'Golden Cookie!', `${bonusMult}× cookies per click for 30 seconds!`);
  haptic('heavy');
  scheduleGoldenCookie();
}

// ============================================================
// Ad Boost — 1.5× CpS for 5 min, 3hr cooldown
// ============================================================
const AD_BOOST_DURATION = 5 * 60 * 1000;   // 5 minutes
const AD_BOOST_COOLDOWN = 3 * 60 * 60 * 1000; // 3 hours

function activateAdBoost() {
  const now = Date.now();
  // Check cooldown
  if (now - (state.lastAdBoost || 0) < AD_BOOST_COOLDOWN) {
    const remaining = AD_BOOST_COOLDOWN - (now - state.lastAdBoost);
    const mins = Math.ceil(remaining / 60000);
    toast('⏳', 'Boost on cooldown', `Try again in ${mins} min`);
    return;
  }
  state.adViews = (state.adViews || 0) + 1;
  state.lastAdBoost = now;
  state.adBoostEnd = now + AD_BOOST_DURATION;
  saveState();
  toast('📺', 'Ad Boost Active!', '1.5× all production for 5 minutes!');
  haptic('medium');
  checkAchievements();

  // Show bonus bar for ad boost
  clearInterval(bonusBarInterval);
  bonusBar.classList.add('active');
  bonusProgress.style.width = '100%';
  bonusBarInterval = setInterval(() => {
    const rem = Math.max(0, state.adBoostEnd - Date.now());
    bonusProgress.style.width = `${(rem / AD_BOOST_DURATION) * 100}%`;
    bonusLabel.textContent = `📺 1.5× AD BOOST — ${Math.ceil(rem / 1000)}s`;
    if (rem <= 0) {
      clearInterval(bonusBarInterval);
      bonusBar.classList.remove('active');
      toast('⏰', 'Ad Boost ended', 'Thanks for supporting!');
    }
  }, 200);
}

// Detect ad iframe click via focus/blur
(function detectAdClick() {
  const adFrame = document.querySelector('.openads-floating');
  if (!adFrame) return;
  window.addEventListener('blur', () => {
    setTimeout(() => {
      if (document.activeElement === adFrame || document.activeElement?.tagName === 'IFRAME') {
        activateAdBoost();
        // Refocus window so user can keep clicking
        window.focus();
      }
    }, 100);
  });
})();

// ============================================================
// Click cookie
// ============================================================
cookieBtn.addEventListener('click', () => {
  const bonusMult = bonusActive ? (state.prestigeUpgrades.includes('lucky') ? 10 : 5) : 1;
  const gained = perClick() * bonusMult;
  state.cookies += gained;
  state.totalEarned += gained;
  state.lifetimeEarned += gained;
  state.totalClicks += 1;
  haptic('light');
  cookieBtn.classList.remove('pop');
  void cookieBtn.offsetWidth;
  cookieBtn.classList.add('pop');
  render();
  checkAchievements();
  maybePromptAdd();
});

// ============================================================
// Render
// ============================================================
function render() {
  countEl.textContent    = fmt(state.cookies);
  const bonusMult = bonusActive ? (state.prestigeUpgrades.includes('lucky') ? 10 : 5) : 1;
  perClickEl.textContent = fmt(perClick() * bonusMult);
  perSecEl.textContent   = fmt(perSec());

  let affordable = 0;
  shopEl.querySelectorAll('.shop-item:not(.tier-item)').forEach(row => {
    const u = UPGRADES.find(x => x.id === row.dataset.id);
    if (!u) return;
    const c = cost(u);
    row.querySelector('[data-cost]').textContent  = fmt(c);
    row.querySelector('[data-count]').textContent = state.owned[u.id] ? `×${state.owned[u.id]}` : '';
    const canAfford = state.cookies >= c;
    row.disabled = !canAfford;
    row.classList.toggle('tab-hidden', row.dataset.kind !== activeTab);
    // Use CSS order to sort: affordable items get lower order values (appear first)
    row.style.order = row.classList.contains('tab-hidden') ? 1000 : (canAfford ? 0 : 1);
    if (canAfford) affordable++;
  });

  // Tier upgrade rows
  shopEl.querySelectorAll('.tier-item').forEach(row => {
    const t = TIER_UPGRADES.find(x => x.id === row.dataset.id);
    if (!t) return;
    const bought = state.tiersBought.includes(t.id);
    const unlocked = state.owned[t.buildingId] >= t.need;
    const canAfford = state.cookies >= t.cost;
    row.disabled = bought || !unlocked || !canAfford;
    row.classList.toggle('tab-hidden', activeTab !== 'upgrade');
    row.classList.toggle('bought', bought);
    if (bought) { row.querySelector('[data-cost]').textContent = '✔'; }
    if (!unlocked && !bought) { row.querySelector('[data-cost]').textContent = '🔒'; }
    if (unlocked && !bought) { row.querySelector('[data-cost]').textContent = fmt(t.cost); }
    // Use CSS order to sort: affordable items get lower order values (appear first)
    const canBuy = canAfford && unlocked && !bought;
    row.style.order = canBuy ? 0 : 1;
    if (canBuy) affordable++;
  });

  // NFT row visibility — admin can always see it for testing
  const nftRow = shopEl.querySelector('.shop-nft');
  if (nftRow) {
    const alreadyOwned = state.ownsGoldenNFT && window._adminFid !== 1014465;
    const onCorrectTab = activeTab === 'nft';
    
    // Hide completely if owned, otherwise toggle based on active tab
    if (alreadyOwned || !onCorrectTab) {
      nftRow.classList.add('tab-hidden');
    } else {
      nftRow.classList.remove('tab-hidden');
    }
    nftRow.disabled = false;
    nftRow.style.order = 0;
  }

  // Quick NFT Button visibility — admin can always see it for testing
  if (quickNftBtn) {
    const hideQuick = state.ownsGoldenNFT && window._adminFid !== 1014465;
    quickNftBtn.style.display = hideQuick ? 'none' : 'flex';
  }

  // Prestige button visibility — show when user has prestiged OR can prestige
  const pBtn = $('prestigeBtn');
  if (pBtn) {
    const showPrestige = (state.ascensions || 0) > 0 || newChipsOnAscend() >= 1;
    pBtn.classList.toggle('hidden', !showPrestige);
  }

  // Update floating shop button badge
  if (affordable > 0) {
    shopBadge.classList.remove('hidden');
    shopBadge.textContent = affordable;
  } else {
    shopBadge.classList.add('hidden');
  }

  // Golden Cookie Visual
  const cookieImg = document.querySelector('#cookie img');
  if (cookieImg) {
    if (state.ownsGoldenNFT) {
      cookieImg.src = '/golden-cookie.png';
      cookieImg.style.filter = 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.5))';
    } else {
      cookieImg.src = '/farcaster-cookie.png';
      cookieImg.style.filter = 'none';
    }
  }
}

// ============================================================
// Passive ticker
// ============================================================
let last = performance.now();
setInterval(() => {
  const now = performance.now();
  const dt  = (now - last) / 1000;
  last = now;
  const gained = perSec() * dt;
  state.cookies += gained;
  state.totalEarned += gained;
  state.lifetimeEarned += gained;
  render();
  checkAchievements();
}, 100);
setInterval(spawnSparkle, 700);

// ============================================================
// Achievements
// ============================================================
function checkAchievements() {
  for (const a of ACHIEVEMENTS) {
    if (state.unlocked.includes(a.id)) continue;
    let val = 0;
    if (a.kind === 'cookies')    val = state.lifetimeEarned;
    if (a.kind === 'clicks')     val = state.totalClicks;
    if (a.kind === 'buildings')  val = totalBuildings();
    if (a.kind === 'tiers')      val = state.tiersBought.length;
    if (a.kind === 'ascensions') val = state.ascensions;
    if (a.kind === 'cps')        val = perSec();
    if (a.kind === 'adViews')    val = state.adViews || 0;
    if (a.kind === 'follow')     val = state.unlocked.includes('f1') ? 1 : 0;
    if (val >= a.need) {
      state.unlocked.push(a.id);
      toast(a.emoji, 'Achievement: ' + a.label);
      haptic('medium');
    }
  }
}

window.followCreator = function() {
  sdk.actions.openUrl('https://warpcast.com/oddlyaugmented');
  if (!state.unlocked.includes('f1')) {
    state.unlocked.push('f1');
    saveState();
    toast('💜', 'Achievement: Follow odd');
    haptic('medium');
    renderAchievements();
  }
};

// Render the achievement grid with locked/unlocked states.
function renderAchievements() {
  const count = state.unlocked.length;
  achProgress.textContent = `${count} / ${ACHIEVEMENTS.length}`;
  achList.innerHTML = ACHIEVEMENTS.map(a => {
    const unlocked = state.unlocked.includes(a.id);
    let needText = '';
    if (a.kind === 'cookies') needText = `${fmt(a.need)} cookies`;
    else if (a.kind === 'clicks') needText = `${fmt(a.need)} clicks`;
    else if (a.kind === 'buildings') needText = `${fmt(a.need)} buildings`;
    else if (a.kind === 'tiers') needText = `${a.need} upgrades`;
    else if (a.kind === 'ascensions') needText = `${a.need} ascensions`;
    else if (a.kind === 'cps') needText = `${fmt(a.need)} CpS`;
    else if (a.kind === 'adViews') needText = `Watch an ad`;
    else if (a.kind === 'follow') needText = `Follow creator`;

    const clickable = a.kind === 'follow' && !unlocked;
    return `
      <div class="ach-card ${unlocked ? 'unlocked' : 'locked'} ${clickable ? 'clickable' : ''}" ${clickable ? 'onclick="followCreator()"' : ''}>
        <span class="ach-emoji">${unlocked ? a.emoji : '🔒'}</span>
        <div class="ach-info">
          <span class="ach-label">${a.label}</span>
          <span class="ach-need">${needText}</span>
        </div>
      </div>`;
  }).join('');
}

// ============================================================
// Offline cookies + daily bonus
// ============================================================
function applyOfflineEarnings() {
  if (!state.lastPlayed) return;
  const actualSeconds = (Date.now() - state.lastPlayed) / 1000;
  const seconds = Math.min(actualSeconds, 60 * 60 * 8); // Cap offline production to 8h
  
  if (seconds >= 30) {
    const offlineMult = state.prestigeUpgrades.includes('diamond') ? 0.625 : 0.5;
    const earned = perSec() * seconds * offlineMult;
    
    if (earned >= 1) {
      state.cookies += earned;
      state.totalEarned += earned;
      state.lifetimeEarned += earned;
      
      if (actualSeconds > 86400) { // Away for 1+ days
        toast('⏰', "Cookies won't click themselves!", `But your bots did bake ${fmt(earned)} cookies while you were gone.`);
      } else {
        toast('🌙', 'Welcome back!', `Your bots baked ${fmt(earned)} cookies while you were away.`);
      }
    }
  }

  // Prestige progress motivation notification
  const nextPrestigeCost = Math.pow(state.prestigeLevel + 1, 2) * 1e9;
  if (state.lifetimeEarned > 0 && state.lifetimeEarned < nextPrestigeCost) {
    const percent = Math.floor((state.lifetimeEarned / nextPrestigeCost) * 100);
    if (percent >= 50) {
      setTimeout(() => {
        toast('✨', 'Ascension approaches...', `You're ${percent}% of the way to prestiging. Get to clicking!`);
      }, 4500); // Wait for the first toast to clear
    }
  }
}
function applyDailyBonus() {
  const now = Date.now();
  if (now - state.lastDailyClaim < 24 * 60 * 60 * 1000) return;
  const mult = state.prestigeUpgrades.includes('fomo') ? 3 : 1;
  const bonus = Math.max(50, perSec() * 60 * 5) * mult;
  state.cookies += bonus;
  state.totalEarned += bonus;
  state.lifetimeEarned += bonus;
  state.lastDailyClaim = now;
  setTimeout(() => toast('🎁', 'Daily bonus!', `+${fmt(bonus)} cookies. Come back tomorrow!`), 1200);
}

// ============================================================
// Leaderboard — auto-submits in background
// ============================================================
async function getContext() {
  try { return await sdk.context; } catch { return null; }
}

// Try to submit the player's score in the background.
// Skips if not in Farcaster (no fid) or score hasn't grown enough.
async function autoSubmitScore() {
  try {
    const ctx = await getContext();
    const fid = ctx?.user?.fid;
    if (!fid || fid === 1014465) return; // Ignore admin accounts

    // Use lifetimeEarned (all-time cookies) as the leaderboard score
    const score = Math.floor(state.lifetimeEarned);
    // Only submit if we've gained at least 10% more cookies since last submit (and at least +50).
    const minBump = Math.max(50, state.lastSubmittedScore * 0.1);
    if (score - state.lastSubmittedScore < minBump) return;

    const username = ctx?.user?.username || ctx?.user?.displayName || 'Anonymous';
    const r = await sdk.quickAuth.fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fid, username, score,
        prestige_level: state.prestigeLevel || 0,
        ascensions: state.ascensions || 0,
        has_nft: state.ownsGoldenNFT || false,
        follows_oddly: state.followsOddly || false
      })
    });
    if (r.ok) {
      state.lastSubmittedScore = score;
      saveState();
    }
  } catch { /* offline or not in Farcaster — fine */ }
}

// Auto-submit periodically and when the page is hidden.
setInterval(autoSubmitScore, 30_000);
document.addEventListener('visibilitychange', () => { if (document.hidden) autoSubmitScore(); });
window.addEventListener('beforeunload', autoSubmitScore);

lbBtn.addEventListener('click', openProfile);
lbClose.addEventListener('click', () => lbModal.classList.add('hidden'));
lbModal.addEventListener('click', e => { if (e.target === lbModal) lbModal.classList.add('hidden'); });

// Profile tabs: switch between Leaderboard, Achievements, and Prestige
profileTabs.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.ptab;
    profileTabs.forEach(b => b.classList.toggle('active', b === btn));
    paneLeaderboard.classList.toggle('hidden', tab !== 'leaderboard');
    paneAchievements.classList.toggle('hidden', tab !== 'achievements');
    const panePrestige = $('panePrestige');
    if (panePrestige) panePrestige.classList.toggle('hidden', tab !== 'prestige');
    const titles = { leaderboard: '🏆 Leaderboard', achievements: '🏅 Achievements', prestige: '🔝 Prestige' };
    profileTitle.textContent = titles[tab] || '';
    if (tab === 'achievements') renderAchievements();
    if (tab === 'prestige') renderPrestige();
  });
});

userTabs.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.utab;
    userTabs.forEach(b => b.classList.toggle('active', b === btn));
    paneUserStats.classList.toggle('hidden', tab !== 'stats');
    paneUserNft.classList.toggle('hidden', tab !== 'nft');
    if (tab === 'stats') renderUserStats();
    if (tab === 'nft') renderUserNft();
  });
});

async function openProfile() {
  haptic('medium');
  lbModal.classList.remove('hidden');
  // Default to leaderboard view every open
  profileTabs.forEach(b => b.classList.toggle('active', b.dataset.ptab === 'leaderboard'));
  paneLeaderboard.classList.remove('hidden');
  paneAchievements.classList.add('hidden');
  const panePrestige = $('panePrestige');
  if (panePrestige) panePrestige.classList.add('hidden');
  profileTitle.textContent = '\uD83C\uDFC6 Leaderboard';
  renderAchievements(); // keep grid fresh in the background
  await openLeaderboard();
}

function openUserModal() {
  haptic('medium');
  userModal.classList.remove('hidden');
  userTabs[0].click(); // default to stats
  renderUserStats();
}

function renderUserStats() {
  if (!userStatsContent) return;
  const ctx = window._cachedContext;
  const name = ctx?.user?.displayName || ctx?.user?.username || 'Brave Baker';
  const fid = ctx?.user?.fid || '???';
  
  userStatsContent.innerHTML = `
    <div class="user-info-header">
      <div class="user-info-name">${name}</div>
      <div class="user-info-fid">FID: ${fid}</div>
    </div>
    <div class="user-stat-row">
      <span class="user-stat-label">Total Cookies</span>
      <span class="user-stat-value">${fmt(state.cookies)}</span>
    </div>
    <div class="user-stat-row">
      <span class="user-stat-label">Lifetime Earned</span>
      <span class="user-stat-value">${fmt(state.lifetimeEarned)}</span>
    </div>
    <div class="user-stat-row">
      <span class="user-stat-label">Total Clicks</span>
      <span class="user-stat-value">${fmt(state.totalClicks)}</span>
    </div>
    <div class="user-stat-row">
      <span class="user-stat-label">Prestige Level</span>
      <span class="user-stat-value">${state.prestigeLevel}</span>
    </div>
    <div class="user-stat-row">
      <span class="user-stat-label">Ascensions</span>
      <span class="user-stat-value">${state.ascensions}</span>
    </div>
  `;
}

function renderUserNft() {
  if (!paneUserNft) return;
  
  if (state.ownsGoldenNFT) {
    paneUserNft.innerHTML = `
      <div class="nft-pane-content">
        <img src="/golden-cookie.png" class="nft-display-img" alt="Golden Cookie NFT">
        <div>
          <h3 class="nft-status-title">Golden Cookie NFT</h3>
          <p class="nft-status-desc">Status: <b>Verified Owner</b></p>
          <p class="nft-status-desc" style="margin-top: 10px; font-size: 0.8rem; opacity: 0.6;">
            Enjoy your 2x multiplier and golden bakery!
          </p>
        </div>
      </div>`;
  } else {
    paneUserNft.innerHTML = `
      <div class="nft-pane-content">
        <div class="nft-display-img" style="background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; opacity: 0.3;">
          <span style="font-size: 3rem;">🔒</span>
        </div>
        <div>
          <h3 class="nft-status-title" style="color: #fff; opacity: 0.5;">No NFT Detected</h3>
          <p class="nft-status-desc">Purchase the golden cookie to get x2 your score!</p>
          <button class="nft-prompt-btn" onclick="activeTab='nft'; tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === 'nft')); shopDrawer.classList.remove('hidden'); requestAnimationFrame(() => shopDrawer.classList.add('open')); document.getElementById('userModal').classList.add('hidden'); render();">Go to Shop</button>
        </div>
      </div>`;
  }
}

if (profileBtn) {
  profileBtn.addEventListener('click', openUserModal);
}
if (userClose) {
  userClose.addEventListener('click', () => userModal.classList.add('hidden'));
}
userModal?.addEventListener('click', e => { if (e.target === userModal) userModal.classList.add('hidden'); });

async function openLeaderboard() {
  lbList.innerHTML = '<p class="lb-msg">Loading...</p>';
  lbYou.textContent = '';

  // Submit fresh score before showing the list so the user sees themselves up to date.
  await autoSubmitScore();

  try {
    const r = await fetch('/api/leaderboard');
    const data = await r.json();

    if (!data.length) {
      lbList.innerHTML = '<p class="lb-msg">No scores yet — be the first!</p>';
    } else {
      lbList.innerHTML = data.map((row, i) => {
        const isGolden = row.has_nft === true;
        const displayName = row.username;
        return `
        <div class="lb-row">
          <span class="lb-rank">${['🥇','🥈','🥉'][i] ?? `#${i + 1}`}</span>
          <span class="lb-name-row">
            <span class="lb-name-text ${isGolden ? 'golden' : ''}">${escapeHtml(displayName)}</span>
            <span class="lb-plevel">🔝${row.prestige_level || 0}</span>
          </span>
          <span class="lb-score">${fmt(row.score)}</span>
        </div>`;
      }).join('');
    }

    // Footer line: where the player stands
    const ctx = await getContext();
    if (ctx?.user?.fid) {
      const me = data.find(r => r.fid === ctx.user.fid);
      if (me) {
        const rank = data.indexOf(me) + 1;
        lbYou.textContent = `#${rank} • ${fmt(me.score)} cookies • Prestige ${me.prestige_level || 0}`;
      } else {
        lbYou.textContent = `${fmt(state.lifetimeEarned)} all-time cookies — keep baking!`;
      }
    } else {
      lbYou.textContent = 'Open in Farcaster to appear on the leaderboard.';
    }
  } catch {
    lbList.innerHTML = '<p class="lb-msg">Could not load scores.</p>';
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// ============================================================
// Share
// ============================================================
shareBtn.addEventListener('click', async () => {
  try {
    await sdk.actions.composeCast({
      text: `I've baked ${fmt(state.totalEarned)} cookies in FarClick 🍪 think you can beat me?`,
      embeds: ['https://cookie-clicker-hv5w.vercel.app/']
    });
  } catch {
    try {
      await navigator.clipboard.writeText(`I baked ${fmt(state.totalEarned)} cookies! https://cookie-clicker-hv5w.vercel.app/`);
      toast('📋', 'Copied to clipboard');
    } catch {}
  }
});

// ============================================================
// Add Mini App
// ============================================================
function maybePromptAdd() {
  if (state.promptedAdd) return;
  if (state.totalEarned < 100) return;
  state.promptedAdd = true;
  addBanner.classList.remove('hidden');
}

addBtn.addEventListener('click', async () => {
  try {
    haptic('medium');
    await sdk.actions.addMiniApp();
    toast('⭐', 'Added!', 'FarClick is in your apps.');
    autoSubmitScore();
  } catch {}
  addBanner.classList.add('hidden');
});
addClose.addEventListener('click', () => addBanner.classList.add('hidden'));

// ============================================================
// Follow Prompt
// ============================================================
const followModal = $('followModal');
const followClose = $('followClose');
const followBtn = $('followBtn');

if (followClose && followModal) {
  followClose.addEventListener('click', () => followModal.classList.add('hidden'));
}
if (followBtn && followModal) {
  followBtn.addEventListener('click', async () => {
    try {
      const ctx = await sdk.context;
      const viewerFid = ctx?.user?.fid;
      
      if (!viewerFid) {
        toast('⚠️', 'Error', 'Could not detect your Farcaster ID to verify follow.');
        return;
      }

      // Open the profile via URL instead of native sheet as requested
      await sdk.actions.openUrl('https://farcaster.xyz/oddlyaugmented.eth');

      // Change button state to indicate we are verifying
      followBtn.disabled = true;
      followBtn.textContent = 'Verifying follow...';
      followBtn.style.opacity = '0.7';

      // Poll the Neynar backend to see if they actually followed
      // Checks every 3 seconds for up to 15 seconds
      let verified = false;
      for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 3000));
        
        try {
          const res = await fetch(`/api/verify-follow?viewer_fid=${viewerFid}`);
          if (res.ok) {
            const data = await res.json();
            if (data.following) {
              verified = true;
              break;
            }
          }
        } catch (e) {
          console.error("Verification ping failed", e);
        }
      }

      if (verified && !state.followsOddly) {
        state.followsOddly = true;
        state.cookies += 5000;
        state.totalEarned += 5000;
        state.lifetimeEarned += 5000;
        saveState();
        render();
        toast('🎉', 'Follow Verified!', '+5,000 Cookies added to your bakery!');
        autoSubmitScore();
        followModal.classList.add('hidden');
      } else if (!verified) {
        toast('⏳', 'Not detected yet', "We didn't detect a follow. Sometimes it takes a moment, try again!");
      }

    } catch (err) {
      console.error(err);
      toast('⚠️', 'Error', 'Something went wrong while verifying.');
    } finally {
      // Reset button state
      followBtn.disabled = false;
      followBtn.textContent = 'Follow @oddlyaugmented.eth';
      followBtn.style.opacity = '1';
    }
  });
}

setTimeout(() => {
  if (!state.followsOddly && state.totalEarned >= 100 && followModal) {
    followModal.classList.remove('hidden');
  }
}, 10000);

// ============================================================
// Prestige System
// ============================================================

// --- Prestige stats pane (shown in leaderboard modal, stats only) ---
function renderPrestige() {
  const pane = $('panePrestige');
  if (!pane) return;
  const pLevel = state.prestigeLevel || 0;
  const pChips = state.prestigeChips || 0;
  const pAscensions = state.ascensions || 0;
  const pUpgrades = state.prestigeUpgrades || [];
  const newChips = newChipsOnAscend();
  const cpsRate = pLevel * (pUpgrades.includes('recursive') ? 5 : 1);
  pane.innerHTML = `
    <div class="prestige-stats">
      <p>📊 <b>Prestige Level:</b> ${pLevel}</p>
      <p>💠 <b>Chips Available:</b> ${pChips}</p>
      <p>⚡ <b>CpS Bonus:</b> +${cpsRate}%</p>
      <p>🍪 <b>All-Time Cookies:</b> ${fmt(state.lifetimeEarned || 0)}</p>
      <p>👆 <b>Total Clicks:</b> ${fmt(state.totalClicks || 0)}</p>
      <p>⭐ <b>Prestiges:</b> ${pAscensions}</p>
      <p>🧱 <b>Buildings Owned:</b> ${totalBuildings()}</p>
      <p>⬆️ <b>Tier Upgrades:</b> ${(state.tiersBought || []).length}</p>
      <p>🛒 <b>Prestige Upgrades:</b> ${pUpgrades.length} / ${PRESTIGE_UPGRADES.length}</p>
    </div>
    <p style="font-size:0.75rem; opacity:0.6; margin-top:0.5rem; text-align:center;">
      Use the ⭐ button on the main screen to open the Prestige Shop.
    </p>`;
}

// --- Prestige drawer (full shop, opens from main screen ⭐ button) ---
const prestigeBtn = $('prestigeBtn');
const prestigeDrawer = $('prestigeDrawer');
const prestigeClose = $('prestigeClose');
const prestigeContent = $('prestigeContent');

function renderPrestigeDrawer() {
  if (!prestigeContent) return;
  const pLevel = state.prestigeLevel || 0;
  const pChips = state.prestigeChips || 0;
  const pUpgrades = state.prestigeUpgrades || [];
  const newChips = newChipsOnAscend();
  const cpsRate = pLevel * (pUpgrades.includes('recursive') ? 5 : 1);

  prestigeContent.innerHTML = `
    <div class="prestige-stats-mini">
      <p>📊 <b>Level ${pLevel}</b></p>
      <p>💠 <b>${pChips} Chips</b></p>
      <p>⚡ <b>+${cpsRate}% CpS</b></p>
      <p>⭐ <b>${state.ascensions || 0} Prestiges</b></p>
    </div>

    <div class="prestige-action-box">
      <p>Prestiging resets cookies, buildings & upgrades but gives you <b>permanent CpS bonuses</b>.</p>
      ${newChips < 1
        ? `<p>🔒 Requires <b>1B all-time cookies</b> to unlock. You have <b>${fmt(state.lifetimeEarned || 0)}</b> (${Math.min(100, ((state.lifetimeEarned || 0) / 1e9 * 100)).toFixed(2)}%).</p>`
        : `<p>You would earn <b>${newChips}</b> new prestige chip${newChips !== 1 ? 's' : ''} 💠</p>`
      }
      <button id="prestigeActionBtn" class="prestige-btn" ${newChips < 1 ? 'disabled' : ''}>⭐ Prestige${newChips > 0 ? ` (+${newChips} chips)` : ''}</button>
    </div>

    <div class="prestige-shop-grid">
      <h3>💠 Prestige Shop</h3>
      ${PRESTIGE_UPGRADES.map(pu => {
        const owned = pUpgrades.includes(pu.id);
        const canBuy = !owned && pChips >= pu.cost;
        return `<button class="prestige-item ${owned ? 'bought' : ''} ${canBuy ? 'affordable' : ''}" data-pid="${pu.id}" ${owned || !canBuy ? 'disabled' : ''}>
          <span class="emoji">${pu.emoji}</span>
          <span class="info"><b>${pu.name}</b><small>${pu.desc}</small></span>
          <span class="cost">${owned ? '✔' : pu.cost + ' 💠'}</span>
        </button>`;
      }).join('')}
    </div>`;

  // Bind prestige button
  const pBtn = $('prestigeActionBtn');
  if (pBtn) pBtn.addEventListener('click', doPrestige);
  // Bind prestige shop buttons
  prestigeContent.querySelectorAll('.prestige-item:not(.bought)').forEach(btn => {
    btn.addEventListener('click', () => buyPrestigeUpgrade(btn.dataset.pid));
  });
}

// Open/close prestige drawer
if (prestigeBtn) {
  prestigeBtn.addEventListener('click', () => {
    renderPrestigeDrawer();
    prestigeDrawer.classList.remove('hidden');
    setTimeout(() => prestigeDrawer.classList.add('open'), 10);
    haptic('light');
  });
}
if (prestigeClose) {
  prestigeClose.addEventListener('click', () => {
    prestigeDrawer.classList.remove('open');
    setTimeout(() => prestigeDrawer.classList.add('hidden'), 300);
  });
}
if (prestigeDrawer) {
  prestigeDrawer.addEventListener('click', e => {
    if (e.target === prestigeDrawer) {
      prestigeDrawer.classList.remove('open');
      setTimeout(() => prestigeDrawer.classList.add('hidden'), 300);
    }
  });
}

function doPrestige() {
  const chips = newChipsOnAscend();
  if (chips < 1) return;
  state.prestigeLevel += chips;
  state.prestigeChips += chips;
  state.ascensions += 1;
  // Preserve lifetime earnings (must persist across ascensions for prestige calculations)
  const preservedLifetimeEarned = state.lifetimeEarned;
  // Reset run state
  state.cookies = state.prestigeUpgrades.includes('genesis') ? 10000 : 0;
  state.totalEarned = 0;
  state.owned = Object.fromEntries(UPGRADES.map(u => [u.id, 0]));
  if (state.prestigeUpgrades.includes('whale')) state.owned.grandma = 5;
  state.tiersBought = [];
  // IMPORTANT: Keep achievements unlocked across ascensions (permanent accomplishments)
  // DO NOT reset state.unlocked = [];
  // Restore lifetime earnings (persists across ascensions)
  state.lifetimeEarned = preservedLifetimeEarned;
  // Re-render everything
  renderOrbits();
  render();
  renderPrestigeDrawer();
  renderPrestige();
  saveState();
  toast('⭐', 'Prestiged!', `+${chips} prestige chips. Your empire grows stronger.`);
  haptic('heavy');
}

function buyPrestigeUpgrade(id) {
  const pu = PRESTIGE_UPGRADES.find(p => p.id === id);
  if (!pu || state.prestigeUpgrades.includes(id)) return;
  if (state.prestigeChips < pu.cost) return;
  state.prestigeChips -= pu.cost;
  state.prestigeUpgrades.push(id);
  toast(pu.emoji, pu.name, pu.desc);
  haptic('medium');
  saveState();
  renderPrestigeDrawer();
  render(); // Update main screen since multipliers changed
}

// ============================================================
// Haptics
// ============================================================
function haptic(strength = 'light') {
  try { sdk.haptics.impactOccurred(strength); } catch {}
}

// ============================================================
// Boot
// ============================================================
applyOfflineEarnings();
applyDailyBonus();
renderOrbits();
render();
scheduleGoldenCookie();

await sdk.actions.ready();
sdk.back.enableWebNavigation();

// Cache FID for admin checks in synchronous render()
try {
  const _ctx = await sdk.context;
  window._cachedContext = _ctx;
  window._adminFid = _ctx?.user?.fid || null;
  if (_ctx?.user?.pfpUrl && profileBtn) {
    profileBtn.style.backgroundImage = `url('${_ctx.user.pfpUrl}')`;
  }
  render(); // Re-render now that we know if user is admin
} catch { window._adminFid = null; }

// Submit shortly after launch so returning players land on the board.
setTimeout(autoSubmitScore, 5_000);
// Attempt cloud load
loadFromCloud();

// Handle shared cast context
try {
  const context = await sdk.context;
  if (context?.location?.type === 'cast_share') {
    const cast = context.location.cast;
    toast('📢', `Shared from @${cast.author.username}`, 'Loading stats...');
    setTimeout(openProfile, 1500);
  }
} catch (e) {
  console.error("Context check failed", e);
}
