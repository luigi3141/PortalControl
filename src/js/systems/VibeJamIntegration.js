// Parses incoming portal params, builds outgoing portal URLs.

const VIBE_JAM_PORTAL_URL = 'https://vibej.am/portal/2026';

const clampNumber = (raw, def, min, max) => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return def;
  if (typeof min === 'number' && n < min) return min;
  if (typeof max === 'number' && n > max) return max;
  return n;
};

const sanitizeColor = (c) => {
  if (!c) return null;
  if (/^#[0-9a-f]{3,8}$/i.test(c)) return c;
  if (/^[0-9a-f]{6}$/i.test(c)) return `#${c}`;
  return null;
};

const sanitizeUsername = (n) => {
  if (!n) return null;
  // Strip control chars, limit length.
  const cleaned = String(n).replace(/[^\w\-. ]/g, '').trim().slice(0, 24);
  return cleaned || null;
};

export function parseIncomingPortal() {
  const params = new URLSearchParams(window.location.search);
  const isPortal = params.get('portal') === 'true';
  return {
    isPortalArrival: isPortal,
    username: sanitizeUsername(params.get('username')) || null,
    color: sanitizeColor(params.get('color')) || null,
    speed: clampNumber(params.get('speed'), 5, 0.5, 20),
    ref: (params.get('ref') || '').slice(0, 80),
    avatarUrl: null, // skip for MVP
    team: (params.get('team') || '').slice(0, 24) || null,
    hp: clampNumber(params.get('hp'), 100, 1, 100),
    speedX: clampNumber(params.get('speed_x'), 0, -50, 50),
    speedY: clampNumber(params.get('speed_y'), 0, -50, 50),
    speedZ: clampNumber(params.get('speed_z'), 0, -50, 50),
    rotationX: clampNumber(params.get('rotation_x'), 0, -360, 360),
    rotationY: clampNumber(params.get('rotation_y'), 0, -360, 360),
    rotationZ: clampNumber(params.get('rotation_z'), 0, -360, 360),
  };
}

export function buildVibePortalUrl(playerState = {}) {
  const params = new URLSearchParams();
  params.set('username', playerState.username || 'portal_runner');
  params.set('color', playerState.color || '#00ff88');
  params.set('speed', String(Math.max(1, Math.round(playerState.speed || 5))));
  params.set('hp', String(Math.max(1, Math.min(100, Math.round(playerState.hp || 100)))));
  params.set('ref', window.location.hostname || 'portal-control');
  return `${VIBE_JAM_PORTAL_URL}?${params.toString()}`;
}

export function goToVibePortal(playerState) {
  const url = buildVibePortalUrl(playerState);
  window.location.href = url;
}
