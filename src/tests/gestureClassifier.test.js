import { describe, it, expect, beforeEach } from 'vitest'
import {
  detectCelebrate,
  detectHeart,
  detectThumbsUp,
  detectThumbsDown,
  detectLasers,
  detectAngry,
  detectScared,
  detectPeace,
  classifyGesture,
} from '../utils/gestureClassifier.js'

// ─── Frame / landmark helpers ─────────────────────────────────────────────────

/** Create a minimal landmark with x, y (and optional z, visibility). */
const lm = (x, y, z = 0, visibility = 1) => ({ x, y, z, visibility })

/**
 * Build a minimal hand landmark array with 21 entries.
 * Only overrides listed indices; all others default to {x:0.5, y:0.5}.
 */
function makeHand(overrides = {}) {
  return Array.from({ length: 21 }, (_, i) =>
    overrides[i] !== undefined ? overrides[i] : lm(0.5, 0.5)
  )
}

/** Default hold counter object (all zeros). */
function zeroCounters() {
  return { celebrateHoldFrames: 0, heartHoldFrames: 0, thumbsUpHoldFrames: 0, thumbsDownHoldFrames: 0, rockOnHoldFrames: 0, peaceHoldFrames: 0 }
}

// ─── detectCelebrate ──────────────────────────────────────────────────────────

describe('detectCelebrate', () => {
  // Shared: both wrists raised well above shoulders
  function raisedPose() {
    const pose = Array.from({ length: 33 }, () => lm(0.5, 0.5))
    pose[11] = lm(0.3, 0.5)  // left shoulder
    pose[12] = lm(0.7, 0.5)  // right shoulder
    pose[15] = lm(0.2, 0.3)  // left wrist — 0.2 above shoulder threshold ✓
    pose[16] = lm(0.8, 0.3)  // right wrist — 0.2 above shoulder threshold ✓
    return pose
  }

  // A fist hand: all fingertips below their MCP knuckles
  function fistHand() {
    return makeHand({
      5: lm(0.5, 0.4), 8:  lm(0.5, 0.6),
      9: lm(0.5, 0.4), 12: lm(0.5, 0.6),
      13: lm(0.5, 0.4), 16: lm(0.5, 0.6),
      17: lm(0.5, 0.4), 20: lm(0.5, 0.6),
    })
  }

  // An open hand: index tip above MCP (finger extended) — as in heart pose
  function openHand() {
    return makeHand({
      5: lm(0.5, 0.5), 8: lm(0.5, 0.2),
    })
  }

  it('returns detected:false when pose is missing', () => {
    const r1 = detectCelebrate({ pose: null, leftHand: null, rightHand: null }, zeroCounters())
    expect(r1.detected).toBe(false)
  })

  it('increments counter when conditions pass, fires after 8 frames', () => {
    const frame = { pose: raisedPose(), leftHand: fistHand(), rightHand: null }
    let counters = zeroCounters()
    let result
    for (let i = 0; i < 8; i++) {
      result = detectCelebrate(frame, counters)
      counters = result.updatedCounters
    }
    expect(result.detected).toBe(true)
    expect(result.updatedCounters.celebrateHoldFrames).toBe(0)
  })

  it('does not fire with open hands (heart pose)', () => {
    const frame = { pose: raisedPose(), leftHand: openHand(), rightHand: openHand() }
    let counters = zeroCounters()
    let result
    for (let i = 0; i < 8; i++) {
      result = detectCelebrate(frame, counters)
      counters = result.updatedCounters
    }
    expect(result.detected).toBe(false)
  })

  it('resets counter when conditions fail mid-hold', () => {
    const goodFrame = { pose: raisedPose(), leftHand: fistHand(), rightHand: null }
    const badFrame  = { pose: raisedPose(), leftHand: openHand(), rightHand: null }
    let counters = zeroCounters()
    for (let i = 0; i < 5; i++) {
      counters = detectCelebrate(goodFrame, counters).updatedCounters
    }
    expect(counters.celebrateHoldFrames).toBe(5)
    const r = detectCelebrate(badFrame, counters)
    expect(r.updatedCounters.celebrateHoldFrames).toBe(0)
    expect(r.detected).toBe(false)
  })
})




// ─── detectHeart ──────────────────────────────────────────────────────────────

describe('detectHeart', () => {
  it('returns false when no hands present', () => {
    const frame = { leftHand: null, rightHand: null }
    const { detected } = detectHeart(frame, zeroCounters())
    expect(detected).toBe(false)
  })

  it('increments counter when conditions pass', () => {
    // index tips ~0.04 apart (< 0.08), thumb tips ~0.06 apart (< 0.10)
    // index tips have lower y than thumb tips → arch shape
    // midpoint x ≈ 0.50, midpoint y ≈ 0.40 → centred
    const lh = makeHand({
      4: lm(0.47, 0.50), // left thumb tip
      8: lm(0.48, 0.38), // left index tip — y < thumb y → above thumb
    })
    const rh = makeHand({
      4: lm(0.53, 0.50), // right thumb tip
      8: lm(0.52, 0.38), // right index tip
    })
    // index dist  = sqrt((0.48-0.52)²+(0.38-0.38)²) = 0.04  < 0.08 ✓
    // thumb dist  = sqrt((0.47-0.53)²+(0.50-0.50)²) = 0.06  < 0.10 ✓
    // midX = 0.50, midY = 0.38 → both in [0.3,0.7] and [0.2,0.8] ✓
    const frame = { leftHand: lh, rightHand: rh }
    const { detected, updatedCounters } = detectHeart(frame, zeroCounters())
    expect(detected).toBe(false)          // hasn't fired yet (need 20 frames)
    expect(updatedCounters.heartHoldFrames).toBe(1)
  })

  it('fires after 8 consecutive passing frames', () => {
    const lh = makeHand({ 4: lm(0.47, 0.50), 8: lm(0.48, 0.38) })
    const rh = makeHand({ 4: lm(0.53, 0.50), 8: lm(0.52, 0.38) })
    const frame = { leftHand: lh, rightHand: rh }

    let counters = zeroCounters()
    let result
    for (let i = 0; i < 8; i++) {
      result = detectHeart(frame, counters)
      counters = result.updatedCounters
    }
    expect(result.detected).toBe(true)
    // Counter resets to 0 after firing
    expect(result.updatedCounters.heartHoldFrames).toBe(0)
  })

  it('resets counter when conditions fail', () => {
    const lh = makeHand({ 4: lm(0.47, 0.50), 8: lm(0.48, 0.38) })
    const rh = makeHand({ 4: lm(0.53, 0.50), 8: lm(0.52, 0.38) })
    const goodFrame = { leftHand: lh, rightHand: rh }
    const badFrame  = { leftHand: null, rightHand: null }

    let counters = zeroCounters()
    // Build up 5 frames
    for (let i = 0; i < 5; i++) {
      const r = detectHeart(goodFrame, counters)
      counters = r.updatedCounters
    }
    expect(counters.heartHoldFrames).toBe(5)

    // One bad frame resets
    const r = detectHeart(badFrame, counters)
    expect(r.updatedCounters.heartHoldFrames).toBe(0)
    expect(r.detected).toBe(false)
  })
})

// ─── detectThumbsUp ───────────────────────────────────────────────────────────

describe('detectThumbsUp', () => {
  function makeThumbsUpHand() {
    // thumb tip (4) above IP (3) above MCP (2) above wrist (0)
    // all finger tips below their MCPs
    return makeHand({
      0:  lm(0.5, 0.8),  // wrist
      2:  lm(0.5, 0.6),  // thumb MCP
      3:  lm(0.5, 0.5),  // thumb IP
      4:  lm(0.5, 0.3),  // thumb tip — highest
      5:  lm(0.5, 0.4),  // index MCP
      8:  lm(0.5, 0.6),  // index tip below MCP  ✓
      9:  lm(0.5, 0.4),  // middle MCP
      12: lm(0.5, 0.6),  // middle tip below MCP ✓
      13: lm(0.5, 0.4),  // ring MCP
      16: lm(0.5, 0.6),  // ring tip below MCP   ✓
      17: lm(0.5, 0.4),  // pinky MCP
      20: lm(0.5, 0.6),  // pinky tip below MCP  ✓
    })
  }

  it('fires after 8 frames with a valid thumbs-up', () => {
    const hand  = makeThumbsUpHand()
    const frame = { leftHand: hand, rightHand: null }
    let counters = zeroCounters()
    let result
    for (let i = 0; i < 8; i++) {
      result = detectThumbsUp(frame, counters)
      counters = result.updatedCounters
    }
    expect(result.detected).toBe(true)
  })

  it('does not fire when fingers are not curled', () => {
    // Fingers spread open — tips above MCPs
    const hand = makeHand({
      0:  lm(0.5, 0.8),
      2:  lm(0.5, 0.6),
      3:  lm(0.5, 0.5),
      4:  lm(0.5, 0.3),  // thumb up
      5:  lm(0.5, 0.5),
      8:  lm(0.5, 0.2),  // index tip ABOVE MCP — not curled
    })
    const frame = { leftHand: hand, rightHand: null }
    const { detected } = detectThumbsUp(frame, zeroCounters())
    expect(detected).toBe(false)
  })
  it('does not fire when BOTH hands are raised near/above shoulder level (Celebrate pose)', () => {
    const hand = makeThumbsUpHand()
    const frame = {
      leftHand: hand,
      rightHand: null,
      pose: {
        11: lm(0.5, 0.4),  // left shoulder
        12: lm(0.5, 0.4),  // right shoulder
        15: lm(0.5, 0.3),  // left wrist (above shoulder)
        16: lm(0.5, 0.3),  // right wrist (above shoulder)
      }
    }
    const { detected } = detectThumbsUp(frame, zeroCounters())
    expect(detected).toBe(false)
  })

  it('fires when only ONE hand is raised high (e.g. thumbs up beside face)', () => {
    const hand = makeThumbsUpHand()
    const frame = {
      leftHand: hand,
      rightHand: null,
      pose: {
        11: lm(0.5, 0.4),  // left shoulder
        12: lm(0.5, 0.4),  // right shoulder
        15: lm(0.5, 0.3),  // left wrist (above shoulder)
        16: lm(0.5, 0.6),  // right wrist (below shoulder)
      }
    }
    let counters = zeroCounters()
    let result
    for (let i = 0; i < 8; i++) {
      result = detectThumbsUp(frame, counters)
      counters = result.updatedCounters
    }
    expect(result.detected).toBe(true)
  })
})

// ─── detectThumbsDown ────────────────────────────────────────────────────────

describe('detectThumbsDown', () => {
  function makeThumbsDownHand() {
    return makeHand({
      0:  lm(0.5, 0.2),  // wrist (high in frame)
      2:  lm(0.5, 0.3),  // thumb MCP
      3:  lm(0.5, 0.5),  // thumb IP
      4:  lm(0.5, 0.7),  // thumb tip — pointing down (highest y)
      5:  lm(0.5, 0.4),
      8:  lm(0.5, 0.6),  // index curled
      9:  lm(0.5, 0.4),
      12: lm(0.5, 0.6),  // middle curled
      13: lm(0.5, 0.4),
      16: lm(0.5, 0.6),  // ring curled
      17: lm(0.5, 0.4),
      20: lm(0.5, 0.6),  // pinky curled
    })
  }

  it('fires after 8 frames with a valid thumbs-down', () => {
    const frame = { leftHand: makeThumbsDownHand(), rightHand: null }
    let counters = zeroCounters()
    let result
    for (let i = 0; i < 8; i++) {
      result = detectThumbsDown(frame, counters)
      counters = result.updatedCounters
    }
    expect(result.detected).toBe(true)
  })

  it('is mutually exclusive with thumbs-up (thumb direction differs)', () => {
    // A thumbs-up hand cannot pass the thumbs-down condition simultaneously
    const thumbsUpHand = makeHand({
      0: lm(0.5, 0.8), 2: lm(0.5, 0.6), 3: lm(0.5, 0.5), 4: lm(0.5, 0.3),
      5: lm(0.5, 0.4), 8: lm(0.5, 0.6), 9: lm(0.5, 0.4), 12: lm(0.5, 0.6),
      13: lm(0.5, 0.4), 16: lm(0.5, 0.6), 17: lm(0.5, 0.4), 20: lm(0.5, 0.6),
    })
    const frame = { leftHand: thumbsUpHand, rightHand: null }
    const { detected } = detectThumbsDown(frame, zeroCounters())
    expect(detected).toBe(false)
  })

  it('does not fire when fingers are not curled', () => {
    // Thumb points down, but index finger is extended
    const hand = makeHand({
      0: lm(0.5, 0.2),  // wrist (high in frame)
      2: lm(0.5, 0.3),  // thumb MCP
      3: lm(0.5, 0.5),  // thumb IP
      4: lm(0.5, 0.7),  // thumb tip — pointing down
      5: lm(0.5, 0.4),
      8: lm(0.5, 0.2),  // index tip ABOVE MCP (pointing up/not curled)
    })
    const frame = { leftHand: hand, rightHand: null }
    const { detected } = detectThumbsDown(frame, zeroCounters())
    expect(detected).toBe(false)
  })

  it('fires when the arm is raised high (wrist is below the hand)', () => {
    // High-arm thumbs down: wrist at bottom (large y), thumb points down, other fingers curled
    const raisedHand = makeHand({
      0:  lm(0.5, 0.8),  // wrist (low in frame, bottom of hand)
      2:  lm(0.5, 0.4),  // thumb MCP
      3:  lm(0.5, 0.5),  // thumb IP
      4:  lm(0.5, 0.6),  // thumb tip — pointing down (higher y than MCP/IP but lower than wrist)
      5:  lm(0.5, 0.3),  // index MCP
      8:  lm(0.5, 0.4),  // index tip (below MCP)
      9:  lm(0.5, 0.3),  // middle MCP
      12: lm(0.5, 0.4),  // middle tip (below MCP)
      13: lm(0.5, 0.3),  // ring MCP
      16: lm(0.5, 0.4),  // ring tip (below MCP)
      17: lm(0.5, 0.3),  // pinky MCP
      20: lm(0.5, 0.4),  // pinky tip (below MCP)
    })
    const frame = { leftHand: raisedHand, rightHand: null }
    let counters = zeroCounters()
    let result
    for (let i = 0; i < 8; i++) {
      result = detectThumbsDown(frame, counters)
      counters = result.updatedCounters
    }
    expect(result.detected).toBe(true)
  })

  it('fires when the hand is tilted sideways (fingers curl horizontally)', () => {
    // 90-degree rotated thumbs down: wrist on the right, knuckles on the left.
    // Thumb points straight down, other fingers curl horizontally (same y-level as knuckles).
    const tiltedHand = makeHand({
      0:  lm(0.8, 0.5),  // wrist (on the right)
      2:  lm(0.6, 0.4),  // thumb MCP
      3:  lm(0.6, 0.5),  // thumb IP
      4:  lm(0.6, 0.6),  // thumb tip — pointing down (vertical y progression)
      5:  lm(0.6, 0.5),  // index MCP
      8:  lm(0.7, 0.5),  // index tip (curled horizontally, same y-level as knuckle)
      9:  lm(0.6, 0.5),  // middle MCP
      12: lm(0.7, 0.5),  // middle tip (curled horizontally)
      13: lm(0.6, 0.5),  // ring MCP
      16: lm(0.7, 0.5),  // ring tip (curled horizontally)
      17: lm(0.6, 0.5),  // pinky MCP
      20: lm(0.7, 0.5),  // pinky tip (curled horizontally)
    })
    const frame = { leftHand: tiltedHand, rightHand: null }
    let counters = zeroCounters()
    let result
    for (let i = 0; i < 8; i++) {
      result = detectThumbsDown(frame, counters)
      counters = result.updatedCounters
    }
    expect(result.detected).toBe(true)
  })

  it('does not fire when BOTH hands have thumbs down (heart 🫶 pose)', () => {
    const frame = { leftHand: makeThumbsDownHand(), rightHand: makeThumbsDownHand() }
    let counters = zeroCounters()
    let result
    for (let i = 0; i < 8; i++) {
      result = detectThumbsDown(frame, counters)
      counters = result.updatedCounters
    }
    expect(result.detected).toBe(false)
    expect(result.updatedCounters.thumbsDownHoldFrames).toBe(0)
  })
})

// ─── detectLasers ─────────────────────────────────────────────────────────────

describe('detectLasers', () => {
  function makeRockOnHand() {
    return makeHand({
      // Index extended: 8 < 5, 7 < 5
      5:  lm(0.5, 0.5), 7: lm(0.5, 0.3), 8: lm(0.5, 0.2),
      // Pinky extended: 20 < 17, 19 < 17
      17: lm(0.5, 0.5), 19: lm(0.5, 0.3), 20: lm(0.5, 0.2),
      // Middle curled: 12 > 9
      9:  lm(0.5, 0.4), 12: lm(0.5, 0.6),
      // Ring curled: 16 > 13
      13: lm(0.5, 0.4), 16: lm(0.5, 0.6),
    })
  }

  it('fires after 8 frames of rock-on pose', () => {
    const frame = { leftHand: makeRockOnHand(), rightHand: null }
    let counters = zeroCounters()
    let result
    for (let i = 0; i < 8; i++) {
      result = detectLasers(frame, counters)
      counters = result.updatedCounters
    }
    expect(result.detected).toBe(true)
  })
})

// ─── detectScared ────────────────────────────────────────────────────────────

describe('detectScared', () => {
  const now = Date.now()

  function makeFace(cheekWidth) {
    // 468 landmarks; set 234 (left cheek) and 454 (right cheek) to produce the given width
    const face = Array.from({ length: 468 }, () => lm(0.5, 0.5))
    face[234] = lm(0.5 - cheekWidth / 2, 0.5)
    face[454] = lm(0.5 + cheekWidth / 2, 0.5)
    return face
  }

  it('returns false with fewer than 15 face frames', () => {
    const buf = [{ timestamp: now, face: makeFace(0.3), pose: null, leftHand: null, rightHand: null }]
    expect(detectScared(buf)).toBe(false)
  })

  it('detects a sudden face-width shrinkage (backward lean)', () => {
    // Baseline: 15 frames with face width 0.30
    // Recent 6 frames: face width drops to 0.20 (drop = 0.10 > 0.035 threshold)
    const frames = []
    // 15 baseline frames spaced 35ms apart, oldest first
    for (let i = 0; i < 15; i++) {
      frames.push({
        timestamp: now - 800 + i * 35,
        face: makeFace(0.30),
        pose: null, leftHand: null, rightHand: null,
      })
    }
    // 6 recent frames (within 500ms window) showing narrower face
    for (let i = 0; i < 6; i++) {
      frames.push({
        timestamp: now - 200 + i * 30,
        face: makeFace(0.20),
        pose: null, leftHand: null, rightHand: null,
      })
    }
    expect(detectScared(frames)).toBe(true)
  })

  it('does not fire on gradual width changes (slow lean)', () => {
    // Width slowly decreases from 0.30 to 0.26 over 30 frames — not sudden enough
    const frames = Array.from({ length: 30 }, (_, i) => ({
      timestamp: now - (30 - i) * 35,
      face: makeFace(0.30 - i * 0.0013), // ~0.04 total over 1s
      pose: null, leftHand: null, rightHand: null,
    }))
    // baseline avg ≈ 0.285, recent min ≈ 0.26, drop ≈ 0.025 < 0.035 → no fire
    expect(detectScared(frames)).toBe(false)
  })
})

// ─── detectAngry ─────────────────────────────────────────────────────────────

describe('detectAngry', () => {
  const now = Date.now()

  /**
   * Build a frameBuffer with an oscillating nose x pattern.
   * @param {number} cycles - number of full L-R cycles (each cycle = 4 data points)
   */
  function makeAngryBuffer(cycles = 2) {
    const frames = []
    const points = []
    // Generate oscillation: 0.35 → 0.65 → 0.35 → 0.65 ...
    for (let c = 0; c < cycles; c++) {
      points.push(0.35, 0.65)
    }
    // Pad to 25 frames (fill with first value then oscillate)
    const padded = [
      ...Array(5).fill(0.35),  // 5 stable frames at start
      ...points.flatMap(x => [x, x + 0.01, x + 0.02]), // spread each point a bit
    ].slice(0, 25)

    padded.forEach((noseX, i) => {
      frames.push({
        timestamp: now - (padded.length - i) * 40, // ~25fps
        face: Array.from({ length: 468 }, (_, fi) => fi === 1 ? lm(noseX, 0.5) : lm(0.5, 0.5)),
        pose: null, leftHand: null, rightHand: null,
      })
    })
    return frames
  }

  it('returns false with fewer than 20 face frames', () => {
    const smallBuffer = [
      { timestamp: now, face: [null, lm(0.5, 0.5)], pose: null, leftHand: null, rightHand: null }
    ]
    expect(detectAngry(smallBuffer)).toBe(false)
  })

  it('detects a clear head shake oscillation', () => {
    // Construct a buffer with clear back-and-forth pattern
    const frames = []
    const pattern = [0.30, 0.30, 0.70, 0.70, 0.30, 0.30, 0.70, 0.70, 0.30, 0.30,
                     0.30, 0.70, 0.70, 0.30, 0.30, 0.70, 0.70, 0.30, 0.30, 0.70,
                     0.70, 0.30, 0.30, 0.70, 0.70, 0.30, 0.30, 0.70, 0.70, 0.30]
    pattern.forEach((noseX, i) => {
      frames.push({
        timestamp: now - (pattern.length - i) * 35,
        face: Array.from({ length: 468 }, (_, fi) => fi === 1 ? lm(noseX, 0.5) : lm(0.5, 0.5)),
        pose: null, leftHand: null, rightHand: null,
      })
    })
    expect(detectAngry(frames)).toBe(true)
  })

  it('returns false for slow drift with insufficient reversals', () => {
    // Slow monotonic drift — not a head shake
    const frames = Array.from({ length: 25 }, (_, i) => ({
      timestamp: now - (25 - i) * 40,
      face: Array.from({ length: 468 }, (_, fi) => fi === 1 ? lm(0.3 + i * 0.01, 0.5) : lm(0.5, 0.5)),
      pose: null, leftHand: null, rightHand: null,
    }))
    expect(detectAngry(frames)).toBe(false)
  })
})




// ─── classifyGesture priority ────────────────────────────────────────────────

describe('classifyGesture', () => {
  it('returns none on empty buffer', () => {
    const result = classifyGesture({ frameBuffer: [], holdCounters: zeroCounters(), lastEmoteFiredAt: 0 })
    expect(result.gesture).toBe('none')
  })

  it('respects global cooldown', () => {
    const recentFire = Date.now() - 400 // 400ms ago — inside 800ms cooldown
    const frame = {
      timestamp: Date.now(), pose: null, face: null, leftHand: null, rightHand: null
    }
    const result = classifyGesture({
      frameBuffer: [frame],
      holdCounters: zeroCounters(),
      lastEmoteFiredAt: recentFire,
    })
    expect(result.gesture).toBe('none')
  })

  it('resets hold counters during cooldown', () => {
    const recentFire = Date.now() - 100
    const counters = { heartHoldFrames: 15, thumbsUpHoldFrames: 10, thumbsDownHoldFrames: 5, rockOnHoldFrames: 8 }
    const frame = { timestamp: Date.now(), pose: null, face: null, leftHand: null, rightHand: null }
    const result = classifyGesture({ frameBuffer: [frame], holdCounters: counters, lastEmoteFiredAt: recentFire })
    expect(result.updatedHoldCounters.heartHoldFrames).toBe(0)
    expect(result.updatedHoldCounters.thumbsUpHoldFrames).toBe(0)
  })

  it('classifies celebrate after 8 frames of raised fists', () => {
    const pose = Array.from({ length: 33 }, () => lm(0.5, 0.5))
    pose[11] = lm(0.3, 0.5)
    pose[12] = lm(0.7, 0.5)
    pose[15] = lm(0.2, 0.3)
    pose[16] = lm(0.8, 0.3)
    const fist = makeHand({
      5: lm(0.5, 0.4), 8:  lm(0.5, 0.6),
      9: lm(0.5, 0.4), 12: lm(0.5, 0.6),
      13: lm(0.5, 0.4), 16: lm(0.5, 0.6),
      17: lm(0.5, 0.4), 20: lm(0.5, 0.6),
    })
    const frame = { timestamp: Date.now(), pose, face: null, leftHand: fist, rightHand: null }
    let counters = zeroCounters()
    let result
    for (let i = 0; i < 8; i++) {
      result = classifyGesture({ frameBuffer: [frame], holdCounters: counters, lastEmoteFiredAt: 0 })
      counters = result.updatedHoldCounters
    }
    expect(result.gesture).toBe('celebrate')
    expect(result.confidence).toBe(95)
  })
})
