# Motion Emote — Agent Implementation Plan

> **Instructions for the AI agent:** Read this entire document before writing a single line of code. Follow the build order exactly. Every file, every export, every prop, every function signature is specified. Do not deviate. Do not add libraries not listed here. Do not skip steps. After completing each phase, confirm completion before moving to the next.

---

## 0. Project Overview

**What we are building:** A React + Vite web application that:
1. Captures live webcam video in the browser
2. Runs Google MediaPipe Holistic on every frame (pose + hand landmark detection)
3. Classifies landmarks into gesture labels using pure JS rule-based logic
4. Renders Apple FaceTime-style floating emoji reactions using Framer Motion
5. Shows a live skeleton overlay on the video canvas
6. Displays a sidebar with current gesture, confidence, stats, and activity history

**Target runtime:** Chrome 110+ / Edge 110+ (WebAssembly + getUserMedia required)  
**No backend. No server. Fully client-side.**

---

## 1. Tech Stack — Exact Versions

| Package | Version | Purpose |
|---|---|---|
| `react` | `^18.3.1` | UI framework |
| `react-dom` | `^18.3.1` | DOM rendering |
| `vite` | `^5.4.2` | Dev server + bundler |
| `@vitejs/plugin-react` | `^4.3.1` | React Fast Refresh |
| `@mediapipe/holistic` | `0.5.1675471629` | Pose + hand + face tracking |
| `@mediapipe/camera_utils` | `0.3.1640029074` | Camera loop helper |
| `@mediapipe/drawing_utils` | `0.3.1620248257` | (imported but not used for drawing — we draw manually) |
| `framer-motion` | `^11.3.19` | Emote bubble animations |
| `tailwindcss` | `^3.4.10` | Utility CSS |
| `postcss` | `^8.4.41` | Tailwind dependency |
| `autoprefixer` | `^10.4.20` | Tailwind dependency |
| `vitest` | `^2.0.5` | Unit testing |
| `@vitest/ui` | `^2.0.5` | Test UI |

**Install command (run once):**
```bash
npm create vite@latest motion-emote -- --template react
cd motion-emote
npm install @mediapipe/holistic@0.5.1675471629 @mediapipe/camera_utils@0.3.1640029074 @mediapipe/drawing_utils@0.3.1620248257 framer-motion
npm install -D tailwindcss@^3.4.10 postcss autoprefixer vitest @vitest/ui
npx tailwindcss init -p
```

---

## 2. Configuration Files

### 2.1 `tailwind.config.js` — replace entire file
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
      colors: {
        surface: '#141418',
        surface2: '#1c1c22',
        accent: '#a78bfa',
        accent2: '#34d399',
      },
      keyframes: {
        floatUp: {
          '0%':   { opacity: '0', transform: 'scale(0.4) translateY(0px) rotate(-8deg)' },
          '15%':  { opacity: '1', transform: 'scale(1.15) translateY(-20px) rotate(4deg)' },
          '30%':  { transform: 'scale(1.0) translateY(-40px) rotate(0deg)' },
          '70%':  { opacity: '1', transform: 'scale(1.0) translateY(-100px) rotate(-2deg)' },
          '100%': { opacity: '0', transform: 'scale(0.85) translateY(-180px) rotate(3deg)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        pulse: {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%':     { opacity: '0.5', transform: 'scale(0.8)' },
        },
      },
      animation: {
        floatUp: 'floatUp 2.4s cubic-bezier(0.22,1,0.36,1) forwards',
        slideIn: 'slideIn 0.3s cubic-bezier(0.22,1,0.36,1)',
        pulse:   'pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
```

### 2.2 `vite.config.js` — replace entire file
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['@mediapipe/holistic', '@mediapipe/camera_utils', '@mediapipe/drawing_utils'],
  },
})
```

> **Why:** MediaPipe uses SharedArrayBuffer which requires COOP/COEP headers. The `optimizeDeps.exclude` prevents Vite from pre-bundling the MediaPipe ESM packages (they load their own WASM internally).

### 2.3 `src/index.css` — replace entire file
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  background: #0a0a0c;
  color: #f0eff4;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
  height: 100vh;
  overflow: hidden;
}

#root { height: 100vh; display: flex; flex-direction: column; }

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-thumb { background: #1c1c22; border-radius: 2px; }
```

### 2.4 `vitest.config.js` — create new file
```js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

### 2.5 `package.json` scripts — add these to existing scripts block
```json
"test": "vitest",
"test:ui": "vitest --ui"
```

---

## 3. Final File Tree

Create **exactly** these files in **exactly** these locations. Do not create any others unless specified.

```
motion-emote/
├── public/
│   └── (empty — no changes needed)
├── src/
│   ├── components/
│   │   ├── CameraFeed.jsx
│   │   ├── EmoteLayer.jsx
│   │   ├── GestureDisplay.jsx
│   │   ├── Sidebar.jsx
│   │   └── SkeletonOverlay.jsx
│   ├── hooks/
│   │   ├── useCamera.js
│   │   ├── useGestureDetector.js
│   │   └── useMediaPipe.js
│   ├── utils/
│   │   ├── constants.js
│   │   ├── drawSkeleton.js
│   │   └── gestureClassifier.js
│   ├── tests/
│   │   └── gestureClassifier.test.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── IMPLEMENTATION_PLAN.md
├── tailwind.config.js
├── vite.config.js
├── vitest.config.js
└── package.json
```

---

## 4. Build Order

**Follow this order exactly. Do not jump ahead.**

```
Phase A: Utils
  1. src/utils/constants.js
  2. src/utils/gestureClassifier.js
  3. src/utils/drawSkeleton.js

Phase B: Hooks
  4. src/hooks/useCamera.js
  5. src/hooks/useMediaPipe.js
  6. src/hooks/useGestureDetector.js

Phase C: Components
  7. src/components/GestureDisplay.jsx
  8. src/components/SkeletonOverlay.jsx
  9. src/components/EmoteLayer.jsx
  10. src/components/Sidebar.jsx
  11. src/components/CameraFeed.jsx

Phase D: App + Entry
  12. src/App.jsx
  13. src/main.jsx (minor edit only)

Phase E: Tests
  14. src/tests/gestureClassifier.test.js
```

---

## 5. File Specifications

### 5.1 `src/utils/constants.js`

**Exports:**
- `GESTURES` — object, keys are gesture IDs, values are gesture metadata
- `POSE_CONNECTIONS` — array of `[indexA, indexB]` pairs for skeleton drawing
- `HAND_CONNECTIONS` — array of `[indexA, indexB]` pairs for hand drawing
- `THRESHOLDS` — object of all tunable detection values

```js
// GESTURES shape — implement all 8 keys below
export const GESTURES = {
  wave: {
    id: 'wave',
    emote: '👋',
    name: 'Wave',
    desc: 'Happy greeting detected!',
    color: '#fbbf24',
  },
  celebrate: {
    id: 'celebrate',
    emote: '🎉',
    name: 'Celebrate!',
    desc: 'Both arms raised high!',
    color: '#a78bfa',
  },
  jump: {
    id: 'jump',
    emote: '😲',
    name: 'Jump!',
    desc: 'Sudden upward movement detected!',
    color: '#34d399',
  },
  fast: {
    id: 'fast',
    emote: '😤',
    name: 'Fast Move',
    desc: 'High-energy motion!',
    color: '#f87171',
  },
  thumbsup: {
    id: 'thumbsup',
    emote: '👍',
    name: 'Thumbs Up',
    desc: 'Approval gesture!',
    color: '#60a5fa',
  },
  rockon: {
    id: 'rockon',
    emote: '🤘',
    name: 'Rock On',
    desc: 'Rock hand sign detected!',
    color: '#f472b6',
  },
  still: {
    id: 'still',
    emote: '😴',
    name: 'Sleeping…',
    desc: 'No movement for 3 seconds.',
    color: '#6b6a78',
  },
  none: {
    id: 'none',
    emote: '–',
    name: 'Tracking…',
    desc: 'Move to trigger reactions.',
    color: 'transparent',
  },
}

// MediaPipe Pose landmark connections (index pairs)
export const POSE_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [24, 26], [25, 27], [26, 28],
  [0, 11],  [0, 12],
]

// MediaPipe Hand landmark connections
export const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
]

export const THRESHOLDS = {
  // Wave: minimum X-axis reversals in waveHistorySize frames
  waveReversals: 3,
  waveHistorySize: 20,
  waveMinDelta: 0.015,       // minimum wrist X movement per frame to count

  // Jump: shoulder midpoint Y must decrease by this amount in one frame
  jumpDelta: 0.045,

  // Fast: average landmark speed above this triggers "fast" gesture
  fastSpeedThreshold: 0.055,
  speedHistorySize: 10,

  // Still: frames with avg speed below this before triggering "still"
  stillSpeedThreshold: 0.004,
  stillFrameLimit: 90,       // ~3 seconds at 30fps

  // Celebrate: both wrists must be this far above their shoulder
  celebrateMargin: 0.12,

  // Gesture cooldown: ms before same gesture can fire again
  gestureCooldown: 1800,
}
```

---

### 5.2 `src/utils/gestureClassifier.js`

**All functions are pure.** No imports from React. No side effects.  
**Imports:** `THRESHOLDS` from `./constants`

**Exports (named):**
- `detectWave(wristXHistory: number[]): boolean`
- `detectCelebrate(poseLandmarks: array): boolean`
- `detectJump(prevShoulderMidY: number|null, currentShoulderMidY: number): { detected: boolean, newPrevY: number }`
- `detectFastMovement(speedHistory: number[]): boolean`
- `detectThumbsUp(handLandmarks: array): boolean`
- `detectRockOn(handLandmarks: array): boolean`
- `detectStill(stillFrames: number): boolean`
- `classifyGesture(params: ClassifyParams): ClassifyResult`

```js
// ClassifyParams shape:
// {
//   poseLandmarks: array|null,        // 33 MediaPipe pose landmarks
//   leftHandLandmarks: array|null,    // 21 MediaPipe hand landmarks
//   rightHandLandmarks: array|null,   // 21 MediaPipe hand landmarks
//   state: {
//     waveHistory: number[],          // mutate in place
//     speedHistory: number[],         // mutate in place
//     prevNose: {x,y}|null,
//     prevLeftWrist: {x,y}|null,
//     prevRightWrist: {x,y}|null,
//     prevShoulderMidY: number|null,
//     stillFrames: number,
//   }
// }

// ClassifyResult shape:
// {
//   gesture: string,       // key from GESTURES
//   confidence: number,    // 0-100
//   updatedState: object,  // full updated state object (do not mutate input)
//   motionSpeed: number,   // current avg speed (for UI display)
// }
```

**Detection logic — implement exactly:**

`detectWave(wristXHistory)`:
- Needs at least 16 entries in history
- Count direction reversals: for each index i≥2, if `|d1| > waveMinDelta` and `|d2| > waveMinDelta` and `sign(d1) !== sign(d2)`, it's a reversal where `d1 = history[i-1]-history[i-2]`, `d2 = history[i]-history[i-1]`
- Returns true if reversals >= `waveReversals`
- Confidence = `Math.min(95, 60 + reversals * 8)`

`detectCelebrate(poseLandmarks)`:
- Landmark 15 = left wrist, 16 = right wrist, 11 = left shoulder, 12 = right shoulder
- Returns true if `lWrist.y < lShoulder.y - celebrateMargin` AND `rWrist.y < rShoulder.y - celebrateMargin`
- Note: in MediaPipe, Y increases downward, so lower Y = higher on screen
- Confidence: 95

`detectJump(prevShoulderMidY, currentShoulderMidY)`:
- If prevShoulderMidY is null, return `{ detected: false, newPrevY: currentShoulderMidY }`
- `rise = prevShoulderMidY - currentShoulderMidY` (positive = moved up on screen)
- Returns `{ detected: rise > jumpDelta, newPrevY: currentShoulderMidY, confidence: Math.min(95, 60 + rise * 400) }`

`detectFastMovement(speedHistory)`:
- avgSpeed = sum / length
- Returns true if avgSpeed > fastSpeedThreshold
- Confidence = `Math.min(95, 50 + avgSpeed * 400)`

`detectThumbsUp(handLandmarks)`:
- Landmark indices: thumb tip=4, thumb IP=3, thumb MCP=2, index tip=8, index MCP=5, middle tip=12, middle MCP=9
- thumbUp = `hand[4].y < hand[3].y && hand[4].y < hand[2].y`
- indexCurled = `hand[8].y > hand[5].y`
- middleCurled = `hand[12].y > hand[9].y`
- Returns true if thumbUp && indexCurled && middleCurled
- Confidence: 88

`detectRockOn(handLandmarks)`:
- indexUp = `hand[8].y < hand[6].y`
- pinkyUp = `hand[20].y < hand[18].y`
- middleDown = `hand[12].y > hand[9].y`
- ringDown = `hand[16].y > hand[13].y`
- Returns true if indexUp && pinkyUp && middleDown && ringDown
- Confidence: 85

`detectStill(stillFrames)`:
- Returns true if stillFrames > stillFrameLimit
- Confidence: 70

`classifyGesture(params)`:
- **Priority order (check in this order, return first match):**
  1. `detectCelebrate` — requires poseLandmarks
  2. `detectWave` — uses state.waveHistory, updated with current right wrist X (fall back to left wrist X if right not present)
  3. `detectThumbsUp` — check rightHandLandmarks first, then leftHandLandmarks
  4. `detectRockOn` — check rightHandLandmarks first, then leftHandLandmarks
  5. `detectJump` — requires poseLandmarks
  6. `detectFastMovement` — requires poseLandmarks (compute speed from nose + wrists delta)
  7. `detectStill` — uses state.stillFrames
  8. Return `{ gesture: 'none', confidence: 0, ... }`
- Speed computation: sum of `dist2D` between current and prev for nose (landmark 0), left wrist (15), right wrist (16)
- `dist2D(a, b) = Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2)`
- Update waveHistory: push new value, slice to last `waveHistorySize` entries
- Update speedHistory: push new speed, slice to last `speedHistorySize` entries
- Increment stillFrames if avgSpeed < stillSpeedThreshold, else reset to 0
- Return a **new state object** — do not mutate the input state

---

### 5.3 `src/utils/drawSkeleton.js`

**Imports:** `POSE_CONNECTIONS`, `HAND_CONNECTIONS` from `./constants`

**Exports (named):**
- `drawPoseSkeleton(ctx, landmarks, width, height, options)`
- `drawHandLandmarks(ctx, landmarks, width, height, options)`
- `clearCanvas(ctx, width, height)`

```js
// options shape for drawPoseSkeleton:
// { lineColor, lineWidth, dotColor, dotRadius }
// defaults: lineColor='rgba(167,139,250,0.7)', lineWidth=2, dotColor='rgba(167,139,250,0.9)', dotRadius=4

// options shape for drawHandLandmarks:
// { lineColor, lineWidth, dotColor, dotRadius }
// defaults: lineColor='rgba(52,211,153,0.7)', lineWidth=1.5, dotColor='rgba(52,211,153,0.9)', dotRadius=3
```

`drawPoseSkeleton`:
- For each `[a, b]` in POSE_CONNECTIONS: draw a line from `landmarks[a]` to `landmarks[b]` (multiply .x by width, .y by height)
- For each landmark: draw a filled circle at (x*width, y*height)
- Guard: if landmarks is null/undefined, return immediately

`drawHandLandmarks`:
- For each `[a, b]` in HAND_CONNECTIONS: draw a line
- For each landmark: draw a filled circle
- Guard: if landmarks is null/undefined, return immediately

`clearCanvas(ctx, width, height)`:
- `ctx.clearRect(0, 0, width, height)`

---

### 5.4 `src/hooks/useCamera.js`

**Returns:**
```js
{
  videoRef: React.RefObject,    // attach to <video> element
  isStreaming: boolean,
  error: string|null,           // human-readable error message
  startCamera: async () => void,
  stopCamera: () => void,
}
```

**Implementation notes:**
- Use `useRef` for videoRef
- Use `useState` for isStreaming and error
- `startCamera`: call `navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: false })`
- On success: assign stream to `videoRef.current.srcObject`, call `videoRef.current.play()`, set isStreaming true
- On failure: set error to `'Camera access denied. Please allow camera permissions and refresh.'`
- `stopCamera`: call `stream.getTracks().forEach(t => t.stop())`, set isStreaming false
- Clean up stream on unmount using `useEffect` return

---

### 5.5 `src/hooks/useMediaPipe.js`

**Parameters:** `(videoRef, onResults, isStreaming)`  
**Returns:**
```js
{
  isModelReady: boolean,
}
```

**Implementation notes:**
- Import `Holistic` from `@mediapipe/holistic` — use CDN URL pattern for locateFile:
  ```js
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1675471629/${file}`
  ```
- Import `Camera` from `@mediapipe/camera_utils`
- Use `useRef` for holistic instance and camera instance
- Use `useState` for isModelReady
- In `useEffect` watching `[isStreaming]`:
  - If not isStreaming, return
  - Create Holistic with options:
    ```js
    {
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      refineFaceLandmarks: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    }
    ```
  - Call `holistic.onResults(onResults)`
  - Wait for model to initialize (use `holistic.initialize()` if available, else proceed)
  - Set isModelReady true
  - Create Camera instance: `new Camera(videoRef.current, { onFrame: async () => { await holistic.send({ image: videoRef.current }) }, width: 1280, height: 720 })`
  - Start camera
  - Return cleanup: stop camera, close holistic

---

### 5.6 `src/hooks/useGestureDetector.js`

**Parameters:** `(results)` — MediaPipe Holistic results object  
**Returns:**
```js
{
  gesture: string,           // current GESTURES key
  confidence: number,        // 0-100
  motionSpeed: number,       // for display
  personDetected: boolean,
}
```

**Implementation notes:**
- Use `useRef` for the mutable state object (not useState — we don't want re-renders on every frame):
  ```js
  const stateRef = useRef({
    waveHistory: [],
    speedHistory: [],
    prevNose: null,
    prevLeftWrist: null,
    prevRightWrist: null,
    prevShoulderMidY: null,
    stillFrames: 0,
  })
  ```
- Use `useState` for `{ gesture, confidence, motionSpeed, personDetected }` (these drive UI)
- In `useEffect` watching `[results]`:
  - If no results or no results.poseLandmarks: set personDetected false, return
  - Call `classifyGesture({ poseLandmarks: results.poseLandmarks, leftHandLandmarks: results.leftHandLandmarks, rightHandLandmarks: results.rightHandLandmarks, state: stateRef.current })`
  - Update `stateRef.current = classifyResult.updatedState`
  - Update state: gesture, confidence, motionSpeed, personDetected: true

---

### 5.7 `src/components/GestureDisplay.jsx`

**Props:**
```js
{
  gesture: string,       // GESTURES key
  confidence: number,    // 0-100
}
```

**Renders:**
- Section title: "Current Gesture" (uppercase, muted, 11px)
- A card (`bg-surface2 rounded-xl border border-white/8 p-3`) containing:
  - Left: emote character at 32px
  - Right: gesture name (15px bold), gesture desc (12px muted)
- Confidence bar below the card:
  - Label row: "Confidence" left, `{confidence}%` right, 11px muted
  - Track: `h-[3px] bg-surface2 rounded-full overflow-hidden`
  - Fill: `h-full bg-accent2 rounded-full transition-all duration-300 ease-out`, width = `{confidence}%`
- Get emote/name/desc from `GESTURES[gesture]` (import from utils/constants)
- Default/fallback: use `GESTURES.none` if gesture key not found

---

### 5.8 `src/components/SkeletonOverlay.jsx`

**Props:**
```js
{
  results: object|null,     // MediaPipe Holistic results
  videoRef: React.RefObject,
  showSkeleton: boolean,
}
```

**Renders:** A `<canvas>` absolutely positioned over the video, same dimensions

**Implementation notes:**
- Use `useRef` for canvasRef
- Use `useEffect` watching `[results, showSkeleton]`:
  - Get canvas + ctx
  - Set canvas width/height from `videoRef.current.videoWidth / videoHeight` (fallback 1280x720)
  - `clearCanvas(ctx, width, height)`
  - Draw mirrored video frame: `ctx.save()`, `ctx.translate(width, 0)`, `ctx.scale(-1, 1)`, `ctx.drawImage(results.image, 0, 0, width, height)`, `ctx.restore()`
  - If showSkeleton && results.poseLandmarks: call `drawPoseSkeleton`
  - If showSkeleton && results.leftHandLandmarks: call `drawHandLandmarks`
  - If showSkeleton && results.rightHandLandmarks: call `drawHandLandmarks`
- Canvas style: `position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover`

---

### 5.9 `src/components/EmoteLayer.jsx`

**Props:**
```js
{
  gesture: string,      // current gesture key
  triggerCount: number, // increment this from parent to trigger a new bubble
}
```

**Renders:** An absolutely positioned div (pointer-events-none, overflow-hidden, inset-0) containing Framer Motion animated bubbles

**Implementation notes:**
- Use `useState` for `bubbles` array: `[{ id, emote, x, y }]`
- Use `useEffect` watching `[triggerCount]`:
  - If triggerCount === 0 or gesture === 'none' or gesture === null, return
  - Get emote from `GESTURES[gesture]?.emote`
  - Create bubble: `{ id: Date.now(), emote, x: 15 + Math.random() * 65, y: 10 + Math.random() * 20 }`
  - Add to bubbles array
  - Set timeout to remove it after 2600ms
- Each bubble: `<motion.div>` with:
  - `key={bubble.id}`
  - `style={{ position: 'absolute', left: bubble.x + '%', bottom: bubble.y + '%', fontSize: '52px', pointerEvents: 'none' }}`
  - Framer Motion animate: `initial={{ opacity: 0, scale: 0.4, y: 0, rotate: -8 }}`, `animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1.15, 1.0, 0.85], y: [0, -20, -100, -180], rotate: [-8, 4, -2, 3] }}`, `transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}`
- Clean up timeouts on unmount

---

### 5.10 `src/components/Sidebar.jsx`

**Props:**
```js
{
  gesture: string,
  confidence: number,
  motionSpeed: number,
  personDetected: boolean,
  isModelReady: boolean,
  showSkeleton: boolean,
  onToggleSkeleton: () => void,
  fps: number,
  totalGestures: number,
  history: Array<{ id, gestureKey, timestamp }>,
}
```

**Renders:** A fixed-width sidebar (280px) with dark surface background, divided into sections separated by `border-b border-white/8`:

1. **GestureDisplay section** — render `<GestureDisplay gesture={gesture} confidence={confidence} />`

2. **Stats section** — title "Stats", 2×2 grid of stat cards:
   - Total Gestures detected (totalGestures)
   - FPS (fps)
   - Motion Speed (convert motionSpeed number to label: <0.01='Low', <0.03='Medium', <0.055='High', else='Fast!')
   - Person Detected (personDetected ? 'Yes' : 'No')
   - Each stat card: `bg-surface2 rounded-xl p-2.5 border border-white/8`, value 20px/600, label 11px muted

3. **Gesture Guide section** — title "Gesture Guide", list of all gestures except 'none':
   - Each row: emote (18px) + `<strong>gesture name</strong> · description text`

4. **Controls section** — toggle row:
   - Label: "Show skeleton"
   - A custom toggle (div styled as pill switch): 38×22px, rounded-full, bg changes between surface2 and accent2, inner white circle slides right when on
   - onClick calls onToggleSkeleton

5. **History section** — title "Recent Activity", scrollable list of history items:
   - Each item: emote (18px) + gesture name + timestamp (HH:MM:SS)
   - `animate-slideIn` class on each item
   - Max 20 items shown, newest first
   - Format timestamp: `new Date(item.timestamp).toLocaleTimeString()`

---

### 5.11 `src/components/CameraFeed.jsx`

**Props:**
```js
{
  videoRef: React.RefObject,
  results: object|null,
  gesture: string,
  triggerCount: number,
  showSkeleton: boolean,
  isStreaming: boolean,
  onStartCamera: () => void,
  error: string|null,
}
```

**Renders:** A `relative flex-1 bg-black overflow-hidden` container with:

1. `<video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />`
2. `<SkeletonOverlay results={results} videoRef={videoRef} showSkeleton={showSkeleton} />`
3. `<EmoteLayer gesture={gesture} triggerCount={triggerCount} />`
4. If !isStreaming: a centered overlay with camera icon, descriptive text, and a start button (`onClick={onStartCamera}`)
5. If error: show error message in red below the start button

---

### 5.12 `src/App.jsx`

**No props.**

**State managed here:**
```js
const [results, setResults] = useState(null)
const [showSkeleton, setShowSkeleton] = useState(true)
const [triggerCount, setTriggerCount] = useState(0)
const [fps, setFps] = useState(0)
const [totalGestures, setTotalGestures] = useState(0)
const [history, setHistory] = useState([])
const lastFrameTimeRef = useRef(Date.now())
const lastGestureRef = useRef(null)
const lastGestureTimeRef = useRef(0)
```

**Hooks used:**
```js
const { videoRef, isStreaming, error, startCamera } = useCamera()
const { isModelReady } = useMediaPipe(videoRef, handleResults, isStreaming)
const { gesture, confidence, motionSpeed, personDetected } = useGestureDetector(results)
```

**`handleResults` function** (passed to useMediaPipe):
```js
function handleResults(r) {
  setResults(r)
  // FPS calculation
  const now = Date.now()
  setFps(Math.round(1000 / (now - lastFrameTimeRef.current)))
  lastFrameTimeRef.current = now
}
```

**Gesture trigger effect** — `useEffect` watching `[gesture]`:
- If gesture === 'none' or gesture === null, return
- Check cooldown: `Date.now() - lastGestureTimeRef.current < THRESHOLDS.gestureCooldown && gesture === lastGestureRef.current` → return
- Increment triggerCount
- Update lastGestureRef and lastGestureTimeRef
- Increment totalGestures
- Add to history: `{ id: Date.now(), gestureKey: gesture, timestamp: Date.now() }`, keep last 20

**Renders:**
```jsx
<div className="flex flex-col h-screen bg-[#0a0a0c]">
  <Header isStreaming={isStreaming} isModelReady={isModelReady} />
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
      onToggleSkeleton={() => setShowSkeleton(v => !v)}
      fps={fps}
      totalGestures={totalGestures}
      history={history}
    />
  </div>
</div>
```

**Also render inline (not a separate file) a `Header` component:**
```jsx
// Header props: { isStreaming, isModelReady }
// Renders: fixed top bar, dark bg, blur backdrop
// Left: pulsing green dot + "Motion Emote" title
// Right: status pill — text and color based on:
//   !isStreaming → "Click Start Camera" (neutral)
//   isStreaming && !isModelReady → "Loading model…" (purple)
//   isStreaming && isModelReady → "● Live" (green)
```

---

### 5.13 `src/main.jsx`

Only change needed — ensure it reads:
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

---

## 6. Tests — `src/tests/gestureClassifier.test.js`

Write tests using Vitest globals (`describe`, `it`, `expect`). Import from `../utils/gestureClassifier`.

### Test 1: `detectWave`
```js
describe('detectWave', () => {
  it('returns false when history has fewer than 16 entries', () => {
    expect(detectWave([0.1, 0.2, 0.3])).toBe(false)
  })
  it('returns false when no reversals occur', () => {
    // monotonically increasing — no reversals
    const history = Array.from({ length: 20 }, (_, i) => i * 0.02)
    expect(detectWave(history)).toBe(false)
  })
  it('returns true when wrist oscillates back and forth 3+ times', () => {
    // simulate a wave: 0.3, 0.5, 0.3, 0.5, 0.3, 0.5, ... (large deltas, reversals)
    const history = []
    for (let i = 0; i < 20; i++) history.push(i % 2 === 0 ? 0.2 : 0.6)
    expect(detectWave(history)).toBe(true)
  })
})
```

### Test 2: `detectThumbsUp`
```js
describe('detectThumbsUp', () => {
  it('returns false when hand landmarks are null', () => {
    expect(detectThumbsUp(null)).toBe(false)
  })
  it('returns true when thumb is up and fingers are curled', () => {
    // Build a mock hand: 21 landmarks as {x, y, z}
    const hand = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }))
    // Thumb tip (4) higher than thumb IP (3) and MCP (2)
    hand[4].y = 0.2; hand[3].y = 0.4; hand[2].y = 0.5
    // Index curled: tip (8) below MCP (5)
    hand[8].y = 0.7; hand[5].y = 0.4
    // Middle curled: tip (12) below MCP (9)
    hand[12].y = 0.7; hand[9].y = 0.4
    expect(detectThumbsUp(hand)).toBe(true)
  })
  it('returns false when thumb is down', () => {
    const hand = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }))
    hand[4].y = 0.8; hand[3].y = 0.4; hand[2].y = 0.3
    hand[8].y = 0.7; hand[5].y = 0.4
    hand[12].y = 0.7; hand[9].y = 0.4
    expect(detectThumbsUp(hand)).toBe(false)
  })
})
```

### Test 3: `detectJump`
```js
describe('detectJump', () => {
  it('returns detected:false when prevShoulderMidY is null', () => {
    const result = detectJump(null, 0.5)
    expect(result.detected).toBe(false)
    expect(result.newPrevY).toBe(0.5)
  })
  it('returns detected:true when shoulder rises sharply', () => {
    // prevY = 0.6, currentY = 0.5 → rise = 0.1 > jumpDelta (0.045)
    const result = detectJump(0.6, 0.5)
    expect(result.detected).toBe(true)
  })
  it('returns detected:false when movement is below threshold', () => {
    // prevY = 0.505, currentY = 0.5 → rise = 0.005 < 0.045
    const result = detectJump(0.505, 0.5)
    expect(result.detected).toBe(false)
  })
})
```

### Test 4: `classifyGesture` priority
```js
describe('classifyGesture priority', () => {
  it('returns celebrate over wave when both conditions are met', () => {
    const mockState = {
      waveHistory: Array.from({ length: 20 }, (_, i) => i % 2 === 0 ? 0.2 : 0.6),
      speedHistory: [],
      prevNose: null,
      prevLeftWrist: null,
      prevRightWrist: null,
      prevShoulderMidY: null,
      stillFrames: 0,
    }
    // Both wrists above shoulders
    const poseLandmarks = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0 }))
    poseLandmarks[11].y = 0.5  // left shoulder
    poseLandmarks[12].y = 0.5  // right shoulder
    poseLandmarks[15].y = 0.3  // left wrist — above shoulder by 0.2 > celebrateMargin
    poseLandmarks[16].y = 0.3  // right wrist
    const result = classifyGesture({ poseLandmarks, leftHandLandmarks: null, rightHandLandmarks: null, state: mockState })
    expect(result.gesture).toBe('celebrate')
  })
})
```

---

## 7. README.md

Create `README.md` in the project root with the following sections (write full content, not placeholders):

1. **Project title + one-line description**
2. **Demo** — note that a live demo requires HTTPS or localhost
3. **Features** — bulleted list of all 7 gestures and what triggers them
4. **Tech Stack** — table matching section 1 above
5. **Architecture** — brief explanation of the utils → hooks → components layering
6. **Getting Started** — exact commands to install and run
7. **Running Tests** — `npm test` and `npm run test:ui`
8. **Project Structure** — the file tree from section 3
9. **Gesture Detection Approach** — 2-3 paragraphs explaining the rule-based landmark analysis

---

## 8. Common Pitfalls — Read Before Coding

1. **MediaPipe WASM loading** — always use the CDN `locateFile` pattern. Do not import WASM files locally. Vite will break them.

2. **Mirror / flip** — MediaPipe gives landmarks in the original (non-mirrored) camera space. The video feed should be drawn mirrored (CSS `transform: scaleX(-1)` or canvas flip) but landmark coordinates already account for this in selfie mode. Draw skeleton on the mirrored canvas using the raw coordinates.

3. **Canvas sizing** — set canvas width/height from `video.videoWidth` and `video.videoHeight` on every frame, not once. The video dimensions may not be available immediately on mount.

4. **useRef vs useState for per-frame state** — gesture classification state (waveHistory, speedHistory, prevLandmarks) must use `useRef`. Using `useState` causes re-renders on every frame (30fps = 30 re-renders/sec = janky UI).

5. **MediaPipe Camera vs requestAnimationFrame** — use `@mediapipe/camera_utils` Camera class, not a manual `requestAnimationFrame` loop. The Camera class handles frame timing and browser visibility correctly.

6. **Cleanup** — always stop the MediaPipe Camera instance and close the Holistic instance in `useEffect` cleanup. Memory leaks from Holistic are significant.

7. **COOP/COEP headers** — required for SharedArrayBuffer (used by MediaPipe). The vite.config.js in section 2.2 handles this for dev. For production deployment, configure your hosting platform accordingly (Vercel: `vercel.json`, Netlify: `netlify.toml`, GitHub Pages: not supported without a service worker).

8. **Confidence display** — never show raw float confidence to the user. Always `Math.round(confidence)`.

9. **History array** — keep max 20 items. Use `[newItem, ...prev].slice(0, 20)` pattern in setState.

10. **Gesture cooldown** — managed in App.jsx using refs, not state. This prevents the same gesture from spamming bubbles.

---

## 9. Agent Completion Checklist

After building, verify each item:

- [ ] `npm install` completes with no errors
- [ ] `npm run dev` starts without errors
- [ ] Camera permission prompt appears on clicking Start
- [ ] Video feed renders mirrored (selfie view)
- [ ] Skeleton overlay appears when "Show skeleton" is toggled on
- [ ] At least 3 gestures trigger floating emotes (wave, celebrate, thumbsup)
- [ ] Confidence bar animates smoothly
- [ ] History list populates with timestamped entries
- [ ] Stats panel updates in real time (FPS, person detected)
- [ ] `npm test` runs and all 4 test suites pass
- [ ] No console errors in the browser
- [ ] Gesture cooldown works (same gesture doesn't spam)
- [ ] Emote bubbles fade out after ~2.4 seconds
- [ ] App is responsive at 1280px+ viewport width

---

*End of implementation plan. Start with Phase A, file 1: `src/utils/constants.js`.*
