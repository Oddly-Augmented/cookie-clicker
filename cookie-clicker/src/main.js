import './style.css';
import { sdk } from '@farcaster/miniapp-sdk';

// ============================================================
// Upgrade definitions
// ============================================================
const UPGRADES = [
  { id: 'cursor',  name: 'Cursor',        emoji: '👆',  kind: 'click', power: 1,      baseCost: 10,          orbit: 'inner' },
  { id: 'spoon',   name: 'Wooden Spoon',  emoji: '🥄',  kind: 'click', power: 5,      baseCost: 100,         orbit: 'inner' },
  { id: 'whisk',   name: 'Magic Whisk',   emoji: '🪄',  kind: 'click', power: 25,     baseCost: 1_500,       orbit: 'inner' },
  { id: 'mixer',   name: 'Stand Mixer',   emoji: '🧁',  kind: 'click', power: 100,    baseCost: 25_000,      orbit: 'inner' },
  { id: 'grandma', name: 'Grandma',       emoji: '👵',  kind: 'cps',   power: 1,      baseCost: 50,          orbit: 'mid' },
  { id: 'farm',    name: 'Cookie Farm',   emoji: '🌾',  kind: 'cps',   power: 5,      baseCost: 500,         orbit: 'mid' },
  { id: 'mine',    name: 'Cookie Mine',   emoji: '⛏️', kind: 'cps',   power: 25,     baseCost: 5_000,       orbit: 'mid' },
  { id: 'factory', name: 'Factory',       emoji: '🏭',  kind: 'cps',   power: 100,    baseCost: 50_000,      orbit: 'mid' },
  { id: 'bank',    name: 'Cookie Bank',   emoji: '🏦',  kind: 'cps',   power: 500,    baseCost: 500_000,     orbit: 'outer' },
  { id: 'temple',  name: 'Temple',        emoji: '🏛️', kind: 'cps',   power: 2_500,  baseCost: 5_000_000,   orbit: 'outer' },
  { id: 'wizard',  name: 'Wizard Tower',  emoji: '🧙',  kind: 'cps',   power: 12_500, baseCost: 50_000_000,  orbit: 'outer', fx: 'shoot' },
  { id: 'rocket',  name: 'Cookie Rocket', emoji: '🚀',  kind: 'cps',   power: 60_000, baseCost: 500_000_000, orbit: 'outer' }
];

const COST_MULTIPLIER = 1.15;
const MAX_PER_TYPE    = 8;

const ACHIEVEMENTS = [
  { id: 'first',   need: 1,             label: 'First cookie',       emoji: '🍪' },
  { id: 'ten',     need: 10,            label: '10 cookies',         emoji: '🥠' },
  { id: 'hundred', need: 100,           label: '100 cookies',        emoji: '✨' },
  { id: 'k',       need: 1_000,         label: 'A thousand!',        emoji: '🎉' },
  { id: 'tenk',    need: 10_000,        label: '10K club',           emoji: '🌟' },
  { id: 'm',       need: 1_000_000,     label: 'Cookie millionaire', emoji: '💎' },
  { id: 'b',       need: 1_000_000_000, label: 'Cookie billionaire', emoji: '👑' }
];

// ============================================================
// State (persisted in localStorage)
// ============================================================
const SAVE_KEY = 'cookieClicker:v1';

const defaultState = () => ({
  cookies: 0,
  totalEarned: 0,
  owned: Object.fromEntries(UPGRADES.map(u => [u.id, 0])),
  unlocked: [],
  lastPlayed: Date.now(),
  lastDailyClaim: 0,
  promptedAdd: false,
  lastSubmittedScore: 0
});

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...JSON.parse(raw) };
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
const perClick = () => 1 + UPGRADES.filter(u => u.kind === 'click').reduce((s, u) => s + u.power * state.owned[u.id], 0);
const perSec   = () => UPGRADES.filter(u => u.kind === 'cps').reduce((s, u) => s + u.power * state.owned[u.id], 0);

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
    const n = Math.min(state.owned[u.id], MAX_PER_TYPE);
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
  setTimeout(showGoldenCookie, (120 + Math.random() * 180) * 1000);
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

  toast('✨', 'Golden Cookie!', '5× cookies per click for 30 seconds!');
  haptic('heavy');
  scheduleGoldenCookie();
}

// ============================================================
// Click cookie
// ============================================================
cookieBtn.addEventListener('click', () => {
  const gained = perClick() * (bonusActive ? 5 : 1);
  state.cookies += gained;
  state.totalEarned += gained;
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
  perClickEl.textContent = fmt(perClick() * (bonusActive ? 5 : 1));
  perSecEl.textContent   = fmt(perSec());

  let affordable = 0;
  shopEl.querySelectorAll('.shop-item').forEach(row => {
    const u = UPGRADES.find(x => x.id === row.dataset.id);
    const c = cost(u);
    row.querySelector('[data-cost]').textContent  = fmt(c);
    row.querySelector('[data-count]').textContent = state.owned[u.id] ? `×${state.owned[u.id]}` : '';
    row.disabled = state.cookies < c;
    // Hide rows for the inactive tab
    row.classList.toggle('tab-hidden', row.dataset.kind !== activeTab);
    if (state.cookies >= c) affordable++;
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
  render();
  checkAchievements();
}, 100);
setInterval(spawnSparkle, 700);

// ============================================================
// Achievements
// ============================================================
function checkAchievements() {
  for (const a of ACHIEVEMENTS) {
    if (state.totalEarned >= a.need && !state.unlocked.includes(a.id)) {
      state.unlocked.push(a.id);
      toast(a.emoji, 'Achievement: ' + a.label);
      haptic('medium');
    }
  }
}

// ============================================================
// Offline cookies + daily bonus
// ============================================================
function applyOfflineEarnings() {
  if (!state.lastPlayed) return;
  const seconds = Math.min((Date.now() - state.lastPlayed) / 1000, 60 * 60 * 8);
  if (seconds < 30) return;
  const earned = perSec() * seconds * 0.5;
  if (earned < 1) return;
  state.cookies += earned;
  state.totalEarned += earned;
  toast('🌙', 'Welcome back!', `Your bakers made ${fmt(earned)} cookies while you were away.`);
}
function applyDailyBonus() {
  const now = Date.now();
  if (now - state.lastDailyClaim < 24 * 60 * 60 * 1000) return;
  const bonus = Math.max(50, perSec() * 60 * 5);
  state.cookies += bonus;
  state.totalEarned += bonus;
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

    const score = Math.floor(state.totalEarned);
    // Only submit if we've gained at least 10% more cookies since last submit (and at least +50).
    const minBump = Math.max(50, state.lastSubmittedScore * 0.1);
    if (score - state.lastSubmittedScore < minBump) return;

    const username = ctx?.user?.username || ctx?.user?.displayName || 'Anonymous';
    const r = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fid, username, score })
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

lbBtn.addEventListener('click', openLeaderboard);
lbClose.addEventListener('click', () => lbModal.classList.add('hidden'));
lbModal.addEventListener('click', e => { if (e.target === lbModal) lbModal.classList.add('hidden'); });

async function openLeaderboard() {
  lbModal.classList.remove('hidden');
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
          <span class="lb-score">${fmt(row.score)}</span>
        </div>`).join('');
    }

    // Footer line: where the player stands
    const ctx = await getContext();
    if (ctx?.user?.fid) {
      const me = data.find(r => r.fid === ctx.user.fid);
      if (me) {
        const rank = data.indexOf(me) + 1;
        lbYou.textContent = `You're #${rank} with ${fmt(me.score)} cookies`;
      } else {
        lbYou.textContent = `Your score: ${fmt(state.totalEarned)} (keep baking to crack the top 10)`;
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
      text: `I've baked ${fmt(state.totalEarned)} cookies in Cookie Clicker 🍪 think you can beat me?`,
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
    toast('⭐', 'Added!', 'Cookie Clicker is in your apps.');
    autoSubmitScore();
  } catch {}
  addBanner.classList.add('hidden');
});
addClose.addEventListener('click', () => addBanner.classList.add('hidden'));

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
