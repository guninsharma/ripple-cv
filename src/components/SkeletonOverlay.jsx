import React, { useRef, useEffect } from 'react';
import { drawPoseSkeleton, drawHandLandmarks, clearCanvas } from '../utils/drawSkeleton.js';

export function SkeletonOverlay({ results, videoRef, showSkeleton }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get width and height from video feed if available, else fallback
    const width = videoRef?.current?.videoWidth || 1280;
    const height = videoRef?.current?.videoHeight || 720;

    // Always keep canvas size synced with video
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    clearCanvas(ctx, width, height);

    if (results && results.image) {
      // Draw mirrored video frame (selfie view)
      ctx.save();
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(results.image, 0, 0, width, height);

      // Draw skeleton overlays if enabled (under the same mirrored context)
      if (showSkeleton) {
        if (results.poseLandmarks) {
          drawPoseSkeleton(ctx, results.poseLandmarks, width, height);
        }
        if (results.leftHandLandmarks) {
          drawHandLandmarks(ctx, results.leftHandLandmarks, width, height);
        }
        if (results.rightHandLandmarks) {
          drawHandLandmarks(ctx, results.rightHandLandmarks, width, height);
        }
      }
      ctx.restore();
    }
  }, [results, videoRef, showSkeleton]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      }}
    />
  );
}

export default SkeletonOverlay;
