import { useEffect, useRef, useState } from 'react';

// Access Holistic and Camera globally from index.html CDN script tags
const Holistic = window.Holistic;
const Camera = window.Camera;

export function useMediaPipe(videoRef, onResults, isStreaming) {
  const [isModelReady, setIsModelReady] = useState(false);
  const holisticRef = useRef(null);
  const cameraRef = useRef(null);
  const onResultsRef = useRef(onResults);

  // Sync the results callback reference without reloading the MediaPipe instance
  useEffect(() => {
    onResultsRef.current = onResults;
  }, [onResults]);

  useEffect(() => {
    if (!isStreaming || !videoRef.current) {
      setIsModelReady(false);
      return;
    }

    let active = true;

    // Create Holistic instance
    const holistic = new Holistic({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1675471629/${file}`,
    });

    holistic.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      refineFaceLandmarks: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    holistic.onResults((results) => {
      if (active && onResultsRef.current) {
        onResultsRef.current(results);
      }
    });

    holisticRef.current = holistic;

    let animationFrameId = null;

    // Start frame loop once model is initialized
    function startFrameLoop() {
      const processFrame = async () => {
        if (!active) return;

        const video = videoRef.current;
        if (video && video.readyState >= 2 && !video.paused) {
          try {
            await holistic.send({ image: video });
          } catch (err) {
            console.error('Error sending frame to Holistic:', err);
          }
        }

        if (active) {
          animationFrameId = requestAnimationFrame(processFrame);
        }
      };

      processFrame();
    }

    // Wait for model to initialize if initialize exists, otherwise set ready
    if (typeof holistic.initialize === 'function') {
      holistic.initialize()
        .then(() => {
          if (active) {
            setIsModelReady(true);
            startFrameLoop();
          }
        })
        .catch((err) => {
          console.error('Failed to initialize MediaPipe Holistic:', err);
        });
    } else {
      setIsModelReady(true);
      startFrameLoop();
    }

    // Cleanup: stop animation frames and close holistic instance
    return () => {
      active = false;
      setIsModelReady(false);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (holisticRef.current) {
        try {
          holisticRef.current.close();
        } catch (e) {
          console.error('Error closing holistic model:', e);
        }
        holisticRef.current = null;
      }
    };
  }, [isStreaming, videoRef]);

  return {
    isModelReady,
  };
}

export default useMediaPipe;
