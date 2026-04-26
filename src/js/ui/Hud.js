// HUD overlay (DOM-based for crisp text).

let root = null;

export function initHud() {
  root = document.getElementById('hud');
}

export function showHud() {
  if (root) root.classList.remove('hidden');
}
export function hideHud() {
  if (root) {
    root.classList.add('hidden');
    root.innerHTML = '';
  }
}

function ensureRows() {
  if (!root) return null;
  if (!root.dataset.ready) {
    root.innerHTML = `
      <div class="hud-row top-left" id="hud-tl"></div>
      <div class="hud-row top-right" id="hud-tr"></div>
      <div class="hud-row bottom-left" id="hud-bl"></div>
      <div class="hud-row bottom-right" id="hud-br"></div>
    `;
    root.dataset.ready = '1';
  }
  return root;
}

function pill({ label, value, warn = false, bar = null }) {
  const el = document.createElement('div');
  el.className = `pill${warn ? ' warn' : ''}`;
  if (label) {
    const l = document.createElement('span');
    l.className = 'label';
    l.textContent = label;
    el.appendChild(l);
  }
  if (value != null) {
    const v = document.createElement('span');
    v.className = 'value';
    v.textContent = value;
    el.appendChild(v);
  }
  if (bar != null) {
    const b = document.createElement('div');
    b.className = `bar${bar.danger ? ' danger' : ''}`;
    const f = document.createElement('div');
    f.className = 'fill';
    f.style.width = `${Math.max(0, Math.min(100, bar.pct))}%`;
    b.appendChild(f);
    el.appendChild(b);
  }
  return el;
}

export function setHud({ topLeft = [], topRight = [], bottomLeft = [], bottomRight = [] }) {
  ensureRows();
  const map = { 'hud-tl': topLeft, 'hud-tr': topRight, 'hud-bl': bottomLeft, 'hud-br': bottomRight };
  for (const [id, arr] of Object.entries(map)) {
    const r = document.getElementById(id);
    if (!r) continue;
    r.innerHTML = '';
    for (const item of arr) r.appendChild(pill(item));
  }
}
