import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GESTURES } from '../utils/constants.js';

/** Number of emoji particles spawned per trigger */
const BURST_COUNT = 10;

export function EmoteLayer({ gesture, triggerCount }) {
  const [particles, setParticles] = useState([]);
  const activeTimeouts = useRef([]);

  useEffect(() => {
    if (triggerCount === 0 || gesture === 'none' || !gesture) return;

    const emote = GESTURES[gesture]?.emote;
    if (!emote) return;

    const burstId = `${Date.now()}-${Math.random()}`;

    // Build a burst of varied particles spread across the bottom of the frame
    const burst = Array.from({ length: BURST_COUNT }, (_, i) => ({
      id:       `${burstId}-${i}`,
      emote,
      // Spread evenly with some jitter so they don't all overlap
      x:        5 + (i / (BURST_COUNT - 1)) * 88 + (Math.random() - 0.5) * 6,
      size:     38 + Math.random() * 28,          // 38 – 66 px
      duration: 2.4 + Math.random() * 1.6,        // 2.4 – 4.0 s
      delay:    i * 0.055 + Math.random() * 0.08, // staggered start
      drift:    (Math.random() - 0.5) * 70,       // horizontal wobble (px)
      initRotate: (Math.random() - 0.5) * 24,     // entry tilt
    }));

    setParticles(prev => [...prev, ...burst]);

    // Remove burst after all particles have finished
    const maxLifetime =
      Math.max(...burst.map(p => (p.duration + p.delay) * 1000)) + 300;

    const tid = setTimeout(() => {
      setParticles(prev => prev.filter(p => !p.id.startsWith(burstId)));
      activeTimeouts.current = activeTimeouts.current.filter(t => t !== tid);
    }, maxLifetime);

    activeTimeouts.current.push(tid);
  }, [triggerCount, gesture]);

  // Cleanup on unmount
  useEffect(() => {
    return () => activeTimeouts.current.forEach(clearTimeout);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-10">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            left:     `${p.x}%`,
            bottom:   '-10px',          // just below the visible area
            fontSize: `${p.size}px`,
            pointerEvents: 'none',
            lineHeight: 1,
          }}
          initial={{
            opacity:  0,
            y:        0,
            scale:    0.4,
            rotate:   p.initRotate,
            x:        0,
          }}
          animate={{
            // Single target values — one smooth curve the whole way up (no stepped keyframes)
            y:       -920,
            opacity: [0, 1, 1, 0],
            scale:   1,
            x:       p.drift,
            rotate:  -p.initRotate * 0.3,
          }}
          transition={{
            // Bubble-rise ease: gentle resistance at start, then steady smooth ascent
            y:       { duration: p.duration, delay: p.delay, ease: [0.3, 0.4, 0.5, 1] },
            // Quick pop-in, hold, fade out in last 25%
            opacity: { duration: p.duration, delay: p.delay, times: [0, 0.07, 0.72, 1], ease: 'easeInOut' },
            // Fast scale-up on entry
            scale:   { duration: 0.35, delay: p.delay, ease: [0.34, 1.56, 0.64, 1] },
            // Drift and rotation follow the same smooth curve
            x:       { duration: p.duration, delay: p.delay, ease: [0.3, 0.4, 0.5, 1] },
            rotate:  { duration: p.duration, delay: p.delay, ease: 'easeInOut' },
          }}
        >
          {p.emote}
        </motion.div>
      ))}
    </div>
  );
}

export default EmoteLayer;
