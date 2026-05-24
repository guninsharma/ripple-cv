import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// ── Colour palette ─────────────────────────────────────────────────────────────
const COLORS = [
  '#ff2d78', // hot pink
  '#00d4ff', // electric blue
  '#bf5aff', // violet
  '#00ffcc', // cyan-green
  '#ff9500', // orange
  '#5af5ff', // ice blue
];

// ── Beam configs ───────────────────────────────────────────────────────────────
// Angles are in CSS degrees measured from the element's default orientation
// (which is straight-up, since height > width).
// Positive → tilts right, Negative → tilts left.
//
// Left-corner beams sweep from a narrow upward angle out toward the right.
// Right-corner beams mirror this, sweeping out toward the left.
const LEFT_BEAMS = [
  { start: -18, end:  65, delay: 0.00, speed: 1.6, color: COLORS[0], width: 4.5 },
  { start:   5, end:  78, delay: 0.13, speed: 1.8, color: COLORS[2], width: 3.5 },
  { start:  22, end:  52, delay: 0.25, speed: 1.4, color: COLORS[4], width: 5.0 },
];

const RIGHT_BEAMS = [
  { start:  18, end: -65, delay: 0.07, speed: 1.6, color: COLORS[1], width: 4.5 },
  { start:  -5, end: -78, delay: 0.20, speed: 1.8, color: COLORS[3], width: 3.5 },
  { start: -22, end: -52, delay: 0.10, speed: 1.4, color: COLORS[5], width: 5.0 },
];

// ── Single beam ────────────────────────────────────────────────────────────────
function Beam({ cfg, side, epoch }) {
  const isLeft = side === 'left';

  // The beam element is a tall thin rectangle positioned at a bottom corner.
  // Rotating it around that corner sweeps it like a spotlight.
  return (
    <motion.div
      key={`${epoch}-${side}-${cfg.color}`}
      style={{
        position:        'absolute',
        bottom:          0,
        // Align the element flush with the corner
        [isLeft ? 'left' : 'right']: 0,
        width:           `${cfg.width}px`,
        // Height well beyond the container — ensures beam reaches the top
        height:          '220%',
        // Pivot at the corner that sits on the screen edge
        transformOrigin: isLeft ? 'bottom left' : 'bottom right',
        borderRadius:    '9999px',
        // Gradient: full colour at origin, fades to transparent toward the tip
        background: `linear-gradient(
          to top,
          ${cfg.color}     0%,
          ${cfg.color}cc  20%,
          ${cfg.color}66  50%,
          ${cfg.color}22  75%,
          transparent     100%
        )`,
        // Triple glow: tight core + medium halo + wide bloom
        boxShadow: [
          `0 0  5px 1px ${cfg.color}`,
          `0 0 18px 3px ${cfg.color}99`,
          `0 0 50px 8px ${cfg.color}44`,
        ].join(', '),
        pointerEvents: 'none',
      }}
      initial={{ rotate: cfg.start, opacity: 0 }}
      animate={{
        // Sweep: start → far end → return toward centre → fade
        rotate:  [cfg.start, cfg.end, cfg.start * 0.6],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        rotate: {
          duration: cfg.speed,
          delay:    cfg.delay,
          ease:     'easeInOut',
          times:    [0, 0.50, 1.0],
        },
        opacity: {
          duration: cfg.speed,
          delay:    cfg.delay,
          times:    [0, 0.05, 0.85, 1],
        },
      }}
    />
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function LaserEffect({ gesture, triggerCount }) {
  const [active, setActive] = useState(false);
  const [epoch,  setEpoch]  = useState(0);
  const tidRef              = useRef(null);

  useEffect(() => {
    if (triggerCount === 0 || gesture !== 'lasers') return;

    // Bump epoch to force framer-motion to re-run all animations from scratch
    setEpoch(e => e + 1);
    setActive(true);

    if (tidRef.current) clearTimeout(tidRef.current);
    // Keep mounted until the longest beam + fade finishes
    const maxDuration = Math.max(...[...LEFT_BEAMS, ...RIGHT_BEAMS].map(b => (b.speed + b.delay) * 1000)) + 200;
    tidRef.current = setTimeout(() => setActive(false), maxDuration);

    return () => clearTimeout(tidRef.current);
  }, [triggerCount, gesture]);

  if (!active) return null;

  return (
    // screen blend: neon colours glow on top of the camera feed naturally
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden z-20"
      style={{ mixBlendMode: 'screen' }}
    >
      {/* Subtle floor glow at the base of each corner when lasers fire */}
      <motion.div
        key={`flash-${epoch}`}
        style={{
          position:   'absolute',
          bottom:     0,
          left:       0,
          right:      0,
          height:     '30%',
          background: `radial-gradient(ellipse at 20% 100%, ${COLORS[0]}44, transparent 50%),
                       radial-gradient(ellipse at 80% 100%, ${COLORS[1]}44, transparent 50%)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.8, 0] }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />

      {/* Left-corner beams */}
      {LEFT_BEAMS.map((cfg, i) => (
        <Beam key={`L${i}-${epoch}`} cfg={cfg} side="left" epoch={epoch} />
      ))}

      {/* Right-corner beams */}
      {RIGHT_BEAMS.map((cfg, i) => (
        <Beam key={`R${i}-${epoch}`} cfg={cfg} side="right" epoch={epoch} />
      ))}
    </div>
  );
}

export default LaserEffect;
