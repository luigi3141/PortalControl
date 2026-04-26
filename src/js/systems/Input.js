// Centralized input. Tracks keyboard + pointer.

const keys = new Set();
const pressed = new Set(); // edge-triggered
const pointer = { x: 0, y: 0, down: false, downEdge: false, upEdge: false };

const codeToKey = (e) => {
  const k = e.key;
  if (!k) return null;
  return k.length === 1 ? k.toLowerCase() : k;
};

window.addEventListener('keydown', (e) => {
  const k = codeToKey(e);
  if (!k) return;
  if (!keys.has(k)) pressed.add(k);
  keys.add(k);
  // Prevent default for game-relevant keys (arrows, space, wasd).
  if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  const k = codeToKey(e);
  if (!k) return;
  keys.delete(k);
});

window.addEventListener('blur', () => {
  keys.clear();
});

let canvasEl = null;
const LOGICAL_W = 1280;
const LOGICAL_H = 720;
export function bindCanvas(canvas) {
  canvasEl = canvas;
  const update = (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0) - rect.left;
    const py = (e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0) - rect.top;
    pointer.x = (px / Math.max(1, rect.width)) * LOGICAL_W;
    pointer.y = (py / Math.max(1, rect.height)) * LOGICAL_H;
  };
  canvas.addEventListener('pointermove', update);
  canvas.addEventListener('pointerdown', (e) => {
    update(e);
    if (!pointer.down) pointer.downEdge = true;
    pointer.down = true;
  });
  window.addEventListener('pointerup', () => {
    if (pointer.down) pointer.upEdge = true;
    pointer.down = false;
  });
}

export const Input = {
  isDown(...ks) { return ks.some((k) => keys.has(k)); },
  wasPressed(k) { return pressed.has(k); },
  axes() {
    let x = 0, y = 0;
    if (this.isDown('a', 'ArrowLeft'))  x -= 1;
    if (this.isDown('d', 'ArrowRight')) x += 1;
    if (this.isDown('w', 'ArrowUp'))    y -= 1;
    if (this.isDown('s', 'ArrowDown'))  y += 1;
    if (x && y) { const inv = 1 / Math.SQRT2; x *= inv; y *= inv; }
    return { x, y };
  },
  pointer() { return pointer; },
  consumePointerDown() {
    const e = pointer.downEdge;
    pointer.downEdge = false;
    return e;
  },
  consumePointerUp() {
    const e = pointer.upEdge;
    pointer.upEdge = false;
    return e;
  },
  endFrame() {
    pressed.clear();
  },
};
