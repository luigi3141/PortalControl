// Terminal log overlay manager.

let logEl = null;
let rootEl = null;
const MAX_LINES = 8;

export function initTerminal() {
  rootEl = document.getElementById('terminal');
  logEl = document.getElementById('terminal-log');
}

export function showTerminal(visible) {
  if (!rootEl) return;
  rootEl.classList.toggle('hidden', !visible);
}

export function clearTerminal() {
  if (logEl) logEl.innerHTML = '';
}

export function termLog(text, level = '') {
  if (!logEl) return;
  const div = document.createElement('div');
  div.className = `line ${level}`.trim();
  const ts = `[${new Date().toLocaleTimeString('en-GB', { hour12: false })}]`;
  div.textContent = `${ts} ${text}`;
  logEl.appendChild(div);
  while (logEl.children.length > MAX_LINES) logEl.removeChild(logEl.firstChild);
}

export function termBoot(lines) {
  clearTerminal();
  let i = 0;
  const tick = () => {
    if (i >= lines.length) return;
    const lvl = i === 3 ? 'warn' : i === lines.length - 1 ? 'ok' : '';
    termLog(lines[i], lvl);
    i++;
    if (i < lines.length) setTimeout(tick, 220 + Math.random() * 180);
  };
  tick();
}
