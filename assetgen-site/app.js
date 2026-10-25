/* Asset Generator — local prototype
 * Everything here runs client-side only. "Generation" is simulated with a short
 * delay and a placeholder swatch; nothing is sent anywhere. Data (games, library
 * assets, review queue) lives in this browser's localStorage, so it persists
 * across reloads on this computer but isn't shared with anyone else.
 */

const STORAGE_KEY = 'assetgen_prototype_v1';

function slugify(s) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'game';
}

function typeCode(type) {
  if (type === 'Sprite') return 'sprite';
  if (type === 'Texture') return 'texture';
  return 'concept';
}

function pad(n) { return String(n).padStart(2, '0'); }

function colorFor(str) {
  let h = 0;
  for (let i = 0; i < String(str).length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 35% 22%)`;
}

function timeAgo(iso) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function filenameFor(slug, item) {
  const src = item.source ? (item.source.kind === 'screenshot' ? '_scr' : '_gen') : '';
  return `${slug}_${typeCode(item.type)}_${item.subjectSlug}_${pad(item.variant)}${src}.png`;
}

function nextVariant(game, type, subjectSlug) {
  let max = 0;
  [...game.library, ...game.review].forEach((a) => {
    if (a.type === type && a.subjectSlug === subjectSlug) max = Math.max(max, a.variant);
  });
  return max + 1;
}

/* ---------- Seed data ---------- */

let _libId = 1;
let _revId = 1;

function libItem(type, subjectLabel, variant) {
  return { id: 'lib' + _libId++, type, subjectSlug: slugify(subjectLabel), subjectLabel, variant };
}

function revItem(type, subjectLabel, variant, source, submittedBy, minutesAgo, status) {
  return {
    id: 'rev' + _revId++,
    type,
    subjectSlug: slugify(subjectLabel),
    subjectLabel,
    variant,
    source,
    submittedBy,
    submittedAt: new Date(Date.now() - minutesAgo * 60000).toISOString(),
    status: status || 'pending',
  };
}

function defaultData() {
  const games = {};
  function makeGame(name, library, review) {
    games[slugify(name)] = { name, library: library || [], review: review || [] };
  }

  makeGame('Nova Raiders',
    [
      libItem('Sprite', 'Hero run', 3),
      libItem('Texture', 'Hull plate', 2),
      libItem('Concept art', 'Boss', 1),
      libItem('Sprite', 'Shield icon', 1),
      libItem('Texture', 'Panel glow', 1),
      libItem('Sprite', 'Enemy drone', 1),
      libItem('Concept art', 'Station keyart', 1),
      libItem('Texture', 'Floor grate', 1),
      libItem('Sprite', 'Powerup energy', 1),
      libItem('Sprite', 'Hero idle', 1),
    ],
    [
      revItem('Sprite', 'Shield icon', 5, { kind: 'prompt', text: 'A glowing energy-shield power-up icon, hexagonal, matches the sci-fi HUD style' }, 'Hadar', 12),
      revItem('Texture', 'Hull plate', 3, { kind: 'prompt', text: 'Weathered hull plating with scorch marks, matches the cruiser set' }, 'Mika', 40),
      revItem('Concept art', 'Boss', 2, { kind: 'prompt', text: 'Second-phase boss form, same silhouette language as the station keyart' }, 'Hadar', 120),
    ]
  );
  makeGame('Pixel Kingdoms');
  makeGame('Drift Circuit');
  makeGame('Starlit Fables');
  makeGame('Ironclad Siege');

  return { games };
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { console.warn('Could not read saved data, starting fresh.', e); }
  const d = defaultData();
  saveData(d);
  return d;
}

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch (e) { console.warn('Could not save — localStorage may be full or unavailable.', e); }
}

function resetData() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  location.reload();
}

function getParam(name) {
  return new URLSearchParams(location.search).get(name);
}

/* ---------- Shared header / game switcher ---------- */

function renderHeader(data, slug, active) {
  const game = data.games[slug];
  const host = document.getElementById('app-header');
  if (!game || !host) return;

  const pending = game.review.filter((r) => r.status === 'pending').length;
  const otherSlugs = Object.keys(data.games).filter((s) => s !== slug);

  host.innerHTML = `
    <div class="header-inner">
      <a href="index.html" class="brand-mark" aria-label="Back to all games">AG</a>
      <div class="divider"></div>
      <button type="button" class="game-pill" id="switcherToggle" aria-haspopup="true" aria-expanded="false">
        <span class="placeholder-sm" aria-hidden="true"></span>${game.name}<span class="chev">▾</span>
      </button>
      <nav class="tabs">
        <a href="library.html?game=${slug}" class="tab ${active === 'library' ? 'active' : ''}">Library</a>
        <a href="generate.html?game=${slug}" class="tab ${active === 'generate' ? 'active' : ''}">Generate</a>
        <a href="review.html?game=${slug}" class="tab ${active === 'review' ? 'active' : ''}">Review${pending ? ` <span class="badge">${pending}</span>` : ''}</a>
      </nav>
      <div class="header-right">
        <span class="org">Playsight AI</span>
        <span class="avatar" title="You (local test user)">HH</span>
      </div>
    </div>
    <div class="switcher-overlay hidden" id="switcherOverlay"></div>
    <div class="switcher-panel hidden" id="switcherPanel">
      <div class="switcher-search">
        <input type="search" id="switcherSearch" placeholder="Jump to a game…" aria-label="Search games">
      </div>
      <div class="switcher-list" id="switcherList">
        <a href="library.html?game=${slug}" class="game-row current" data-name="${game.name.toLowerCase()}">
          <span class="placeholder-sm" aria-hidden="true"></span>${game.name}<span class="current-tag">Current</span>
        </a>
        ${otherSlugs.map((s) => `
          <a href="library.html?game=${s}" class="game-row" data-name="${data.games[s].name.toLowerCase()}">
            <span class="placeholder-sm" aria-hidden="true"></span>${data.games[s].name}
          </a>`).join('')}
      </div>
      <div class="switcher-footer">
        <a href="index.html" class="game-row muted"><span aria-hidden="true">⋯</span>All games</a>
      </div>
    </div>
  `;

  const toggle = document.getElementById('switcherToggle');
  const overlay = document.getElementById('switcherOverlay');
  const panel = document.getElementById('switcherPanel');
  const search = document.getElementById('switcherSearch');

  function open() {
    overlay.classList.remove('hidden');
    panel.classList.remove('hidden');
    toggle.setAttribute('aria-expanded', 'true');
    search.value = '';
    filterRows('');
    search.focus();
  }
  function close() {
    overlay.classList.add('hidden');
    panel.classList.add('hidden');
    toggle.setAttribute('aria-expanded', 'false');
  }
  function filterRows(q) {
    document.querySelectorAll('#switcherList .game-row').forEach((row) => {
      row.classList.toggle('hidden', !row.dataset.name.includes(q.toLowerCase()));
    });
  }

  toggle.addEventListener('click', () => (panel.classList.contains('hidden') ? open() : close()));
  overlay.addEventListener('click', close);
  search.addEventListener('input', () => filterRows(search.value));
}

function emptyStateHTML(title, subtitle, ctaHref, ctaLabel) {
  return `
    <div class="empty-state">
      <span class="empty-icon" aria-hidden="true">✦</span>
      <h2 style="margin:0;font-size:17px;font-weight:600;">${title}</h2>
      <p style="margin:0;max-width:360px;font-size:13px;" class="muted">${subtitle}</p>
      ${ctaHref ? `<a href="${ctaHref}" class="btn btn-primary" style="margin-top:6px;">${ctaLabel}</a>` : ''}
    </div>
  `;
}
