/**
 * gestureClassifier.js
 *
 * Classifies MediaPipe Holistic results into one of 7 emote gestures using a
 * shared 30-frame rolling buffer. All coordinates are normalised [0,1].
 *
 * Exports:
 *   classifyGesture({ frameBuffer, holdCounters, lastEmoteFiredAt }) → result
 *   detectCelebrate / detectHeart / detectThumbsUp / detectThumbsDown / detectLasers — for unit tests
 *   detectAngry / detectScared / detectWave — for unit tests
 */

import { THRESHOLDS } from './constants.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Euclidean distance between two normalised landmarks {x, y}. */
function dist2D(a, b) {
  if (!a || !b) return Infinity
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

/**
 * Checks if the fingers (index, middle, ring, pinky) on a hand are curled into a fist.
 * Supports both vertical checks (for upright/inverted hands) and rotation-invariant
 * 2D distance ratios (for hands tilted sideways or beside the face).
 */
function isFingersCurled(hand) {
  if (!hand) return false
  const handSize = dist2D(hand[0], hand[9])
  const fingers = [
    { tip: 8, mcp: 5 },
    { tip: 12, mcp: 9 },
    { tip: 16, mcp: 13 },
    { tip: 20, mcp: 17 }
  ]
  for (const f of fingers) {
    const verticalCurl = hand[f.tip].y > hand[f.mcp].y
    const distanceCurl = dist2D(hand[f.tip], hand[f.mcp]) < handSize * 0.7
    if (!verticalCurl && !distanceCurl) {
      return false
    }
  }
  return true
}

/**
 * Count oscillation reversals in a 1-D position history within a time window.
 * @param {number[]} xs       - x values, chronological
 * @param {number[]} ts       - timestamps matching xs
 * @param {number}   noiseDelta - min delta to register as movement
 * @param {number}   windowMs  - time window to evaluate (ms)
 * @returns {{ reversals: number, range: number }}
 */
function countOscillationReversals(xs, ts, noiseDelta, windowMs) {
  const now = ts[ts.length - 1]
  // Keep only frames inside the window
  const pairs = xs.map((x, i) => ({ x, t: ts[i] })).filter(f => now - f.t <= windowMs)
  if (pairs.length < 4) return { reversals: 0, range: 0 }

  let direction = null
  let reversals = 0
  for (let i = 1; i < pairs.length; i++) {
    const delta = pairs[i].x - pairs[i - 1].x
    if (delta > noiseDelta) {
      if (direction === 'LEFT') reversals++
      direction = 'RIGHT'
    } else if (delta < -noiseDelta) {
      if (direction === 'RIGHT') reversals++
      direction = 'LEFT'
    }
  }

  const allX = pairs.map(f => f.x)
  const range = Math.max(...allX) - Math.min(...allX)
  return { reversals, range }
}

// ─── Static pose detectors (hold-based) ──────────────────────────────────────

/**
 * Celebrate 🎉
 * Both wrists raised above shoulder level AND at least one hand forming a fist.
 * Hold-based: must persist for holdFramesRequired consecutive frames to fire.
 * @param {object}        frame         - current buffer frame
 * @param {object}        holdCounters  - mutable counter object
 */
export function detectCelebrate(frame, holdCounters) {
  const pose = frame.pose
  let passed = false

  if (
    pose &&
    pose[11] &&
    pose[12] &&
    pose[15] &&
    pose[16]
  ) {
    const leftShoulderY  = pose[11].y
    const rightShoulderY = pose[12].y
    const leftWristY     = pose[15].y
    const rightWristY    = pose[16].y

    const wristsRaised = leftWristY < leftShoulderY - 0.12 && rightWristY < rightShoulderY - 0.12

    if (wristsRaised) {
      // At least one visible hand must be making a fist (curled fingers)
      if (isFingersCurled(frame.leftHand) || isFingersCurled(frame.rightHand)) {
        passed = true
      }
    }
  }

  const newCount = passed ? holdCounters.celebrateHoldFrames + 1 : 0
  const fired    = newCount >= THRESHOLDS.holdFramesRequired
  return {
    detected: fired,
    updatedCounters: { ...holdCounters, celebrateHoldFrames: fired ? 0 : newCount },
  }
}

/**
 * Emote 1 — Heart ❤️
 * Both index fingertips close + arch shape + centred.
 * @param {object} frame         - current buffer frame
 * @param {object} holdCounters  - mutable counter object
 */
export function detectHeart(frame, holdCounters) {
  const lh = frame.leftHand
  const rh = frame.rightHand
  let passed = false

  if (lh && rh) {
    const indexDist = dist2D(lh[8], rh[8])
    const thumbDist  = dist2D(lh[4], rh[4])

    if (
      indexDist < THRESHOLDS.heartIndexDistance &&
      thumbDist  < THRESHOLDS.heartThumbDistance
    ) {
      // Index tips above thumb tips (arch shape)
      if (lh[8].y < lh[4].y && rh[8].y < rh[4].y) {
        const midX = (lh[8].x + rh[8].x) / 2
        const midY = (lh[8].y + rh[8].y) / 2
        if (midX >= 0.3 && midX <= 0.7 && midY >= 0.2 && midY <= 0.8) {
          passed = true
        }
      }
    }
  }

  const newCount = passed ? holdCounters.heartHoldFrames + 1 : 0
  const fired    = newCount >= THRESHOLDS.holdFramesRequired
  return {
    detected: fired,
    updatedCounters: { ...holdCounters, heartHoldFrames: fired ? 0 : newCount },
  }
}

/**
 * Emote 2 — Thumbs Up 👍
 * One hand: thumb pointing up, all other fingers curled.
 */
export function detectThumbsUp(frame, holdCounters) {
  const hands = [frame.leftHand, frame.rightHand]
  const pose = frame.pose
  let passed = false

  // Guard against Celebrate: do not detect thumbs-up if BOTH wrists are raised near/above shoulder level
  if (pose && pose[11] && pose[12] && pose[15] && pose[16]) {
    const leftWristY     = pose[15].y
    const rightWristY    = pose[16].y
    const leftShoulderY  = pose[11].y
    const rightShoulderY = pose[12].y
    if (leftWristY < leftShoulderY + 0.1 && rightWristY < rightShoulderY + 0.1) {
      const newCount = 0
      return {
        detected: false,
        updatedCounters: { ...holdCounters, thumbsUpHoldFrames: newCount },
      }
    }
  }

  for (const hand of hands) {
    if (!hand) continue

    // Thumb extended upward
    if (
      hand[4].y < hand[3].y &&
      hand[3].y < hand[2].y &&
      hand[4].y < hand[0].y
    ) {
      // All fingers curled (fist)
      if (isFingersCurled(hand)) {
        passed = true
        break
      }
    }
  }

  const newCount = passed ? holdCounters.thumbsUpHoldFrames + 1 : 0
  const fired    = newCount >= THRESHOLDS.holdFramesRequired
  return {
    detected: fired,
    updatedCounters: { ...holdCounters, thumbsUpHoldFrames: fired ? 0 : newCount },
  }
}

/**
 * Emote 3 — Thumbs Down 👎
 * One hand: thumb pointing down, all other fingers curled.
 * Guard: if BOTH hands have thumbs pointing down, skip — that's a heart (🫶), not a thumbs-down.
 */
export function detectThumbsDown(frame, holdCounters) {
  const lh = frame.leftHand
  const rh = frame.rightHand
  let passed = false

  // Guard: when both hands are visible and both thumbs point down,
  // the user is most likely forming a heart shape (🫶), not giving thumbs-down.
  function thumbDown(hand) {
    return hand && hand[4].y > hand[3].y && hand[3].y > hand[2].y
  }
  if (lh && rh && thumbDown(lh) && thumbDown(rh)) {
    // Both thumbs down → likely heart pose, reject
    const newCount = 0
    return {
      detected: false,
      updatedCounters: { ...holdCounters, thumbsDownHoldFrames: newCount },
    }
  }

  const hands = [lh, rh]
  for (const hand of hands) {
    if (!hand) continue
    // Thumb extended downward: tip → IP → MCP all have increasing y (downward in frame).
    // Also requires all other fingers to be curled (fist).
    if (
      hand[4].y > hand[3].y &&
      hand[3].y > hand[2].y
    ) {
      if (isFingersCurled(hand)) {
        passed = true
        break
      }
    }
  }

  const newCount = passed ? holdCounters.thumbsDownHoldFrames + 1 : 0
  const fired    = newCount >= THRESHOLDS.holdFramesRequired
  return {
    detected: fired,
    updatedCounters: { ...holdCounters, thumbsDownHoldFrames: fired ? 0 : newCount },
  }
}

/**
 * Emote 6 — Lasers 🤘
 * One hand: index + pinky extended, middle + ring curled. Thumb ignored.
 */
export function detectLasers(frame, holdCounters) {
  const hands = [frame.leftHand, frame.rightHand]
  let passed = false

  for (const hand of hands) {
    if (!hand) continue
    // Index extended (tip and PIP both above MCP)
    if (hand[8].y < hand[5].y && hand[7].y < hand[5].y) {
      // Pinky extended (tip and PIP both above MCP)
      if (hand[20].y < hand[17].y && hand[19].y < hand[17].y) {
        // Middle and ring curled
        if (hand[12].y > hand[9].y && hand[16].y > hand[13].y) {
          passed = true
          break
        }
      }
    }
  }

  const newCount = passed ? holdCounters.rockOnHoldFrames + 1 : 0
  const fired    = newCount >= THRESHOLDS.holdFramesRequired
  return {
    detected: fired,
    updatedCounters: { ...holdCounters, rockOnHoldFrames: fired ? 0 : newCount },
  }
}

// ─── Motion-based detectors (buffer-based) ───────────────────────────────────

/**
 * Emote 4 — Angry 😡
 * Rapid horizontal head shake: ≥4 direction reversals within 1000ms.
 */
export function detectAngry(frameBuffer) {
  const faceFrames = frameBuffer.filter(f => f.face && f.face[1])
  if (faceFrames.length < 20) return false

  const xs = faceFrames.map(f => f.face[1].x)
  const ts = faceFrames.map(f => f.timestamp)

  const { reversals, range } = countOscillationReversals(
    xs, ts, THRESHOLDS.angryNoiseDelta, THRESHOLDS.angryWindowMs
  )
  return reversals >= THRESHOLDS.angryReversals && range > THRESHOLDS.angryMinRange
}

/**
 * Emote 5 — Scared 😱
 * Sudden backward lean: inter-cheek face width (landmarks 234↔454) shrinks
 * rapidly due to perspective foreshortening when the person moves away from camera.
 * Face landmarks are far more reliable than pose shoulder spread for this purpose.
 */
export function detectScared(frameBuffer) {
  const faceFrames = frameBuffer.filter(f => f.face && f.face[234] && f.face[454])
  if (faceFrames.length < THRESHOLDS.scaredMinFrames) return false

  const data = faceFrames.map(f => ({
    width: dist2D(f.face[234], f.face[454]),
    t:     f.timestamp,
  }))

  // Baseline: mean inter-cheek width of oldest 10 frames
  const baselineData  = data.slice(0, 10)
  const baselineWidth = baselineData.reduce((s, d) => s + d.width, 0) / baselineData.length

  // Current: minimum width in most recent 6 frames
  const recentData     = data.slice(-6)
  const now            = recentData[recentData.length - 1].t
  const oldestRecent   = recentData[0].t

  // The drop must occur within scaredWindowMs (ensures it was sudden, not gradual)
  if (now - oldestRecent > THRESHOLDS.scaredWindowMs) return false

  const currentMinWidth = Math.min(...recentData.map(d => d.width))

  // Fire if the face visibly shrank (person leaned back sharply)
  return baselineWidth - currentMinWidth > THRESHOLDS.scaredFaceWidthDrop
}

/**
 * Emote 7 — Peace ✌️
 * One hand: index + middle fingers extended (tip AND PIP above MCP),
 * ring + pinky curled (tip below MCP). Thumb ignored.
 * Mutually exclusive from Lasers (which needs middle CURLED).
 */
export function detectPeace(frame, holdCounters) {
  const hands = [frame.leftHand, frame.rightHand]
  let passed = false

  for (const hand of hands) {
    if (!hand) continue
    // Index extended (tip and PIP both above MCP)
    if (hand[8].y < hand[5].y && hand[7].y < hand[5].y) {
      // Middle extended (tip and PIP both above MCP)
      if (hand[12].y < hand[9].y && hand[11].y < hand[9].y) {
        // Ring curled (tip below MCP)
        if (hand[16].y > hand[13].y) {
          // Pinky curled (tip below MCP)
          if (hand[20].y > hand[17].y) {
            passed = true
            break
          }
        }
      }
    }
  }

  const newCount = passed ? holdCounters.peaceHoldFrames + 1 : 0
  const fired    = newCount >= THRESHOLDS.holdFramesRequired
  return {
    detected: fired,
    updatedCounters: { ...holdCounters, peaceHoldFrames: fired ? 0 : newCount },
  }
}

// ─── Master classifier ────────────────────────────────────────────────────────

/**
 * @param {object[]} frameBuffer        - rolling 30-frame history
 * @param {object}   holdCounters       - { heartHoldFrames, thumbsUpHoldFrames, ... }
 * @param {number}   lastEmoteFiredAt   - timestamp of last fired emote
 * @returns {{ gesture, confidence, updatedHoldCounters, updatedLastEmoteFiredAt }}
 */
export function classifyGesture({ frameBuffer, holdCounters, lastEmoteFiredAt }) {
  const now = Date.now()

  // Global cooldown — reset hold counters to prevent instant re-fire
  if (now - lastEmoteFiredAt < THRESHOLDS.globalCooldown) {
    return {
      gesture: 'none',
      confidence: 0,
      updatedHoldCounters: {
        celebrateHoldFrames: 0,
        heartHoldFrames:     0,
        thumbsUpHoldFrames:  0,
        thumbsDownHoldFrames: 0,
        rockOnHoldFrames:    0,
        peaceHoldFrames:     0,
      },
      updatedLastEmoteFiredAt: lastEmoteFiredAt,
    }
  }

  if (!frameBuffer || frameBuffer.length === 0) {
    return { gesture: 'none', confidence: 0, updatedHoldCounters: holdCounters, updatedLastEmoteFiredAt: lastEmoteFiredAt }
  }

  const currentFrame    = frameBuffer[frameBuffer.length - 1]
  let   updatedCounters = { ...holdCounters }

  // ── Priority 1: Heart ──────────────────────────────────────────────────────
  const heartResult = detectHeart(currentFrame, updatedCounters)
  updatedCounters   = heartResult.updatedCounters
  if (heartResult.detected) {
    return { gesture: 'heart', confidence: 95, updatedHoldCounters: updatedCounters, updatedLastEmoteFiredAt: now }
  }

  // ── Priority 2: Celebrate ──────────────────────────────────────────────────
  const celebrateResult = detectCelebrate(currentFrame, updatedCounters)
  updatedCounters       = celebrateResult.updatedCounters
  if (celebrateResult.detected) {
    return { gesture: 'celebrate', confidence: 95, updatedHoldCounters: updatedCounters, updatedLastEmoteFiredAt: now }
  }

  // ── Priority 3: Scared ─────────────────────────────────────────────────────
  if (detectScared(frameBuffer)) {
    return { gesture: 'scared', confidence: 90, updatedHoldCounters: updatedCounters, updatedLastEmoteFiredAt: now }
  }

  // ── Priority 3: Angry ──────────────────────────────────────────────────────
  if (detectAngry(frameBuffer)) {
    return { gesture: 'angry', confidence: 88, updatedHoldCounters: updatedCounters, updatedLastEmoteFiredAt: now }
  }

  // ── Priority 4: Thumbs Up ──────────────────────────────────────────────────
  const thumbsUpResult = detectThumbsUp(currentFrame, updatedCounters)
  updatedCounters      = thumbsUpResult.updatedCounters
  if (thumbsUpResult.detected) {
    return { gesture: 'thumbsup', confidence: 92, updatedHoldCounters: updatedCounters, updatedLastEmoteFiredAt: now }
  }

  // ── Priority 5: Thumbs Down ────────────────────────────────────────────────
  const thumbsDownResult = detectThumbsDown(currentFrame, updatedCounters)
  updatedCounters        = thumbsDownResult.updatedCounters
  if (thumbsDownResult.detected) {
    return { gesture: 'thumbsdown', confidence: 92, updatedHoldCounters: updatedCounters, updatedLastEmoteFiredAt: now }
  }

  // ── Priority 6: Lasers ─────────────────────────────────────────────────────
  const lasersResult = detectLasers(currentFrame, updatedCounters)
  updatedCounters    = lasersResult.updatedCounters
  if (lasersResult.detected) {
    return { gesture: 'lasers', confidence: 90, updatedHoldCounters: updatedCounters, updatedLastEmoteFiredAt: now }
  }

  // ── Priority 7: Peace ──────────────────────────────────────────────────────────
  const peaceResult = detectPeace(currentFrame, updatedCounters)
  updatedCounters   = peaceResult.updatedCounters
  if (peaceResult.detected) {
    return { gesture: 'peace', confidence: 90, updatedHoldCounters: updatedCounters, updatedLastEmoteFiredAt: now }
  }

  return { gesture: 'none', confidence: 0, updatedHoldCounters: updatedCounters, updatedLastEmoteFiredAt: lastEmoteFiredAt }
}
