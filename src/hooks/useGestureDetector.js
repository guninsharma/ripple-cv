import { useState, useEffect, useRef } from 'react'
import { classifyGesture } from '../utils/gestureClassifier.js'
import { THRESHOLDS } from '../utils/constants.js'

function dist2D(a, b) {
  if (!a || !b) return 0;
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * useGestureDetector
 *
 * Consumes raw MediaPipe Holistic results, maintains a rolling 30-frame buffer,
 * and returns the current detected gesture using the new classifier.
 */
export function useGestureDetector(results) {
  const [gestureState, setGestureState] = useState({
    gesture: 'none',
    confidence: 0,
    motionSpeed: 0,
    personDetected: false,
  })

  // Rolling frame buffer (30 frames)
  const frameBufferRef = useRef([])

  // Hold counters for static-pose gestures
  const holdCountersRef = useRef({
    celebrateHoldFrames:  0,
    heartHoldFrames:      0,
    thumbsUpHoldFrames:   0,
    thumbsDownHoldFrames: 0,
    rockOnHoldFrames:     0,
    peaceHoldFrames:      0,
  })

  // Timestamp of the last emote that fired (drives global cooldown)
  const lastEmoteFiredAtRef = useRef(0)

  useEffect(() => {
    if (!results) {
      setGestureState(prev => ({ ...prev, personDetected: false }))
      return
    }

    // Build new frame entry and push to rolling buffer
    const newFrame = {
      timestamp: Date.now(),
      pose:      results.poseLandmarks      || null,
      face:      results.faceLandmarks      || null,
      leftHand:  results.leftHandLandmarks  || null,
      rightHand: results.rightHandLandmarks || null,
    }

    const newBuffer = [...frameBufferRef.current, newFrame].slice(-THRESHOLDS.bufferSize)
    frameBufferRef.current = newBuffer

    // Run classification
    const result = classifyGesture({
      frameBuffer:       newBuffer,
      holdCounters:      holdCountersRef.current,
      lastEmoteFiredAt:  lastEmoteFiredAtRef.current,
    })

    // Persist updated state into refs
    holdCountersRef.current    = result.updatedHoldCounters
    lastEmoteFiredAtRef.current = result.updatedLastEmoteFiredAt

    // Compute current frame's motion speed
    let speed = 0;
    if (newBuffer.length >= 2) {
      const cur = newBuffer[newBuffer.length - 1].pose;
      const prev = newBuffer[newBuffer.length - 2].pose;
      if (cur && prev && cur[0] && prev[0] && cur[15] && prev[15] && cur[16] && prev[16]) {
        const dNose = dist2D(cur[0], prev[0]);
        const dLWrist = dist2D(cur[15], prev[15]);
        const dRWrist = dist2D(cur[16], prev[16]);
        speed = dNose + dLWrist + dRWrist;
      }
    }

    setGestureState({
      gesture:       result.gesture,
      confidence:    result.confidence,
      motionSpeed:   speed,
      personDetected: !!results.poseLandmarks,
    })
  }, [results])

  return {
    gesture:       gestureState.gesture,
    confidence:    gestureState.confidence,
    motionSpeed:   gestureState.motionSpeed,
    personDetected: gestureState.personDetected,
  }
}

export default useGestureDetector
