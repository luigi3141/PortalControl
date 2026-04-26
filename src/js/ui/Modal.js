// Simple modal renderer.

let root = null;

export function initModal() {
  root = document.getElementById('modal-root');
}

export function hideModal() {
  if (!root) return;
  root.classList.add('hidden');
  root.innerHTML = '';
}

export function showModal({ title, subtitle, body, danger = false, stats = null, actions = [] }) {
  if (!root) return;
  root.innerHTML = '';

  const modal = document.createElement('div');
  modal.className = 'modal';

  if (title) {
    const h = document.createElement('h1');
    h.textContent = title;
    if (danger) h.classList.add('danger');
    modal.appendChild(h);
  }
  if (subtitle) {
    const s = document.createElement('div');
    s.className = 'subtitle';
    s.textContent = subtitle;
    modal.appendChild(s);
  }
  if (body) {
    const b = document.createElement('div');
    b.className = 'body';
    b.textContent = body;
    modal.appendChild(b);
  }
  if (stats) {
    const grid = document.createElement('div');
    grid.className = 'stats';
    for (const [k, v] of Object.entries(stats)) {
      const ke = document.createElement('div');
      ke.className = 'k';
      ke.textContent = k;
      const ve = document.createElement('div');
      ve.className = 'v';
      ve.textContent = String(v);
      grid.appendChild(ke);
      grid.appendChild(ve);
    }
    modal.appendChild(grid);
  }
  const acts = document.createElement('div');
  acts.className = 'actions';
  for (const a of actions) {
    const btn = document.createElement('button');
    btn.className = `btn ${a.kind || ''}`.trim();
    btn.textContent = a.label;
    btn.addEventListener('click', () => {
      a.onClick?.();
    });
    acts.appendChild(btn);
  }
  modal.appendChild(acts);

  root.appendChild(modal);
  root.classList.remove('hidden');
}
