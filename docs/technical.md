# Technical Reference

## Stack at a Glance

| Layer | Tech | Why |
|---|---|---|
| Framework | Next.js 14 | SSR, routing, fast dev setup |
| UI | React 18 | Component state management |
| Motion | Web Device Orientation API | Native gyroscope/accelerometer access |
| Styling | CSS Modules | Scoped styles, no class collisions |
| Loader | react-spinners | Quick loading animation |
| Language | JavaScript (ES6+) | Simple, no TS overhead for a fun project |

---

## Architecture

```
src/
├── components/
│   └── Game.js          # All game logic lives here
├── pages/
│   ├── index.js         # App shell + HUD
│   ├── _app.js          # Next.js app wrapper
│   └── _document.js     # HTML head (viewport meta, PWA tags)
└── styles/
    ├── globals.css       # CSS variables, resets, base theme
    ├── Home.module.css   # HUD + game wrapper
    └── game.module.css   # Shape, hole, loader styles
```

The game is intentionally minimal: one component does all the heavy lifting. No global state library, no game engine. Just React hooks and browser APIs.

---

## How Motion Controls Work

The browser's `deviceorientation` event fires continuously as the device moves. It gives three rotation angles:

| Axis | Value | Used for |
|---|---|---|
| `alpha` | 0–360° rotation around Z (compass) | Not used |
| `beta` | -180–180° tilt front/back | Vertical block movement |
| `gamma` | -90–90° tilt left/right | Horizontal block movement |

```js
// Game.js
const updatePosition = (event) => {
    const x = event.gamma / sensitivity;  // left/right tilt → horizontal move
    const y = event.beta / sensitivity;   // forward/back tilt → vertical move
    ...
};

window.addEventListener('deviceorientation', updatePosition);
```

The `sensitivity` constant (currently `10`) acts as a divisor — higher value = slower, more precise movement. Lower value = faster, harder to control.

---

## Movement Clamping

The block position is stored as percentages (not pixels), which makes it resolution-independent. Movement is clamped to `[0, 100]` so the block can't escape the screen:

```js
setShapeStyles(prevStyles => {
    const newLeft = parseFloat(prevStyles.left) + x;
    const newTop = parseFloat(prevStyles.top) + y;

    return {
        left: `${Math.max(0, Math.min(100, newLeft))}%`,
        top: `${Math.max(0, Math.min(100, newTop))}%`,
    };
});
```

---

## Collision Detection

Scoring uses two checks in sequence:

### 1. `isInsideHole()` — Coarse check

A quick bounding box check to see if the shape is fully inside the hole. This runs on every `deviceorientation` event.

```js
const isInsideHole = () => {
    const holeRect = holeElement.getBoundingClientRect();
    const shapeRect = shapeElement.getBoundingClientRect();

    return (
        shapeRect.left >= holeRect.left &&
        shapeRect.right <= holeRect.right &&
        shapeRect.top >= holeRect.top &&
        shapeRect.bottom <= holeRect.bottom
    );
};
```

### 2. `calculateOverlapPercentage()` — Fine check

If the coarse check passes, this calculates the actual percentage of the shape's area that overlaps the hole. A score is awarded when this exceeds **20%**.

```js
const overlapWidth = Math.max(0,
    Math.min(shapeRect.right, holeRect.right) - Math.max(shapeRect.left, holeRect.left)
);
const overlapHeight = Math.max(0,
    Math.min(shapeRect.bottom, holeRect.bottom) - Math.max(shapeRect.top, holeRect.top)
);

const overlapArea = overlapWidth * overlapHeight;
const shapeArea = (shapeRect.right - shapeRect.left) * (shapeRect.bottom - shapeRect.top);

return (overlapArea / shapeArea) * 100;
```

The 20% threshold makes gameplay feel forgiving without being trivial — you need to genuinely aim, not just get close.

---

## Scoring Cooldown

A 1-second cooldown prevents the same overlap from registering multiple points:

```js
const cooldownDuration = 1000;
let lastAlignmentTime = 0;

if (currentTime - lastAlignmentTime > cooldownDuration && isInsideHole()) {
    // score!
    lastAlignmentTime = currentTime;
}
```

---

## SSR Compatibility

Next.js renders components server-side first, where `window` doesn't exist. The `randomHolePosition` function and DOM queries (`getBoundingClientRect`) would crash on the server if called at module load time.

This is handled by:
- Calling `randomHolePosition()` inside a `useEffect` (client-only)
- Checking `typeof window !== 'undefined'` before DOM queries in collision functions

---

## State Management

| State | Type | Lives in | Purpose |
|---|---|---|---|
| `loading` | boolean | `Game.js` | Show/hide loading animation |
| `score` | number | `Game.js` + `index.js` | Track and display score |
| `shapeStyles` | object | `Game.js` | Block position (`left`, `top`) |
| `holeStyles` | object | `Game.js` | Target position (`left`, `top`) |
| `currentLevel` | number | `index.js` | Displayed in HUD (unused in logic) |

Score is lifted to `index.js` via the `onScoreChange` callback so the HUD can display it.

---

## Mobile PWA Setup

The game is configured to behave like a native app when added to the home screen:

```html
<!-- pages/_document.js / index.js Head -->
<meta name="viewport" content="width=device-width, initial-scale=1,
    maximum-scale=1, user-scalable=no, viewport-fit=cover" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

- Disables zoom (preserves the fullscreen feel)
- Hides the browser chrome when launched from home screen
- `viewport-fit=cover` fills the notch area on iPhones
