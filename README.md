# Ripple

A real-time gesture recognition app that triggers Apple FaceTime-style floating emoji reactions using your webcam and Google MediaPipe.

---

## Badges Row

![React](https://img.shields.io/badge/Built%20With-React--18.3.1-61DAFB?style=flat&logo=react&logoColor=black)
![MediaPipe](https://img.shields.io/badge/Powered%20by-MediaPipe--0.5.1675471629-00F?style=flat)
![Vite](https://img.shields.io/badge/Built%20With-Vite--5.4.2-646CFF?style=flat&logo=vite)

---

## Overview

Ripple is a high-performance web application designed to bring interactive, Apple FaceTime-style floating emoji reactions to the browser. By capturing your webcam feed, the application tracks body and hand landmarks in real-time, matching coordinate relationships against deterministic mathematical rules. When a valid gesture is recognized, a burst of corresponding emojis rises smoothly from the bottom of the screen, creating an engaging and playful overlay.

This project was built as part of an internship technical assessment task. The goal was to demonstrate proficiency in real-time browser-based computer vision, state-of-the-art React components, high-frame-rate rendering, and modular architecture. Ripple showcases how modern web tools can deliver complex features locally, without requiring specialized server infrastructure.

Technically, Ripple is designed with a strong focus on security and efficiency. All processing is executed fully client-side inside the user's browser, meaning no webcam frames, landmark locations, or telemetry data ever leave the local device. By utilizing optimized geometric rules rather than running constant neural network inference on the CPU, Ripple guarantees absolute user privacy while maintaining a smooth and responsive interface.

---

## Live Demo

Because browser security policies restrict webcam stream access (`getUserMedia`) to secure contexts, Ripple requires a local server (`localhost`) or a secure (`https://`) domain to run.

To launch Ripple locally and test the camera features:
```bash
npm run dev
```

---

## Features

- **Real-Time Webcam Capture**: Smooth local video acquisition with graceful permission handling.
- **MediaPipe Landmark Tracking**: Tracks 33 pose landmarks and 21 hand joints per hand to detect full upper-body postures.
- **7 Gesture Types Detected**: Built-in triggers for Heart, Thumbs Up, Thumbs Down, Lasers, Angry, Scared, and Peace.
- **FaceTime-Style Reactions**: Cascades of emojis floating upwards with physics-based horizontal drift via Framer Motion.
- **Skeleton Tracking Toggle**: Visual tracking lines overlaying landmarks in real-time with an easy sidebar toggle.
- **Motion Intensity Meter**: Taller, responsive progress bar showing normalized speed rates with purple-to-green gradients.
- **Diagnostic FPS Counter**: Real-time diagnostic monitor showing webcam frame processing speed.
- **Person Detected Indicator**: Visual card that glows green and pulses when the pose tracker locks on a user.
- **Gesture History Log**: Timestamped record of recent reactions triggered in the session.
- **Zero Server Overhead**: Run completely locally inside the browser with zero backend requirements.

---

## Gestures Supported

| Emoji | Gesture Name | How to Trigger |
| :---: | :--- | :--- |
| ❤️ | Heart | Bring both index tips close together and thumb tips close together in the center of the frame. |
| 👍 | Thumbs Up | Extend thumb straight up while index, middle, ring, and pinky fingers are curled. |
| 👎 | Thumbs Down | Extend thumb straight down while index, middle, ring, and pinky fingers are curled. |
| 😡 | Angry | Shake your head horizontally back and forth rapidly to trigger the angry emote. |
| 😱 | Scared | Lean back quickly from the camera, causing your inter-cheek face landmarks to shrink rapidly. |
| 🤘 | Lasers | Extend index and pinky fingers upward while middle and ring fingers are curled. |
| ✌️ | Peace | Extend index and middle fingers upward in a V-shape while ring and pinky fingers are curled. |

---

## Tech Stack

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| React | `^18.3.1` | Declarative rendering and frontend component state management. |
| Vite | `^5.4.2` | Fast dev server compiling and bundling assets for production. |
| MediaPipe Holistic | `0.5.1675471629` | Tracks landmark coordinates across face, pose, and hands. |
| MediaPipe Camera Utils | `0.3.1640029074` | Helper script linking camera frames to MediaPipe inputs. |
| Framer Motion | `^11.3.19` | Animates floating emote bubbles smoothly up the viewport. |
| Tailwind CSS | `^3.4.10` | Sleek modern utilities and premium color palettes. |
| Vitest | `^2.0.5` | Fast unit testing for classifier state-based rules. |

---

## Architecture

Ripple is built using a highly decoupled three-layer architecture:

1. **Utilities (Pure Logic)**: Located under `src/utils/`, this layer contains functions that have no state and do not import React. `gestureClassifier.js` performs the geometric rules checks, `drawSkeleton.js` draws lines onto a 2D canvas context, and `constants.js` defines thresholds.
2. **Hooks (Hardware & State)**: Located under `src/hooks/`, this layer coordinates active streams and loops. `useCamera.js` manages camera activation, `useMediaPipe.js` drives the async MediaPipe loop, and `useGestureDetector.js` pipes frame history lists into the classifier.
3. **Components (UI & Views)**: Located under `src/components/`, these files focus entirely on styling. `CameraFeed.jsx` aligns overlays, `EmoteLayer.jsx` manages bubbles, `Sidebar.jsx` maps diagnostics, and `GestureDisplay.jsx` renders card borders and the motion meter.

### Why This Separation Matters

Separating rules logic from UI rendering is critical for testability and performance. Because the classification logic is pure, it can be tested directly with Vitest without mocking the browser window or mounting components. Stateful loops are isolated inside reusable React hooks, ensuring that components are kept lean, maintainable, and free of heavy side effects.

---

## Project Structure

```
ripple/
├── dist/
├── node_modules/
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
├── package-lock.json
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js**: Node 18+ installed on your system.
- **Browser**: A modern browser (Chrome 110+ or Edge 110+ recommended) supporting WebAssembly.
- **Webcam**: A functional front-facing camera.

### Installation

1. Clone this repository to your local drive.
2. Open your terminal in the project directory and install the packages:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Click the URL provided in the console (typically `http://localhost:5173`) to launch Ripple in your browser.

---

## Running Tests

Ripple uses Vitest to execute assertions on gesture detection heuristics. Run the test commands in your terminal:

- Run tests in standard headless execution mode:
  ```bash
  npm test
  ```
- Run tests inside the interactive Vitest UI runner:
  ```bash
  npm run test:ui
  ```

### Test Suites Included

The unit tests in `src/tests/gestureClassifier.test.js` verify the core classification rules:
- `detectWave`: Verifies that continuous back-and-forth horizontal wrist coordinate displacements are counted as direction reversals.
- `detectThumbsUp`: Asserts that holding the thumb tip above its joint while curling the rest of the fingers passes correctly.
- `detectJump`: Verifies that a sudden upward vertical displacement of pose shoulders between frames triggers a jump reaction.
- `classifyGesture priority`: Asserts that when multiple gestures pass checks simultaneously, the rules resolve in the correct priority order.

---

## Gesture Detection Approach

Ripple uses rule-based heuristics rather than active browser neural networks for classification. Deep learning inference in the browser (such as running continuous custom TensorFlow models) degrades rendering performance on average hardware, locking the main thread and dropping the camera feed frame rate. By using MediaPipe simply to track landmarks, and evaluating these points through fast geometric rules, Ripple operates at a solid 30fps with minimal CPU overhead.

The math behind the gesture recognition translates spatial coordinate ratios to gestures. To detect a jump, the Y-displacement of the shoulder midpoint is tracked between frames; a sudden decrease indicates a upward vertical movement. Head shakes are evaluated by tracking the horizontal reversal frequency of nose landmark `1` over a rolling time window. Hand sign detectors (such as peace, rock-on, and thumbs-up) compare the coordinates of fingertips against their corresponding knuckle MCP joints to assert if a finger is extended or curled.

State management is designed around performance. Tracking per-frame landmark positions requires constant history buffering. If this history was managed using standard React `useState` triggers, the entire app component tree would re-render 30 times a second, causing massive visual lag. Instead, Ripple stores frame histories inside a React `useRef` object. The data is updated silently on every incoming frame, and the state only updates when the classification state transitions from `none` to an active gesture, preventing unnecessary re-renders.

---

## Known Limitations

- **Lighting Conditions**: Gesture detection accuracy degrades in dark or unevenly lit rooms.
- **Single Person Only**: MediaPipe Holistic is configured for single-person tracking; multiple users in the frame will cause erratic landmark jumping.
- **Frame Rate Dependance**: The heuristic calculations expect a camera frame rate above 15fps. Performance drops under heavy system load.
- **Upper Body Visibility**: Gestures such as Celebrate or Jump require the user's upper body (shoulders, wrists) to remain clearly visible in the camera viewport.
- **Browser Compatibility**: Chrome and Edge are recommended. Firefox supports MediaPipe WASM but may experience slightly lower frame rates due to WebAssembly threading differences.

---

## Deployment Notes

Because MediaPipe loads WebAssembly modules dynamically using a Web Worker pool, browsers require the page to be served in a secure context. Ripple uses `SharedArrayBuffer` for WebAssembly execution, which requires the server to send the following HTTP headers:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

Depending on your hosting provider, you must configure these headers in your build settings:

### Vercel (`vercel.json`)
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        },
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        }
      ]
    }
  ]
}
```

### Netlify (`netlify.toml`)
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Cross-Origin-Opener-Policy = "same-origin"
    Cross-Origin-Embedder-Policy = "require-corp"
```

> [!WARNING]
> Standard GitHub Pages deployments do not support custom COOP/COEP headers out of the box. Running the application on GitHub Pages requires a custom Service Worker wrapper (e.g. `coi-serviceworker`) to intercept requests and mock the secure header environment.
