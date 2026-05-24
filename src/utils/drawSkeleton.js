import { POSE_CONNECTIONS, HAND_CONNECTIONS } from './constants.js';

export function drawPoseSkeleton(ctx, landmarks, width, height, options = {}) {
  if (!landmarks) return;

  const {
    lineColor = 'rgba(16,185,129,0.7)',
    lineWidth = 2,
    dotColor = 'rgba(16,185,129,0.9)',
    dotRadius = 4,
  } = options;

  // Draw connections
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = lineWidth;
  for (const [a, b] of POSE_CONNECTIONS) {
    const ptA = landmarks[a];
    const ptB = landmarks[b];
    if (ptA && ptB) {
      ctx.beginPath();
      ctx.moveTo(ptA.x * width, ptA.y * height);
      ctx.lineTo(ptB.x * width, ptB.y * height);
      ctx.stroke();
    }
  }

  // Draw landmarks
  ctx.fillStyle = dotColor;
  for (const pt of landmarks) {
    if (pt) {
      ctx.beginPath();
      ctx.arc(pt.x * width, pt.y * height, dotRadius, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

export function drawHandLandmarks(ctx, landmarks, width, height, options = {}) {
  if (!landmarks) return;

  const {
    lineColor = 'rgba(52,211,153,0.8)',
    lineWidth = 1.5,
    dotColor = 'rgba(52,211,153,1.0)',
    dotRadius = 3,
  } = options;

  // Draw connections
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = lineWidth;
  for (const [a, b] of HAND_CONNECTIONS) {
    const ptA = landmarks[a];
    const ptB = landmarks[b];
    if (ptA && ptB) {
      ctx.beginPath();
      ctx.moveTo(ptA.x * width, ptA.y * height);
      ctx.lineTo(ptB.x * width, ptB.y * height);
      ctx.stroke();
    }
  }

  // Draw landmarks
  ctx.fillStyle = dotColor;
  for (const pt of landmarks) {
    if (pt) {
      ctx.beginPath();
      ctx.arc(pt.x * width, pt.y * height, dotRadius, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

export function clearCanvas(ctx, width, height) {
  if (ctx) {
    ctx.clearRect(0, 0, width, height);
  }
}
