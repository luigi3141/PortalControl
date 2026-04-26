// On-screen controls for touch devices.
// Runner: floating joystick (left half) + dash button (right side).
// Controller: tappable Freeze + Quarantine tool buttons.
// On non-touch devices, the runner overlay is hidden but the controller
// tool buttons stay visible (they double as visual labels).

import { Input } from './Input.js';
import { Audio } from './AudioSystem.js';

let runnerOverlay = null;
let controllerOverlay = null;
let controllerCallbacks = {};

export function isTouchDevice() {
  return ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
}

function buildRunner() {
  const el = document.createElement('div');
  el.className = 'touch-runner';
  el.innerHTML = `
    <div class="joystick-zone" id="joy-zone"></div>
    <div class="joystick-base" id="joy-base">
      <div class="joystick-knob" id="joy-knob"></div>
    </div>
    <button class="touch-dash-btn" id="touch-dash" type="button">DASH</button>
  `;
  document.body.appendChild(el);

  const zone = el.querySelector('#joy-zone');
  const base = el.querySelector('#joy-base');
  const knob = el.querySelector('#joy-knob');
  const dashBtn = el.querySelector('#touch-dash');

  let center = { x: 0, y: 0 };
  let activeId = null;

  const start = (e) => {
    e.preventDefault();
    const t = e.changedTouches ? e.changedTouches[0] : e;
    activeId = e.changedTouches ? t.identifier : 'mouse';
    center = { x: t.clientX, y: t.clientY };
    base.style.left = `${center.x}px`;
    base.style.top = `${center.y}px`;
    base.style.opacity = '0.85';
    knob.style.transform = 'translate(-50%, -50%)';
    Input.setTouchAxis(0, 0);
  };

  const move = (e) => {
    if (activeId === null) return;
    e.preventDefault();
    let t;
    if (e.changedTouches) {
      for (const ct of e.changedTouches) if (ct.identifier === activeId) t = ct;
      if (!t) return;
    } else {
      t = e;
    }
    const dx = t.clientX - center.x;
    const dy = t.clientY - center.y;
    const max = 50;
    const d = Math.hypot(dx, dy);
    const cx = d > max ? (dx / d) * max : dx;
    const cy = d > max ? (dy / d) * max : dy;
    knob.style.transform = `translate(calc(-50% + ${cx}px), calc(-50% + ${cy}px))`;
    Input.setTouchAxis(cx / max, cy / max);
  };

  const end = (e) => {
    if (activeId === null) return;
    if (e?.preventDefault) e.preventDefault();
    activeId = null;
    base.style.opacity = '0';
    Input.setTouchAxis(0, 0);
  };

  zone.addEventListener('touchstart', start, { passive: false });
  zone.addEventListener('touchmove',  move,  { passive: false });
  zone.addEventListener('touchend',   end,   { passive: false });
  zone.addEventListener('touchcancel',end,   { passive: false });
  // Mouse fallback for testing on desktop
  zone.addEventListener('mousedown', start);
  window.addEventListener('mousemove', (e) => { if (activeId === 'mouse') move(e); });
  window.addEventListener('mouseup',   () => { if (activeId === 'mouse') end(); });

  const fireDash = (e) => {
    e?.preventDefault?.();
    Input.requestDash();
    Audio.dash();
  };
  dashBtn.addEventListener('touchstart', fireDash, { passive: false });
  dashBtn.addEventListener('mousedown', fireDash);

  return el;
}

function buildController() {
  const el = document.createElement('div');
  el.className = 'touch-controller';
  el.innerHTML = `
    <div class="touch-tip">tap entity, then tap a portal to route</div>
    <div class="touch-tool-row">
      <button class="touch-tool-btn" data-tool="freeze" type="button">
        <span class="tool-key">F</span>
        <span class="tool-name">FREEZE</span>
      </button>
      <button class="touch-tool-btn" data-tool="quarantine" type="button">
        <span class="tool-key">Q</span>
        <span class="tool-name">QUARANTINE</span>
      </button>
    </div>
  `;
  document.body.appendChild(el);

  el.addEventListener('click', (e) => {
    const btn = e.target.closest('.touch-tool-btn');
    if (!btn) return;
    e.preventDefault();
    const tool = btn.dataset.tool;
    if (tool === 'freeze') controllerCallbacks.onFreeze?.();
    else if (tool === 'quarantine') controllerCallbacks.onQuarantine?.();
  });

  return el;
}

export function showRunnerControls() {
  hideAll();
  if (!isTouchDevice()) return;
  if (!runnerOverlay) runnerOverlay = buildRunner();
  runnerOverlay.classList.remove('hidden');
}

export function showControllerControls(callbacks) {
  hideAll();
  controllerCallbacks = callbacks || {};
  if (!controllerOverlay) controllerOverlay = buildController();
  controllerOverlay.classList.remove('hidden');
}

export function hideAll() {
  runnerOverlay?.classList.add('hidden');
  controllerOverlay?.classList.add('hidden');
  Input.setTouchAxis(0, 0);
  controllerCallbacks = {};
}

export function setControllerToolState({ freezeReady, quarantineUses }) {
  if (!controllerOverlay) return;
  const fb = controllerOverlay.querySelector('[data-tool="freeze"]');
  const qb = controllerOverlay.querySelector('[data-tool="quarantine"]');
  if (fb) {
    fb.classList.toggle('cooling', !freezeReady);
    fb.disabled = !freezeReady;
  }
  if (qb) {
    qb.classList.toggle('depleted', quarantineUses <= 0);
    qb.disabled = quarantineUses <= 0;
    const name = qb.querySelector('.tool-name');
    if (name) name.textContent = `QUARANTINE (${quarantineUses})`;
  }
}
