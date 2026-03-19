# Contributing

TETRUTO is a small, fun project. Contributing should feel the same way — no red tape, just make it better.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A mobile device (or browser with DevTools motion emulation)

### Setup

```bash
git clone <repo-url>
cd tetruto
npm install
npm run dev
```

The dev server runs on `http://localhost:3000`.

---

## Testing on Mobile

Device orientation requires either:

**Option A — Real device (recommended)**
Connect your phone and your laptop to the same network, then open `http://<your-laptop-ip>:3000` on your phone.

**Option B — Chrome DevTools emulation**
1. Open DevTools → More Tools → Sensors
2. Enable "Orientation" and set custom `alpha`, `beta`, `gamma` values
3. The game will respond to these simulated values

> iOS Safari requires HTTPS for `deviceorientation` events. Use a tool like `ngrok` or `localtunnel` to get a temporary HTTPS URL if needed.

---

## Project Structure

```
src/
├── components/
│   └── Game.js          # Core game logic — motion controls, collision, scoring
├── pages/
│   ├── index.js         # Page shell — HUD, state lifted from Game
│   ├── _app.js          # Global wrapper
│   └── _document.js     # HTML document — viewport meta, PWA config
└── styles/
    ├── globals.css       # CSS variables, resets
    ├── Home.module.css   # Wrapper and HUD styles
    └── game.module.css   # Shape, hole, loader styles
docs/
├── gameplay.md           # How to play
├── technical.md          # Architecture and code internals
├── design.md             # Visual design system
└── contributing.md       # This file
```

---

## Making Changes

### Tweaking game feel

Most tunable constants are at the top of `Game.js`:

```js
const sensitivity = 10;         // higher = slower block movement
const cooldownDuration = 1000;  // ms between allowed scores
```

Shape and hole sizes are in `game.module.css`:

```css
.shape { width: 50px; height: 50px; }
.hole  { width: 60px; height: 60px; }
```

The scoring threshold (20% overlap) is in `Game.js`:

```js
if (overlapPercentage > 20) { ... }
```

### Adding a new feature

1. Branch off `master`
2. Make your changes
3. Test on a real device or DevTools emulation
4. Open a PR with a short description of what you changed and why

### Styling

All styles use CSS Modules. Don't use global class names. Keep color values inside `globals.css` as CSS variables — don't hardcode hex values elsewhere.

---

## Ideas / Roadmap

Things that could be cool if someone wants to build them:

- **Difficulty scaling** — smaller target or higher sensitivity per level
- **Timer mode** — score as many as possible in 30 seconds
- **Leaderboard** — local high score storage with `localStorage`
- **Sound effects** — subtle audio feedback on score
- **Haptic feedback** — vibration on score using the Vibration API
- **Obstacles** — moving walls the block must avoid
- **Multiplayer** — two players, one device, tilt battle

---

## Code Style

- Functional React components with hooks only
- Keep logic in `Game.js`, keep presentation in `index.js`
- No TypeScript for now — keep it simple
- CSS in CSS Modules files, not inline styles (except dynamic position values)
- Commit messages: short, present tense, describe what changed

---

## Questions?

Open an issue or ping [@punyamsingh](https://github.com/punyamsingh) or [@TejaswiMN](https://github.com/TejaswiMN).
