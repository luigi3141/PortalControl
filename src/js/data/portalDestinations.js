// Portal destinations. Positions are normalized [0..1] of arena width/height.
// The arena coordinate system is 1280x720 by default.

export const PORTAL_DESTINATIONS = [
  { id: 'duck',    label: 'Duck Portal',           archetype: 'duck',       color: '#ffe66d', icon: '🦆', x: 0.10, y: 0.18 },
  { id: 'missile', label: 'Missile Portal',        archetype: 'missile',    color: '#ff4d4d', icon: '🚀', x: 0.50, y: 0.10 },
  { id: 'ai',      label: 'AI Portal',             archetype: 'aiAgent',    color: '#66e3ff', icon: '🤖', x: 0.90, y: 0.18 },
  { id: 'bug',     label: 'Broken Build Portal',   archetype: 'bugReport',  color: '#c084fc', icon: '🐞', x: 0.10, y: 0.82 },
  { id: 'clown',   label: 'Clown Portal',          archetype: 'clown',      color: '#ff7ab6', icon: '🤡', x: 0.30, y: 0.90 },
  { id: 'racer',   label: 'Racer Portal',          archetype: 'racer',      color: '#f97316', icon: '🏎️', x: 0.70, y: 0.90 },
  { id: 'sky',     label: 'Sky Portal',            archetype: 'paperPlane', color: '#93c5fd', icon: '✈️', x: 0.90, y: 0.82 },
  { id: 'random',  label: 'Random Vibe Jam Portal',archetype: 'vibeCoder',  color: '#22c55e', icon: '👾', x: 0.50, y: 0.50 },
];

export function getPortal(id) {
  return PORTAL_DESTINATIONS.find((p) => p.id === id) || PORTAL_DESTINATIONS[PORTAL_DESTINATIONS.length - 1];
}

export function portalForArchetype(archetypeId) {
  const p = PORTAL_DESTINATIONS.find((p) => p.archetype === archetypeId);
  return p || getPortal('random');
}
