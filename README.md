# TETRUTO

> A mobile-only precision game inspired by Tetris — but forget the keyboard. Here, your hands *are* the controller.

Built for fun by [@punyamsingh](https://github.com/punyamsingh) and [@TejaswiMN](https://github.com/TejaswiMN).

---

## What is it?

TETRUTO takes the spirit of Tetris — fitting shapes into the right spots — and flips the input on its head. Instead of pressing keys, you **tilt your phone** to move a glowing white block across the screen and land it into a red target hole.

No buttons. No taps. Just you, gravity, and your steady hands.

---

## How to Play

1. Open the game on your **mobile device**
2. Hold your phone naturally, like you're reading it
3. **Tilt left/right** to move the block horizontally
4. **Tilt forward/back** to move it vertically
5. Guide the white block into the red glowing square
6. Score when at least **20% of the block overlaps** the target
7. The target jumps to a new random position — do it again

The screen flashes green on every successful score. Feel the rush.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 |
| UI | React 18 + CSS Modules |
| Motion Input | Web Device Orientation API |
| Animations | CSS + react-spinners |

---

## Controls

| Action | How |
|---|---|
| Move block left/right | Tilt phone left/right |
| Move block up/down | Tilt phone forward/backward |
| Score a point | Overlap block with red target (>20%) |

---

## Game Design

- **Shape**: 50×50px white glowing block
- **Target**: 60×60px red glowing square, randomly repositioned on each score
- **Sensitivity**: Tilt values divided by 10 for smooth, controlled movement
- **Cooldown**: 1 second between successive scores (no spamming!)
- **Collision**: Calculated using bounding box intersection math — partial overlaps count

---

## Running Locally

```bash
npm install
npm run dev
```

Then open on your phone (or use browser DevTools device emulation).

> **Note**: Device orientation requires a real mobile device or browser emulation with motion sensors enabled. It won't work on a regular desktop browser.

---

## Project Structure

```
src/
├── components/
│   └── Game.js          # Core game loop and motion controls
├── pages/
│   └── index.js         # HUD overlay (level + score)
└── styles/
    ├── game.module.css   # Game canvas styles
    ├── Home.module.css   # HUD styles
    └── globals.css       # Global theme (dark mode, CSS vars)
```

---

## Why TETRUTO?

Classic Tetris is about fitting blocks into the right places with precision and timing. TETRUTO keeps that core idea but strips away the grid, the queue, and the buttons — leaving only the purest challenge: **move the block, hit the hole**. The name is a nod to Tetris, remixed into something new.

---

*Made for fun. Play on mobile. Tilt responsibly.*
