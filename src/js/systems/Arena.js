// Logical arena dimensions + grid background helper.

export const ARENA = { w: 1280, h: 720 };

export function drawGrid(ctx, { w = ARENA.w, h = ARENA.h, cell = 40, t = 0, controllerMode = false } = {}) {
  // Base fill
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  if (controllerMode) {
    grad.addColorStop(0, '#06120c');
    grad.addColorStop(1, '#020604');
  } else {
    grad.addColorStop(0, '#031410');
    grad.addColorStop(1, '#000301');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Soft moving grid
  ctx.strokeStyle = controllerMode ? 'rgba(0,255,136,0.06)' : 'rgba(0,255,136,0.10)';
  ctx.lineWidth = 1;
  const offset = (t * 12) % cell;
  ctx.beginPath();
  for (let x = -offset; x <= w; x += cell) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = -offset; y <= h; y += cell) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  // Brighter center crosshair
  ctx.strokeStyle = 'rgba(0,255,136,0.18)';
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();

  // Border frame
  ctx.strokeStyle = 'rgba(0,255,136,0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, w - 4, h - 4);
}

export function drawControlRoomFrame(ctx, t) {
  // Outer monitor bezel illusion - dark border with corner glyphs
  const w = ARENA.w;
  const h = ARENA.h;
  const pad = 18;
  ctx.save();
  ctx.fillStyle = '#06090a';
  ctx.fillRect(0, 0, w, pad);
  ctx.fillRect(0, h - pad, w, pad);
  ctx.fillRect(0, 0, pad, h);
  ctx.fillRect(w - pad, 0, pad, h);

  // Bolts
  ctx.fillStyle = '#0a1612';
  for (const [bx, by] of [[6, 6], [w - 12, 6], [6, h - 12], [w - 12, h - 12]]) {
    ctx.fillRect(bx, by, 6, 6);
  }

  // Corner brackets
  ctx.strokeStyle = '#00ff88';
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 2;
  const len = 14;
  ctx.beginPath();
  ctx.moveTo(pad, pad + len); ctx.lineTo(pad, pad); ctx.lineTo(pad + len, pad);
  ctx.moveTo(w - pad, pad + len); ctx.lineTo(w - pad, pad); ctx.lineTo(w - pad - len, pad);
  ctx.moveTo(pad, h - pad - len); ctx.lineTo(pad, h - pad); ctx.lineTo(pad + len, h - pad);
  ctx.moveTo(w - pad, h - pad - len); ctx.lineTo(w - pad, h - pad); ctx.lineTo(w - pad - len, h - pad);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Top status line
  ctx.font = '14px "VT323", monospace';
  ctx.fillStyle = 'rgba(0,255,136,0.5)';
  ctx.textAlign = 'left';
  ctx.fillText(`>> portal-control :: vibe-jam-2026 :: t+${(t).toFixed(1)}s`, pad + 20, 14);
  ctx.textAlign = 'right';
  ctx.fillText(`SIGNAL ${(80 + Math.sin(t * 3) * 6).toFixed(0)}%`, w - pad - 20, 14);
  ctx.textAlign = 'left';
  ctx.restore();
}
