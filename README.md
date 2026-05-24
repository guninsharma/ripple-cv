



# Ripple

A real-time gesture recognition app that triggers Apple FaceTime-style floating emoji reactions using your webcam and Google MediaPipe.

![Built With React](https://img.shields.io/badge/Built_With-React-61DAFB?style=flat&logo=react) ![Powered by MediaPipe](https://img.shields.io/badge/Powered_by-MediaPipe-FF6F00?style=flat)

---

## Overview

Ripple captures your webcam feed, tracks body and hand landmarks in real time, and matches coordinate relationships against deterministic geometric rules. When a gesture passes the check, a burst of corresponding emojis rises from the bottom of the screen via Framer Motion.

This was built as an internship technical assessment. The brief was to build something combining computer vision, real-time rendering, and a clean UI without a backend.

Everything runs client-side. No webcam frames, landmark coordinates, or telemetry leave your device. Gesture classification uses geometric rules rather than continuous neural network inference, which keeps the frame rate stable on average hardware.

---

## Live demo



https://github.com/user-attachments/assets/c6746714-af08-433a-8468-8c4cb8328bc0



https://github.com/user-attachments/assets/86f875ac-7d4a-4a2f-985a-eb325bb2a5f0





Camera access via `getUserMedia` only works in secure contexts — `localhost` or an `https://` domain. Double-clicking the HTML file won't work.

```bash
npm run dev
```

Open `http://localhost:5173` in Chrome or Edge.

---

## Features

- Real-time webcam capture with camera permission handling
- MediaPipe Holistic tracking — 33 pose keypoints and 21 hand joints per hand
- 8 gestures (see table below)
- Floating emoji reactions animated with Framer Motion
- Live skeleton overlay with a sidebar toggle
- Motion intensity meter reflecting actual landmark velocity per frame
- FPS counter, person detection indicator, timestamped gesture history
- No backend

---

## Gestures supported

| Emoji | Gesture | How to trigger |
| :---: | :--- | :--- |
| 🎉 | Celebrate | Raise both wrists above shoulder level with at least one hand in a fist |
| ❤️ | Heart | Bring both index fingertips and both thumb tips close together at center frame |
| 👍 | Thumbs up | Extend thumb straight up, curl index through pinky |
| 👎 | Thumbs down | Extend thumb straight down, curl index through pinky |
| 😡 | Angry | Shake your head horizontally back and forth rapidly |
| 😱 | Scared | Lean back quickly from the camera |
| 🤘 | Lasers | Extend index and pinky upward, curl middle and ring |
| ✌️ | Peace | Extend index and middle in a V, curl ring and pinky |

---

## Tech stack

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| React | `^18.3.1` | UI and component state |
| Vite | `^5.4.2` | Dev server and bundler |
| MediaPipe Holistic | `0.5.1675471629` | Landmark tracking across face, pose, and hands |
| MediaPipe Camera Utils | `0.3.1640029074` | Feeds camera frames into MediaPipe |
| Framer Motion | `^11.3.19` | Emote bubble animations |
| Tailwind CSS | `^3.4.10` | Utility CSS |
| Vitest | `^2.0.5` | Unit testing |

---

## Architecture

Three layers, each with a distinct job.

**Utils** (`src/utils/`) are pure functions with no React imports. `gestureClassifier.js` runs the geometric checks, `drawSkeleton.js` draws onto a 2D canvas context, `constants.js` holds thresholds and gesture metadata. Because nothing here touches React, it can be tested with Vitest directly — no browser, no mounted components.

**Hooks** (`src/hooks/`) handle hardware access and stateful loops. `useCamera.js` manages the webcam stream lifecycle, `useMediaPipe.js` drives the async processing loop, `useGestureDetector.js` feeds per-frame landmark history into the classifier and returns the current gesture.

**Components** (`src/components/`) handle rendering. `CameraFeed.jsx` stacks the video and canvas overlays, `EmoteLayer.jsx` manages active emoji bubbles, `Sidebar.jsx` renders stats and controls, `GestureDisplay.jsx` shows the current gesture card.

The separation matters mostly for testability. Classification logic that doesn't import React can be unit tested without a browser environment, which is where most of the interesting edge cases live.

---

## Project structure

```
ripple/
├── public/
├── src/
│   ├── components/
│   │   ├── CameraFeed.jsx
│   │   ├── EmoteLayer.jsx
│   │   ├── GestureDisplay.jsx
│   │   ├── LaserEffect.jsx
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
├── index.html
├── IMPLEMENTATION_PLAN.md
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
├── vitest.config.js
├── package.json
└── README.md
```

---

## Getting started

**Prerequisites:** Node.js 18+, Chrome 110+ or Edge 110+, a webcam.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## Running tests

```bash
npm test          # headless
npm run test:ui   # interactive UI
```

The test file is `src/tests/gestureClassifier.test.js`. Four suites:

- `detectWave` — horizontal wrist oscillations are counted as direction reversals correctly
- `detectThumbsUp` — thumb-up with curled fingers passes; thumb-down fails
- `detectJump` — sudden upward shoulder displacement between frames triggers correctly
- `classifyGesture priority` — when multiple gestures pass simultaneously, priority order resolves correctly

---

## How gesture detection works

Ripple uses rule-based heuristics rather than a trained model. Running continuous TensorFlow inference in the browser on every frame locks the main thread and drops the frame rate on average hardware. MediaPipe handles the landmark tracking — gesture classification is then just fast geometric checks on those coordinates, which keeps things at a stable 30fps.

The checks are direct. Jump detection compares the Y position of the shoulder midpoint between the current and previous frame — a sudden decrease means the person moved upward. Head shakes are detected by counting horizontal reversals of nose landmark `0` over a rolling window. Hand signs like thumbs up, peace, and rock-on compare each fingertip's Y coordinate against its corresponding MCP knuckle to determine if the finger is extended or curled.

One thing worth noting on the state side: per-frame landmark history lives in `useRef`, not `useState`. If it were in state, every incoming frame would trigger a React re-render — 30 times a second. The ref updates silently each frame, and state only changes when the classified gesture actually transitions.

---

## Known limitations

- Detection degrades in poor lighting
- Only works reliably with one person in frame — multiple people cause landmark jumping
- The heuristics assume a frame rate above ~15fps; heavy system load will affect accuracy
- Celebrate and Jump require the user's shoulders and wrists to be visible
- Firefox supports MediaPipe WASM but runs slower than Chrome or Edge due to WebAssembly threading differences

---

## Deployment

MediaPipe uses `SharedArrayBuffer` internally, which browsers require two HTTP headers to allow:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Vite sets these automatically in dev. For production:

**Vercel (`vercel.json`):**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
      ]
    }
  ]
}
```

**Netlify (`netlify.toml`):**
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Cross-Origin-Opener-Policy = "same-origin"
    Cross-Origin-Embedder-Policy = "require-corp"
```

> **GitHub Pages** doesn't support custom COOP/COEP headers. You'll need a Service Worker wrapper like `coi-serviceworker` to mock the secure context.
