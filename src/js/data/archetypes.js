// Entity archetypes. Same definitions used by both Runner and Controller modes.
// Speed values are pixels/second on the logical 1280x720 arena.

export const ARCHETYPES = {
  duck: {
    id: 'duck',
    label: 'Duck',
    icon: '🦆',
    color: '#ffe66d',
    speed: 130,
    hp: 100,
    radius: 18,
    desiredPortalId: 'duck',
    chaosType: 'swarm',
    description: 'Average speed. Small hitbox. Quacks.',
  },
  missile: {
    id: 'missile',
    label: 'Missile',
    icon: '🚀',
    color: '#ff4d4d',
    speed: 220,
    hp: 60,
    radius: 16,
    desiredPortalId: 'missile',
    chaosType: 'explosion',
    description: 'Fast. Bad turning. Explodes on impact.',
    turnRate: 2.4,
  },
  aiAgent: {
    id: 'aiAgent',
    label: 'AI Agent',
    icon: '🤖',
    color: '#66e3ff',
    speed: 150,
    hp: 80,
    radius: 17,
    desiredPortalId: 'ai',
    chaosType: 'duplicate',
    description: 'Erratic. Short dash cooldown. Hallucinates routes.',
  },
  bugReport: {
    id: 'bugReport',
    label: 'Bug Report',
    icon: '🐞',
    color: '#c084fc',
    speed: 95,
    hp: 130,
    radius: 15,
    desiredPortalId: 'bug',
    chaosType: 'glitch',
    description: 'Slow but slips through small gates.',
  },
  clown: {
    id: 'clown',
    label: 'Clown',
    icon: '🤡',
    color: '#ff7ab6',
    speed: 140,
    hp: 90,
    radius: 18,
    desiredPortalId: 'clown',
    chaosType: 'panic',
    description: 'Bounces unpredictably on collision.',
  },
  racer: {
    id: 'racer',
    label: 'Racer',
    icon: '🏎️',
    color: '#f97316',
    speed: 200,
    hp: 70,
    radius: 17,
    desiredPortalId: 'racer',
    chaosType: 'crash',
    description: 'High top speed. Slow acceleration.',
    accelTime: 0.9,
  },
  paperPlane: {
    id: 'paperPlane',
    label: 'Paper Plane',
    icon: '✈️',
    color: '#93c5fd',
    speed: 160,
    hp: 65,
    radius: 16,
    desiredPortalId: 'sky',
    chaosType: 'jam',
    description: 'Glides. Low friction.',
  },
  vibeCoder: {
    id: 'vibeCoder',
    label: 'Vibe Coder',
    icon: '👾',
    color: '#22c55e',
    speed: 135,
    hp: 100,
    radius: 17,
    desiredPortalId: 'random',
    chaosType: 'random',
    description: 'Default fallback. Generic vibes.',
  },
};

export const ARCHETYPE_IDS = Object.keys(ARCHETYPES);

export function getArchetype(id) {
  return ARCHETYPES[id] || ARCHETYPES.vibeCoder;
}

// Heuristic ref classification for incoming portal entrants.
const REF_ARCHETYPES = [
  { pattern: /duck|quack/i, archetype: 'duck' },
  { pattern: /missile|iron|dome|war|bomb/i, archetype: 'missile' },
  { pattern: /plane|fly|air|sky/i, archetype: 'paperPlane' },
  { pattern: /clown|horror|dark|panic/i, archetype: 'clown' },
  { pattern: /car|rally|drive|derby|race|kart/i, archetype: 'racer' },
  { pattern: /\bai\b|agent|bot|llm|gpt/i, archetype: 'aiAgent' },
  { pattern: /bug|broken|crash|error/i, archetype: 'bugReport' },
];

export function classifyByRef(ref) {
  if (!ref) return 'vibeCoder';
  for (const { pattern, archetype } of REF_ARCHETYPES) {
    if (pattern.test(ref)) return archetype;
  }
  return 'vibeCoder';
}

// Incompatible collision matrix for Controller Mode chaos events.
// Returns an effect string or null.
export function collisionEffect(a, b) {
  const pair = [a, b].sort().join('|');
  const map = {
    'duck|missile': 'explosion',
    'aiAgent|bugReport': 'duplicate',
    'clown|vibeCoder': 'panic',
    'paperPlane|racer': 'jam',
  };
  if (map[pair]) return map[pair];
  // Racer collides with anything else
  if (a === 'racer' || b === 'racer') return 'knockback';
  return null;
}
