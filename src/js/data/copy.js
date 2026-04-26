export const COPY = {
  title: 'PORTAL CONTROL',
  subtitle: 'Escape the system or become the system.',

  menu: {
    runner: 'Play Runner',
    controller: 'Play Controller',
    howTo: 'How to Play',
  },

  howTo: {
    runner:
      'Reach your assigned portal. Dodge gates, traffic, and redirect beams. ' +
      'If you escape, you can jump into the real Vibe Jam portal.',
    controller:
      'Route every entrant to the correct portal. Wrong routes and collisions ' +
      'destabilise the system. Keep the portal alive as long as possible.',
  },

  runner: {
    successTitle: 'PORTAL LOCK ACQUIRED',
    successBody: 'You reached your intended destination.',
    failureTitle: 'MISROUTED',
    failureBodies: [
      'The controller sent you to the wrong timeline.',
      'You were processed by the system.',
      'Wrong portal. Wrong vibes.',
    ],
    enterPortal: 'Enter Vibe Jam Portal',
    runAgain: 'Run Again',
    becomeController: 'Respawn as Controller',
    retry: 'Retry Run',
    mainMenu: 'Main Menu',
  },

  controller: {
    failureTitle: 'PORTAL SYSTEM COLLAPSED',
    failureBody: 'Too many bad routes. Too much vibe. Not enough backend.',
    restart: 'Restart as Controller',
    becomeRunner: 'Respawn as Runner',
    mainMenu: 'Main Menu',
  },

  terminal: {
    surge: 'PORTAL TRAFFIC SURGE',
    override: 'MANUAL OVERRIDE REQUIRED',
    ducks: 'TOO MANY DUCKS',
    overload: 'VIBE BACKEND OVERLOAD',
    evaded: 'RUNNER EVADED ROUTE',
    misrouted: 'MISROUTED ENTITY',
    arrival: 'PORTAL ARRIVAL DETECTED',
    correctRoute: 'ROUTE CONFIRMED',
    wrongRoute: 'WRONG PORTAL',
    explosion: 'CHAOS EVENT: EXPLOSION',
    duplicate: 'CHAOS EVENT: DUPLICATE SPAWN',
    panic: 'CHAOS EVENT: PANIC WAVE',
    jam: 'CHAOS EVENT: AIRSPACE JAM',
    knockback: 'CHAOS EVENT: HIGH-SPEED CRASH',
    boot: [
      'BOOT vibe-portal-controller v0.94',
      'loading green portal aesthetic...',
      'opening backend socket :2026',
      'INFO: too many ducks',
      'INFO: ready',
    ],
  },
};

export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
