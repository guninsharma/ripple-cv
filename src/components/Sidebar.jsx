import React, { useState, useEffect } from 'react';
import GestureDisplay from './GestureDisplay.jsx';
import { GESTURES } from '../utils/constants.js';

export function Sidebar({
  gesture,
  confidence,
  motionSpeed,
  personDetected,
  isModelReady,
  showSkeleton,
  onToggleSkeleton,
  fps,
  totalGestures,
  history,
}) {
  // Local state to keep track of a rolling history of the last 4 FPS values
  const [fpsHistory, setFpsHistory] = useState([0, 0, 0, 0]);

  useEffect(() => {
    if (fps !== undefined) {
      setFpsHistory((prev) => [...prev.slice(1), fps]);
    }
  }, [fps]);

  const guideGestures = Object.values(GESTURES).filter((g) => g.id !== 'none');

  // Green glow border when Yes, muted/inactive when No
  const personDetectedClass = personDetected
    ? 'border-accent2 bg-accent2/10 shadow-[0_0_15px_rgba(52,211,153,0.15)] h-[64px]'
    : 'border-[rgba(255,255,255,0.08)] bg-surface2/40 opacity-50 h-[64px]';

  return (
    <aside className="w-[280px] flex flex-col h-full sidebar-glass text-white overflow-hidden select-none">
      {/* 1. GestureDisplay Section */}
      <div className="p-4">
        <GestureDisplay gesture={gesture} confidence={confidence} motionSpeed={motionSpeed} />
      </div>

      {/* Short Divider */}
      <div className="mx-6 h-[1px] bg-[rgba(255,255,255,0.08)] my-1" />

      {/* Scrollable Container for the remaining sections */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* 2. Stats Section */}
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[rgba(167,243,208,0.45)] whitespace-nowrap">
              Stats
            </span>
            <div className="h-[1px] flex-1 bg-[rgba(255,255,255,0.08)]" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Total Gestures */}
            <div className="bg-surface2/60 rounded-xl p-2.5 border border-[rgba(255,255,255,0.08)] flex flex-col justify-between h-[64px]">
              <div className="data-tabular leading-none flex items-center justify-between">
                <span>{totalGestures}</span>
                {totalGestures > 0 && (
                  <span className="text-[9px] font-extrabold text-accent px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20 select-none">
                    ACT
                  </span>
                )}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-[rgba(167,243,208,0.45)]">
                Total Gestures
              </div>
            </div>

            {/* FPS with Sparkline */}
            <div className="bg-surface2/60 rounded-xl p-2.5 border border-[rgba(255,255,255,0.08)] flex flex-col justify-between h-[64px]">
              <div className="flex items-end justify-between">
                <div className={fps > 0 ? 'data-tabular leading-none' : 'data-tabular leading-none text-white/30 font-bold'}>
                  {fps > 0 ? fps : '—'}
                </div>
                {/* Tiny Sparkline */}
                {fps > 0 && (
                  <div className="flex items-end gap-[2px] h-[14px] pb-0.5">
                    {fpsHistory.map((val, idx) => {
                      const heightPercent = Math.min(100, Math.max(15, (val / 60) * 100));
                      return (
                        <div
                          key={idx}
                          className="w-[3px] bg-accent2/80 rounded-[1px] transition-all duration-300"
                          style={{ height: `${heightPercent}%` }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-[rgba(167,243,208,0.45)]">
                FPS
              </div>
            </div>

            {/* Person Detected with glow */}
            <div className={`rounded-xl p-2.5 border transition-all duration-300 flex flex-col justify-between col-span-2 ${personDetectedClass}`}>
              <div className="data-tabular leading-none flex items-center justify-between w-full">
                <span>{personDetected ? 'Yes' : 'No'}</span>
                {personDetected && (
                  <span className="w-2 h-2 rounded-full bg-accent2 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                )}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-[rgba(167,243,208,0.45)]">
                Person Detected
              </div>
            </div>
          </div>
        </div>

        {/* Short Divider */}
        <div className="mx-6 h-[1px] bg-[rgba(255,255,255,0.08)] my-1" />

        {/* 3. Gesture Guide Section */}
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[rgba(167,243,208,0.45)] whitespace-nowrap">
              Gesture Guide
            </span>
            <div className="h-[1px] flex-1 bg-[rgba(255,255,255,0.08)]" />
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
            {guideGestures.map((g) => (
              <div
                key={g.id}
                className="rounded-xl p-2.5 border flex flex-col gap-1.5 hover:bg-white/5 hover:border-white/10 hover:scale-[1.02] transition-all duration-200"
                style={{
                  backgroundColor: '#1c1c22',
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                }}
              >
                <span className="text-[32px] leading-none select-none">{g.emote}</span>
                <div className="flex flex-col gap-0.5">
                  <div className="text-[12px] font-bold text-white leading-tight">{g.name}</div>
                  <div className="text-[10px] text-white/40 leading-snug">{g.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Short Divider */}
        <div className="mx-6 h-[1px] bg-[rgba(255,255,255,0.08)] my-1" />

        {/* 4. Controls Section */}
        <div className="p-4 flex items-center justify-between">
          <span className="text-[13px] font-medium text-white/70">Show skeleton</span>
          <div
            onClick={onToggleSkeleton}
            className={`w-[38px] h-[22px] flex items-center rounded-full p-[2px] cursor-pointer transition-colors duration-200 ${
              showSkeleton ? 'bg-accent2' : 'bg-white/10'
            }`}
          >
            <div
              className={`bg-white w-[18px] h-[18px] rounded-full shadow-md transform transition-transform duration-200 ${
                showSkeleton ? 'translate-x-[16px]' : 'translate-x-0'
              }`}
            />
          </div>
        </div>

        {/* Short Divider */}
        <div className="mx-6 h-[1px] bg-[rgba(255,255,255,0.08)] my-1" />

        {/* 5. History Section */}
        <div className="p-4 flex-1 flex flex-col min-h-0 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[rgba(167,243,208,0.45)] whitespace-nowrap">
              Recent Activity
            </span>
            <div className="h-[1px] flex-1 bg-[rgba(255,255,255,0.08)]" />
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1">
            {history.length === 0 ? (
              <div className="text-[12px] text-white/30 italic text-center py-4">
                No activity yet
              </div>
            ) : (
              history.slice(0, 20).map((item) => {
                const gestureInfo = GESTURES[item.gestureKey] || GESTURES.none;
                const timeStr = new Date(item.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false,
                });
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-[12px] p-2 bg-surface2/60 rounded-lg border border-[rgba(255,255,255,0.08)] hover:bg-white/5 transition-all duration-200 animate-slideIn"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[18px] leading-none select-none">{gestureInfo.emote}</span>
                      <span className="font-semibold text-[12px] text-white">{gestureInfo.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-white/30">{timeStr}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
