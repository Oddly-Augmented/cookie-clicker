import './style.css';
import { sdk } from '@farcaster/miniapp-sdk';

// --- upgrade definitions ---
// kind:  'click' adds to cookies per click, 'cps' adds to cookies per second
// orbit: which ring around the cookie they appear on (inner | mid | outer)
// fx:    optional special effect ('shoot' = projectile toward cookie)
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
const MAX_PER_TYPE    = 8; // cap visible helpers per upgrade so the orbit stays readable

// --- game state ---
let cookies = 0;
const owned = Object.fromEntries(UPGRADES.map(u => [u.id, 0]));

// --- helpers ---
const cost = u => Math.ceil(u.baseCost * COST_MULTIPLIER ** owned[u.id]);

const perClick = () =>
  1 + UPGRADES.filter(u => u.kind === 'click').reduce((s, u) => s + u.power * owned[u.id], 0);

const perSec = () =>
  UPGRADES.filter(u => u.kind === 'cps').reduce((s, u) => s + u.power * owned[u.id], 0);

const fmt = n => {
  if (n < 1_000) return Math.floor(n).toString();
  const units = ['K', 'M', 'B', 'T', 'Qa', 'Qi'];
  let i = -1;
  while (n >= 1_000 && i < units.length - 1) { n /= 1_000; i++; }
  return n.toFixed(n < 10 ? 2 : n < 100 ? 1 : 0) + units[i];
};

// --- elements ---
const countEl    = document.getElementById('count');
const perClickEl = document.getElementById('perClick');
const perSecEl   = document.getElementById('perSec');
const cookieBtn  = document.getElementById('cookie');
const shopEl     = document.getElementById('shop');
const fxEl       = document.getElementById('fx');
const orbits     = {
  inner: document.getElementById('orbit-inner'),
  mid:   document.getElementById('orbit-mid'),
  outer: document.getElementById('orbit-outer')
};

// --- build shop once ---
UPGRADES.forEach(u => {
  const row = document.createElement('button');
  row.className = 'shop-item';
  row.dataset.id = u.id;
  row.innerHTML = `
    <span class="emoji">${u.emoji}</span>
    <span class="info">
      <span class="name">${u.name} <span class="count" data-count></span></span>
      <span class="effect">+${fmt(u.power)} ${u.kind === 'click' ? '/click' : '/sec'}</span>
    </span>
    <span class="cost" data-cost></span>
  `;
  row.addEventListener('click', () => buy(u));
  shopEl.appendChild(row);
});

// --- buy an upgrade ---
function buy(u) {
  const c = cost(u);
  if (cookies < c) return;
  cookies -= c;
  owned[u.id] += 1;
  renderOrbits();
  render();
}

// --- render the helpers orbiting the cookie ---
// Group all owned helpers per orbit ring, then evenly space them on a circle.
function renderOrbits() {
  for (const ring of Object.values(orbits)) ring.innerHTML = '';

  // collect visible helpers, grouped by orbit
  const groups = { inner: [], mid: [], outer: [] };
  for (const u of UPGRADES) {
    const n = Math.min(owned[u.id], MAX_PER_TYPE);
    for (let i = 0; i < n; i++) groups[u.orbit].push(u);
  }

  for (const [ring, list] of Object.entries(groups)) {
    const total = list.length;
    list.forEach((u, i) => {
      const angle = (i / total) * 360;
      const helper = document.createElement('span');
      helper.className = 'helper' + (u.fx ? ` fx-${u.fx}` : '');
      helper.style.transform = `rotate(${angle}deg) translateY(var(--r)) rotate(${-angle}deg)`;
      helper.textContent = u.emoji;
      orbits[ring].appendChild(helper);
    });
  }
}

// --- wizard projectile: spawn a sparkle that flies from a wizard toward the cookie ---
function spawnSparkle() {
  if (owned.wizard <= 0) return;
  const startAngle = Math.random() * 360;
  const s = document.createElement('span');
  s.className = 'sparkle';
  s.textContent = '✨';
  s.style.setProperty('--a', `${startAngle}deg`);
  fxEl.appendChild(s);
  s.addEventListener('animationend', () => s.remove());
}

// --- click the cookie ---
cookieBtn.addEventListener('click', () => {
  cookies += perClick();
  cookieBtn.classList.remove('pop');
  void cookieBtn.offsetWidth; // restart animation
  cookieBtn.classList.add('pop');
  render();
});

// --- render numeric UI from state ---
function render() {
  countEl.textContent    = fmt(cookies);
  perClickEl.textContent = fmt(perClick());
  perSecEl.textContent   = fmt(perSec());

  shopEl.querySelectorAll('.shop-item').forEach(row => {
    const u = UPGRADES.find(x => x.id === row.dataset.id);
    const c = cost(u);
    row.querySelector('[data-cost]').textContent  = fmt(c);
    row.querySelector('[data-count]').textContent = owned[u.id] ? `×${owned[u.id]}` : '';
    row.disabled = cookies < c;
  });
}

// --- passive cookies per second (smooth tick) ---
let last = performance.now();
setInterval(() => {
  const now = performance.now();
  const dt = (now - last) / 1000;
  last = now;
  cookies += perSec() * dt;
  render();
}, 100);

// --- wizard sparkles fire periodically ---
setInterval(spawnSparkle, 700);

renderOrbits();
render();

// Tell Farcaster the app is loaded so the splash screen closes.
await sdk.actions.ready();
