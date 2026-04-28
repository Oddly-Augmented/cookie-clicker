import './style.css';
import { sdk } from '@farcaster/miniapp-sdk';

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
  { id: 'genesis',  name: 'Genesis Block',    emoji: '🧱', cost: 1,   desc: 'Start each run with 1,000 cookies' },
  { id: 'diamond',  name: 'Diamond Hands',    emoji: '💎', cost: 3,   desc: '+25% offline earnings' },
  { id: 'moon',     name: 'Moon Math',        emoji: '🌙', cost: 5,   desc: 'Golden cookies 2× more often' },
  { id: 'whale',    name: 'Whale Wallet',     emoji: '🐋', cost: 10,  desc: 'Start with 1 free Click Farm' },
  { id: 'protocol', name: 'Protocol Upgrade', emoji: '⬆️', cost: 25,  desc: '+50% all building output' },
  { id: 'lucky',    name: 'Lucky Drops',      emoji: '🍀', cost: 15,  desc: 'Golden cookie bonus is 10×' },
  { id: 'fomo',     name: 'FOMO Shield',      emoji: '🛡️', cost: 20,  desc: 'Daily bonus is 3× larger' },
  { id: 'recursive',name: 'Recursive AGI',    emoji: '🔄', cost: 50,  desc: 'Prestige chips give +2% CpS' },
  { id: 'wagmi',    name: 'WAGMI',            emoji: '🚀', cost: 100, desc: 'All CpS ×2' },
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
  { id: 'p1',    need: 1,   label: 'First Ascension',    emoji: '🔝', kind: 'ascensions' },
  { id: 'p2',    need: 3,   label: 'Triple Ascension',   emoji: '♾️', kind: 'ascensions' },
  { id: 'p3',    need: 10,  label: 'Ascension Master',   emoji: '🌠', kind: 'ascensions' },
  // Special
  { id: 'sg',    need: 1_000_000, label: '1M CpS',        emoji: '⚡', kind: 'cps' },
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
  lastSubmittedScore: 0
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
      return saved;
    }
    const migrated = migrateV1();
    if (migrated) return migrated;
    return defaultState();
  } catch { return defaultState(); }
}
function saveState() {
  state.lastPlayed = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch {}
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
  const rate = state.prestigeUpgrades.includes('recursive') ? 2 : 1;
  return 1 + state.prestigeLevel * rate / 100;
};
const protocolMult = () => state.prestigeUpgrades.includes('protocol') ? 1.5 : 1;
const wagmiMult    = () => state.prestigeUpgrades.includes('wagmi') ? 2 : 1;
const globalMult   = () => milkMult() * prestigeMult() * protocolMult() * wagmiMult();

const perClick = () => (1 + UPGRADES.filter(u => u.kind === 'click').reduce((s, u) => s + u.power * state.owned[u.id] * tierMult(u.id), 0)) * globalMult();
const perSec   = () => UPGRADES.filter(u => u.kind === 'cps').reduce((s, u) => s + u.power * state.owned[u.id] * tierMult(u.id), 0) * globalMult();

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
const toastsEl   = $('toasts'),   shareBtn   = $('share'),     lbBtn     = $('lbBtn');
const addBanner  = $('addBanner'),addBtn     = $('addBtn'),    addClose  = $('addClose');
const lbModal    = $('lbModal'),  lbList     = $('lbList'),    lbClose   = $('lbClose'),  lbYou = $('lbYou');
const profileTabs = document.querySelectorAll('.profile-tab-btn');
const paneLeaderboard = $('paneLeaderboard');
const paneAchievements = $('paneAchievements');
const profileTitle = $('profileTitle');
const achList    = $('achList'),  achProgress = $('achProgress');
const bonusBar   = $('bonusBar'), bonusProgress = $('bonusProgress'), bonusLabel = $('bonusLabel');
const shopBtn    = $('shopBtn'),  shopDrawer = $('shopDrawer'),shopClose = $('shopClose'), shopBadge = $('shopAffordable');
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

// Tabs
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    activeTab = btn.dataset.tab;
    tabBtns.forEach(b => b.classList.toggle('active', b === btn));
    render();
  });
});

// Drawer open/close
shopBtn.addEventListener('click', () => {
  shopDrawer.classList.remove('hidden');
  requestAnimationFrame(() => shopDrawer.classList.add('open'));
  haptic('light');
});
shopClose.addEventListener('click', closeShop);
shopDrawer.addEventListener('click', e => { if (e.target === shopDrawer) closeShop(); });
function closeShop() {
  shopDrawer.classList.remove('open');
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

  // Update floating shop button badge
  if (affordable > 0) {
    shopBadge.classList.remove('hidden');
    shopBadge.textContent = affordable;
  } else {
    shopBadge.classList.add('hidden');
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
    if (val >= a.need) {
      state.unlocked.push(a.id);
      toast(a.emoji, 'Achievement: ' + a.label);
      haptic('medium');
    }
  }
}

// Render the achievement grid with locked/unlocked states.
function renderAchievements() {
  const count = state.unlocked.length;
  achProgress.textContent = `${count} / ${ACHIEVEMENTS.length}`;
  achList.innerHTML = ACHIEVEMENTS.map(a => {
    const unlocked = state.unlocked.includes(a.id);
    return `
      <div class="ach-card ${unlocked ? 'unlocked' : 'locked'}">
        <span class="ach-emoji">${unlocked ? a.emoji : '\uD83D\uDD12'}</span>
        <span class="ach-label">${a.label}</span>
        <span class="ach-need">${fmt(a.need)} cookies</span>
      </div>`;
  }).join('');
}

// ============================================================
// Offline cookies + daily bonus
// ============================================================
function applyOfflineEarnings() {
  if (!state.lastPlayed) return;
  const seconds = Math.min((Date.now() - state.lastPlayed) / 1000, 60 * 60 * 8);
  if (seconds < 30) return;
  const offlineMult = state.prestigeUpgrades.includes('diamond') ? 0.625 : 0.5;
  const earned = perSec() * seconds * offlineMult;
  if (earned < 1) return;
  state.cookies += earned;
  state.totalEarned += earned;
  state.lifetimeEarned += earned;
  toast('🌙', 'Welcome back!', `Your bots made ${fmt(earned)} cookies while you were away.`);
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
    if (!fid) return;

    // Use lifetimeEarned (all-time cookies) as the leaderboard score
    const score = Math.floor(state.lifetimeEarned);
    // Only submit if we've gained at least 10% more cookies since last submit (and at least +50).
    const minBump = Math.max(50, state.lastSubmittedScore * 0.1);
    if (score - state.lastSubmittedScore < minBump) return;

    const username = ctx?.user?.username || ctx?.user?.displayName || 'Anonymous';
    const r = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fid, username, score,
        prestige_level: state.prestigeLevel || 0,
        ascensions: state.ascensions || 0
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

async function openProfile() {
  lbModal.classList.remove('hidden');
  // Default to leaderboard view every open
  profileTabs.forEach(b => b.classList.toggle('active', b.dataset.ptab === 'leaderboard'));
  paneLeaderboard.classList.remove('hidden');
  paneAchievements.classList.add('hidden');
  profileTitle.textContent = '\uD83C\uDFC6 Leaderboard';
  renderAchievements(); // keep grid fresh in the background
  await openLeaderboard();
}

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
      lbList.innerHTML = data.map((row, i) => `
        <div class="lb-row">
          <span class="lb-rank">${['🥇','🥈','🥉'][i] ?? `#${i + 1}`}</span>
          <span class="lb-name">${escapeHtml(row.username)}</span>
          <span class="lb-prestige">${row.ascensions ? `♾️ ${row.ascensions}` : ''}</span>
          <span class="lb-score">${fmt(row.score)}</span>
        </div>`).join('');
    }

    // Footer line: where the player stands
    const ctx = await getContext();
    if (ctx?.user?.fid) {
      const me = data.find(r => r.fid === ctx.user.fid);
      if (me) {
        const rank = data.indexOf(me) + 1;
        lbYou.textContent = `You're #${rank} with ${fmt(me.score)} all-time cookies (${me.ascensions || 0} ascensions)`;
      } else {
        lbYou.textContent = `Your score: ${fmt(state.lifetimeEarned)} (keep baking to crack the top 100)`;
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
    await sdk.actions.addMiniApp();
    toast('⭐', 'Added!', 'FarClick is in your apps.');
    autoSubmitScore();
  } catch {}
  addBanner.classList.add('hidden');
});
addClose.addEventListener('click', () => addBanner.classList.add('hidden'));

// ============================================================
// Prestige / Ascend
// ============================================================
function renderPrestige() {
  const pane = $('panePrestige');
  if (!pane) return;
  const pLevel = state.prestigeLevel || 0;
  const pChips = state.prestigeChips || 0;
  const pAscensions = state.ascensions || 0;
  const pUpgrades = state.prestigeUpgrades || [];
  const newChips = newChipsOnAscend();
  pane.innerHTML = `
    <div class="prestige-stats">
      <p>📊 <b>Prestige Level:</b> ${pLevel}</p>
      <p>💠 <b>Chips Available:</b> ${pChips}</p>
      <p>⚡ <b>CpS Bonus:</b> +${(pLevel * (pUpgrades.includes('recursive') ? 2 : 1))}%</p>
      <p>🍪 <b>All-Time Cookies:</b> ${fmt(state.lifetimeEarned || 0)}</p>
      <p>👆 <b>Total Clicks:</b> ${fmt(state.totalClicks || 0)}</p>
      <p>♾️ <b>Ascensions:</b> ${pAscensions}</p>
      <p>🧱 <b>Buildings Owned:</b> ${totalBuildings()}</p>
      <p>⬆️ <b>Tier Upgrades:</b> ${(state.tiersBought || []).length}</p>
    </div>
    <div class="prestige-ascend-box">
      <p>Ascending resets cookies, buildings & upgrades but gives you <b>permanent CpS bonuses</b>.</p>
      <p>You would earn <b>${newChips}</b> new prestige chip${newChips !== 1 ? 's' : ''} 💠</p>
      <button id="ascendBtn" class="ascend-btn" ${newChips < 1 ? 'disabled' : ''}>🔝 Ascend${newChips > 0 ? ` (+${newChips} chips)` : ''}</button>
    </div>
    <h3 style="margin-top:1rem">Prestige Shop</h3>
    <div class="prestige-shop">
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
  // Bind ascend button
  const ascBtn = $('ascendBtn');
  if (ascBtn) ascBtn.addEventListener('click', doAscend);
  // Bind prestige shop buttons
  pane.querySelectorAll('.prestige-item:not(.bought)').forEach(btn => {
    btn.addEventListener('click', () => buyPrestigeUpgrade(btn.dataset.pid));
  });
}

function doAscend() {
  const chips = newChipsOnAscend();
  if (chips < 1) return;
  state.prestigeLevel += chips;
  state.prestigeChips += chips;
  state.ascensions += 1;
  // Preserve lifetime earnings (must persist across ascensions for prestige calculations)
  const preservedLifetimeEarned = state.lifetimeEarned;
  // Reset run state
  state.cookies = state.prestigeUpgrades.includes('genesis') ? 1000 : 0;
  state.totalEarned = 0;
  state.owned = Object.fromEntries(UPGRADES.map(u => [u.id, 0]));
  if (state.prestigeUpgrades.includes('whale')) state.owned.grandma = 1;
  state.tiersBought = [];
  // IMPORTANT: Keep achievements unlocked across ascensions (permanent accomplishments)
  // DO NOT reset state.unlocked = [];
  // Restore lifetime earnings (persists across ascensions)
  state.lifetimeEarned = preservedLifetimeEarned;
  // Re-render everything
  renderOrbits();
  render();
  renderPrestige();
  saveState();
  toast('🔝', 'Ascended!', `+${chips} prestige chips. Your empire grows stronger.`);
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
  renderPrestige();
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

// Submit shortly after launch so returning players land on the board.
setTimeout(autoSubmitScore, 5_000);
