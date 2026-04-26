// Pixel-art operator at desk shown in Controller mode borders.
// Drawn as a small caricature in the corners. Generic indie-hacker vibe.

export function drawOperatorScene(ctx, time, w, h) {
  // Draw small operator at desk in lower-right region of screen as a tiny scene
  // We'll draw on top of the main control-room frame.
  const baseX = w - 220;
  const baseY = h - 150;
  ctx.save();
  ctx.translate(baseX, baseY);
  drawOperatorAtDesk(ctx, time);
  ctx.restore();

  // Server rack lower-left
  ctx.save();
  ctx.translate(20, h - 130);
  drawServerRack(ctx, time);
  ctx.restore();

  // Wall window (Bali-ish silhouette) top-left
  ctx.save();
  ctx.translate(38, 36);
  drawWindow(ctx, time);
  ctx.restore();
}

function px(ctx, x, y, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, 1, 1);
}

function drawOperatorAtDesk(ctx, t) {
  // Desk
  ctx.fillStyle = '#3b2c20';
  ctx.fillRect(0, 70, 200, 14);
  ctx.fillStyle = '#241813';
  ctx.fillRect(0, 84, 200, 4);

  // Cables
  ctx.strokeStyle = '#0c1c14';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(20, 70);
  ctx.bezierCurveTo(40, 90, 60, 92, 80, 78);
  ctx.moveTo(120, 70);
  ctx.bezierCurveTo(140, 92, 160, 88, 180, 76);
  ctx.stroke();

  // Coffee mug
  ctx.fillStyle = '#bcd';
  ctx.fillRect(8, 60, 10, 10);
  ctx.fillStyle = '#9aa';
  ctx.fillRect(18, 62, 3, 6);
  ctx.fillStyle = '#3b2a20';
  ctx.fillRect(10, 62, 6, 4);
  // Steam
  ctx.strokeStyle = 'rgba(220,255,235,0.4)';
  ctx.beginPath();
  const sw = Math.sin(t * 4) * 1.5;
  ctx.moveTo(13, 60);
  ctx.quadraticCurveTo(13 + sw, 56, 13, 50);
  ctx.stroke();

  // Two monitors
  drawMonitor(ctx, 30, 14, 60, 50, t, 'arena');
  drawMonitor(ctx, 100, 18, 70, 46, t, 'logs');

  // Operator (sitting silhouette)
  const ox = 96, oy = 50;
  // Hair (messy)
  ctx.fillStyle = '#1a120c';
  ctx.fillRect(ox - 8, oy - 22, 18, 8);
  ctx.fillRect(ox - 9, oy - 18, 20, 4);
  // Skin
  ctx.fillStyle = '#e3b58a';
  ctx.fillRect(ox - 6, oy - 14, 14, 12);
  // Beard scruff
  ctx.fillStyle = '#8b6a4a';
  ctx.fillRect(ox - 6, oy - 4, 14, 2);
  // Glasses glow
  ctx.fillStyle = '#0f3b25';
  ctx.fillRect(ox - 5, oy - 11, 5, 3);
  ctx.fillRect(ox + 2, oy - 11, 5, 3);
  ctx.fillStyle = '#00ff88';
  ctx.fillRect(ox - 4, oy - 10, 3, 1);
  ctx.fillRect(ox + 3, oy - 10, 3, 1);
  // T-shirt
  ctx.fillStyle = '#1f2a25';
  ctx.fillRect(ox - 12, oy - 2, 24, 16);
  // Logo
  ctx.fillStyle = '#00ff88';
  ctx.fillRect(ox - 2, oy + 2, 4, 4);

  // Arms typing
  const wob = Math.sin(t * 12);
  ctx.fillStyle = '#e3b58a';
  ctx.fillRect(ox - 14, oy + 4 + (wob > 0 ? -1 : 0), 4, 6);
  ctx.fillRect(ox + 10, oy + 4 + (wob < 0 ? -1 : 0), 4, 6);

  // Laptop
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(ox - 12, oy + 10, 24, 4);
  ctx.fillStyle = '#0f3b25';
  ctx.fillRect(ox - 11, oy + 11, 22, 2);

  // Caption
  ctx.font = '10px "VT323", monospace';
  ctx.fillStyle = '#6f8a7a';
  ctx.textAlign = 'center';
  ctx.fillText('// portal-ops', 100, 100);
}

function drawMonitor(ctx, x, y, w, h, t, kind) {
  // Stand
  ctx.fillStyle = '#15110d';
  ctx.fillRect(x + w / 2 - 6, y + h, 12, 6);
  ctx.fillRect(x + w / 2 - 14, y + h + 6, 28, 2);

  // Bezel
  ctx.fillStyle = '#0a0d0c';
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  // Screen
  ctx.fillStyle = '#03130c';
  ctx.fillRect(x, y, w, h);

  // Screen content
  if (kind === 'arena') {
    // Mini portals
    ctx.fillStyle = '#00ff88';
    for (let i = 0; i < 4; i++) {
      const px = x + 8 + i * (w - 16) / 3;
      const py = y + 10 + (i % 2) * (h - 20);
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Moving dots
    for (let i = 0; i < 4; i++) {
      const px = x + 6 + ((t * 8 + i * 9) % (w - 12));
      const py = y + 14 + (i * 7) % (h - 18);
      ctx.fillRect(px, py, 2, 2);
    }
  } else {
    // Log lines
    ctx.font = '8px "VT323", monospace';
    ctx.fillStyle = '#0f8a4a';
    const lines = ['> sort 1', '> portal up', '> alert', '> route 7', '> kick', '> ok'];
    for (let i = 0; i < 5; i++) {
      const idx = (Math.floor(t * 2) + i) % lines.length;
      ctx.fillText(lines[idx], x + 4, y + 8 + i * 8);
    }
  }

  // CRT scanlines
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  for (let yy = y; yy < y + h; yy += 2) ctx.fillRect(x, yy, w, 1);
}

function drawServerRack(ctx, t) {
  // Rack
  ctx.fillStyle = '#0a0d0b';
  ctx.fillRect(0, 0, 60, 100);
  ctx.strokeStyle = '#1c2a23';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, 59, 99);
  // Slots with blinky LEDs
  for (let i = 0; i < 8; i++) {
    const yy = 6 + i * 11;
    ctx.fillStyle = '#15201c';
    ctx.fillRect(4, yy, 52, 8);
    // LEDs
    for (let j = 0; j < 3; j++) {
      const on = ((Math.floor(t * (5 + j)) + i) % 2) === 0;
      ctx.fillStyle = on ? (j === 2 ? '#ff4d4d' : '#00ff88') : '#11221a';
      ctx.fillRect(8 + j * 4, yy + 3, 2, 2);
    }
    ctx.fillStyle = 'rgba(0,255,136,0.15)';
    ctx.fillRect(20, yy + 3, 30, 2);
  }
  ctx.font = '9px "VT323", monospace';
  ctx.fillStyle = '#0f8a4a';
  ctx.fillText('VIBE-RACK', 4, 113);
}

function drawWindow(ctx, t) {
  // Window frame
  ctx.fillStyle = '#0a0e0c';
  ctx.fillRect(0, 0, 130, 60);
  ctx.fillStyle = '#06160e';
  ctx.fillRect(2, 2, 126, 56);
  // Sky
  const grad = ctx.createLinearGradient(0, 0, 0, 60);
  grad.addColorStop(0, '#0a3a2a');
  grad.addColorStop(1, '#072018');
  ctx.fillStyle = grad;
  ctx.fillRect(2, 2, 126, 56);
  // Palm silhouette
  ctx.fillStyle = '#020a06';
  ctx.fillRect(20, 36, 2, 22);
  for (let i = 0; i < 5; i++) {
    const a = i * 0.6;
    ctx.fillRect(21 - 8 + Math.cos(a) * 8, 36 - Math.sin(a) * 8, 8, 2);
  }
  // Mountain
  ctx.beginPath();
  ctx.moveTo(40, 58);
  ctx.lineTo(80, 24);
  ctx.lineTo(120, 58);
  ctx.fill();
  // Sun
  ctx.fillStyle = '#ffe66d';
  ctx.beginPath();
  ctx.arc(100, 22, 4, 0, Math.PI * 2);
  ctx.fill();
  // Cross frame
  ctx.fillStyle = '#0a0e0c';
  ctx.fillRect(64, 2, 2, 56);
  ctx.fillRect(2, 28, 126, 2);

  ctx.font = '9px "VT323", monospace';
  ctx.fillStyle = '#0f8a4a';
  ctx.fillText('// 6:32 PM, BALI-ish', 0, 72);
}
