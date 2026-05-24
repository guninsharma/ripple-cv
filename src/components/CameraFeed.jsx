import React from 'react';
import SkeletonOverlay from './SkeletonOverlay.jsx';
import EmoteLayer from './EmoteLayer.jsx';
import LaserEffect from './LaserEffect.jsx';

export function CameraFeed({
  videoRef,
  results,
  gesture,
  triggerCount,
  showSkeleton,
  isStreaming,
  onStartCamera,
  error,
}) {
  return (
    <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
      {/* Hidden raw video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }}
      />

      {/* Canvas Skeleton overlay showing the mirrored stream and trackers */}
      <SkeletonOverlay
        results={results}
        videoRef={videoRef}
        showSkeleton={showSkeleton}
      />

      {/* FaceTime-style animated reaction layer */}
      <EmoteLayer
        gesture={gesture}
        triggerCount={triggerCount}
      />

      {/* Laser beam sweep — only fires for the rock-on gesture */}
      <LaserEffect
        gesture={gesture}
        triggerCount={triggerCount}
      />

      {/* Start Camera / Permission Overlay */}
      {!isStreaming && (
        <div className="absolute inset-0 bg-[#0a0a0c]/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="flex flex-col items-center max-w-md gap-6">
            {/* Pulsating Icon Background with SVG camera */}
            <div className="w-24 h-24 rounded-full pulsating-icon-bg flex items-center justify-center select-none">
              <svg
                className="w-10 h-10 text-violet-300"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                />
              </svg>
            </div>

            <div className="flex flex-col gap-2 max-w-[380px] mx-auto">
              <h2 className="text-xl font-extrabold text-white tracking-wide">Enable Camera Access</h2>
              <p className="text-[12px] leading-relaxed text-white/45">
                This app uses Google MediaPipe Holistic to detect gestures and trigger Apple FaceTime-style floating reactions in real-time. Everything runs locally in your browser.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <button
                onClick={onStartCamera}
                className="px-7 py-3.5 rounded-xl btn-premium-start text-white text-sm font-semibold select-none cursor-pointer transform hover:scale-[1.01] active:scale-[0.99]"
              >
                Start Camera Feed
              </button>

              <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-white/40">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
                <span>No data leaves your device</span>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 font-medium max-w-xs mt-2 animate-slideIn">
                {error}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CameraFeed;
