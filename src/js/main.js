// Entry point. Boots the game, parses portal params, kicks off scene manager.

import { parseIncomingPortal } from './systems/VibeJamIntegration.js';
import { bindCanvas, Input } from './systems/Input.js';
import { initModal } from './ui/Modal.js';
import { initHud } from './ui/Hud.js';
import { initTerminal } from './systems/Terminal.js';
import { Game } from './game.js';
import { COPY } from './data/copy.js';

const canvas = document.getElementById('game');
bindCanvas(canvas);
initModal();
initHud();
initTerminal();

const incoming = parseIncomingPortal();

// Show portal arrival toast if applicable
if (incoming.isPortalArrival) {
  const toast = document.createElement('div');
  toast.className = 'arrival-toast';
  toast.textContent = `> ${COPY.terminal.arrival}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

// Hide boot splash
setTimeout(() => {
  const boot = document.getElementById('boot');
  if (boot) {
    boot.classList.add('fade');
    setTimeout(() => boot.classList.add('hidden'), 500);
  }
}, 700);

// Resize canvas to maintain crisp rendering
function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  // We keep logical 1280x720; CSS scales it. Canvas pixel buffer matches viewport for crisper text.
  const targetW = window.innerWidth;
  const targetH = window.innerHeight;
  // Maintain 16:9 letterbox by adjusting CSS
  const aspect = 16 / 9;
  const winAspect = targetW / targetH;
  let cssW, cssH;
  if (winAspect > aspect) {
    cssH = targetH;
    cssW = Math.floor(cssH * aspect);
  } else {
    cssW = targetW;
    cssH = Math.floor(cssW / aspect);
  }
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  canvas.width = Math.floor(1280 * dpr);
  canvas.height = Math.floor(720 * dpr);
  game.setRenderScale(dpr);
}

const game = new Game(canvas, { incoming });
window.addEventListener('resize', resize);
resize();

// If portal arrival, default to Runner Mode quickly. Else show menu.
if (incoming.isPortalArrival) {
  setTimeout(() => game.startRunner({ portalArrival: true }), 850);
} else {
  setTimeout(() => game.showMainMenu(), 750);
}

// Main loop
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.update(dt);
  game.draw();
  Input.endFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
