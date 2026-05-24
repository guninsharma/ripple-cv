import React, { useState, useRef, useEffect, useCallback } from 'react';
import useCamera from './hooks/useCamera.js';
import useMediaPipe from './hooks/useMediaPipe.js';
import useGestureDetector from './hooks/useGestureDetector.js';
import CameraFeed from './components/CameraFeed.jsx';
import Sidebar from './components/Sidebar.jsx';

function Header({ isStreaming, isModelReady, onStartCamera }) {
  let statusText = '';
  let statusClass = '';

  if (isStreaming) {
    if (!isModelReady) {
      statusText = 'Loading model…';
      statusClass = 'bg-accent/10 text-accent border border-accent/20'; // accent is purple
    } else {
      statusText = '● Live';
      statusClass = 'bg-accent2/10 text-accent2 border border-accent2/20'; // accent2 is green
    }
  }

  return (
    <header
      className="w-full h-16 bg-surface2/80 backdrop-blur-md flex items-center justify-between px-6 z-30 select-none flex-shrink-0"
      style={{
        borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
      }}
    >
      <div className="flex items-center gap-3">
        <h1 className="text-[24px] font-extrabold text-white tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">
          Ripple
        </h1>
      </div>
      {!isStreaming ? (
        <button
          onClick={onStartCamera}
          className="px-4 py-1.5 rounded-lg btn-premium-start text-white text-xs font-semibold select-none cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          Start Camera
        </button>
      ) : (
        <div className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${statusClass}`}>
          {statusText}
        </div>
      )}
    </header>
  );
}

export function App() {
  const [results, setResults] = useState(null);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [triggerCount, setTriggerCount] = useState(0);
  const [fps, setFps] = useState(0);
  const [totalGestures, setTotalGestures] = useState(0);
  const [history, setHistory] = useState([]);
  const lastFrameTimeRef = useRef(Date.now());
  const lastGestureRef = useRef(null);

  const { videoRef, isStreaming, error, startCamera } = useCamera();

  const handleResults = useCallback((r) => {
    setResults(r);
    // FPS calculation
    const now = Date.now();
    setFps(Math.round(1000 / (now - lastFrameTimeRef.current)));
    lastFrameTimeRef.current = now;
  }, []);

  const { isModelReady } = useMediaPipe(videoRef, handleResults, isStreaming);
  const { gesture, confidence, motionSpeed, personDetected } = useGestureDetector(results);

  // Gesture trigger effect
  // The classifier enforces the global 1200ms cooldown internally.
  // Here we simply fire whenever the gesture transitions from null → something real.
  useEffect(() => {
    if (gesture === 'none' || !gesture) {
      // Reset so the same gesture can re-fire after the cooldown clears
      lastGestureRef.current = null;
      return;
    }

    // Don't re-trigger the same gesture continuously (it hasn't changed)
    if (gesture === lastGestureRef.current) return;

    // Trigger emoji bubble
    setTriggerCount((c) => c + 1);
    lastGestureRef.current = gesture;

    // Increment stats
    setTotalGestures((t) => t + 1);

    // Add to history (keep newest 20 items)
    const now = Date.now();
    setHistory((prev) => [
      { id: now, gestureKey: gesture, timestamp: now },
      ...prev,
    ].slice(0, 20));
  }, [gesture]);

  return (
    <div className="flex flex-col h-screen bg-transparent">
      <Header isStreaming={isStreaming} isModelReady={isModelReady} onStartCamera={startCamera} />
      <div className="flex flex-1 overflow-hidden">
        <CameraFeed
          videoRef={videoRef}
          results={results}
          gesture={gesture}
          triggerCount={triggerCount}
          showSkeleton={showSkeleton}
          isStreaming={isStreaming}
          onStartCamera={startCamera}
          error={error}
        />
        <Sidebar
          gesture={gesture}
          confidence={confidence}
          motionSpeed={motionSpeed}
          personDetected={personDetected}
          isModelReady={isModelReady}
          showSkeleton={showSkeleton}
          onToggleSkeleton={() => setShowSkeleton((v) => !v)}
          fps={fps}
          totalGestures={totalGestures}
          history={history}
        />
      </div>
      {/* Premium signature bottom border */}
      <div className="w-full h-[2px] z-50 flex-shrink-0" style={{ background: 'linear-gradient(90deg, #065f46, #10b981, #34d399)' }} />
    </div>
  );
}

export default App;
