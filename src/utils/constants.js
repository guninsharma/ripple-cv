// ─── Gesture definitions ─────────────────────────────────────────────────────
export const GESTURES = {
  celebrate: {
    id: 'celebrate',
    emote: '🎉',
    name: 'Celebrate',
    desc: 'Raise both fists above your head!',
    color: '#eab308',
  },
  heart: {
    id: 'heart',
    emote: '❤️',
    name: 'Heart',
    desc: 'Bring both index fingertips together!',
    color: '#f43f5e',
  },
  thumbsup: {
    id: 'thumbsup',
    emote: '👍',
    name: 'Thumbs Up',
    desc: 'Fist with thumb pointing up!',
    color: '#60a5fa',
  },
  thumbsdown: {
    id: 'thumbsdown',
    emote: '👎',
    name: 'Thumbs Down',
    desc: 'Fist with thumb pointing down!',
    color: '#f87171',
  },
  angry: {
    id: 'angry',
    emote: '😡',
    name: 'Angry',
    desc: 'Shake your head rapidly!',
    color: '#ef4444',
  },
  scared: {
    id: 'scared',
    emote: '😱',
    name: 'Scared',
    desc: 'Sudden backward lean detected!',
    color: '#a78bfa',
  },
  lasers: {
    id: 'lasers',
    emote: '🤘',
    name: 'Lasers',
    desc: 'Rock on hand sign!',
    color: '#f472b6',
  },
  peace: {
    id: 'peace',
    emote: '✌️',
    name: 'Peace',
    desc: 'Hold up index + middle fingers!',
    color: '#34d399',
  },
  none: {
    id: 'none',
    emote: '–',
    name: 'Tracking…',
    desc: 'Move to trigger reactions.',
    color: 'transparent',
  },
}

// ─── MediaPipe skeleton connections ──────────────────────────────────────────
// Pose landmark connections (index pairs)
export const POSE_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [24, 26], [25, 27], [26, 28],
  [0, 11],  [0, 12],
]

// Hand landmark connections
export const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
]

// ─── Detection thresholds ─────────────────────────────────────────────────────
export const THRESHOLDS = {
  // Global timing
  globalCooldown: 800,           // ms between any emote firing
  holdFramesRequired: 8,         // frames a static pose must be held (~0.27s)
  bufferSize: 30,                // rolling frame history length

  // Heart
  heartIndexDistance: 0.08,      // max dist between left[8] and right[8]
  heartThumbDistance: 0.10,      // max dist between left[4] and right[4]

  // Angry — horizontal head shake
  angryNoiseDelta: 0.008,        // min nose-x delta to register as movement
  angryReversals: 4,             // min direction reversals required
  angryMinRange: 0.06,           // min total x range in the window
  angryWindowMs: 1000,           // detection window in ms

  // Scared — sudden backward lean detected via face width shrinkage
  // When leaning back, face appears smaller → inter-cheek distance drops
  scaredFaceWidthDrop: 0.035,    // min drop in face[234]↔face[454] distance
  scaredWindowMs: 500,           // max ms window the drop must occur within
  scaredMinFrames: 15,           // min face frames needed in buffer

  // Peace — no extra thresholds needed; uses holdFramesRequired like other static poses
}
