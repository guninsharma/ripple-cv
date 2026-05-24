import React from 'react';
import { GESTURES } from '../utils/constants.js';

export function GestureDisplay({ gesture, confidence, motionSpeed = 0 }) {
  const gestureInfo = GESTURES[gesture] || GESTURES.none;
  const isActive = gesture && gesture !== 'none';

  const cardClass = isActive
    ? 'gesture-active-border p-3 flex items-center gap-3'
    : 'bg-surface2/60 border border-white/5 p-3 rounded-xl flex items-center gap-3';

  const cardStyle = isActive
    ? { '--gesture-color': gestureInfo.color || '#10b981' }
    : undefined;

  // Normalize speed: assume 0.08 is max speed, scale to 0-1, and map to percentage
  const normalizedSpeed = Math.min(1, Math.max(0, motionSpeed / 0.08));
  const speedPercent = Math.round(normalizedSpeed * 100);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30 whitespace-nowrap">
          Current Gesture
        </span>
        <div className="h-[1px] flex-1 bg-white/5" />
      </div>

      <div className={cardClass} style={cardStyle}>
        <span className="text-[32px] select-none" role="img" aria-label={gestureInfo.name}>
          {gestureInfo.emote}
        </span>
        <div className="flex flex-col min-w-0">
          <div className="text-[14px] font-bold text-white truncate leading-tight">
            {gestureInfo.name}
          </div>
          <div className="text-[11px] text-white/40 truncate leading-snug">
            {gestureInfo.desc}
          </div>
        </div>
      </div>

      {/* Motion Intensity Meter */}
      <div className="flex flex-col gap-1.5 mt-2">
        <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-[0.15em] text-white/30 px-0.5">
          <span>Motion Intensity</span>
          <span className="font-mono text-white/50">{speedPercent}%</span>
        </div>
        <div className="relative h-[10px] bg-[#064e3b] rounded-full overflow-hidden border border-white/5 flex items-center">
          <div
            className="h-full rounded-full"
            style={{
              width: `${speedPercent}%`,
              backgroundColor: '#10b981',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)',
              transition: 'width 100ms linear',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default GestureDisplay;
