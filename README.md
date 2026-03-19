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
2. Tilt your phone to move the white block
3. Guide it into the glowing red target
4. Score when the block overlaps the target by **20% or more**
5. Target jumps to a new spot — repeat

The screen flashes green on every score.

---

## Quick Start

```bash
npm install
npm run dev
```

Open on your phone at `http://<your-ip>:3000`. Won't work on desktop — needs a real gyroscope.

---

## Documentation

| Doc | What's in it |
|---|---|
| [Gameplay Guide](docs/gameplay.md) | Controls, scoring rules, tips, game loop explained |
| [Technical Reference](docs/technical.md) | Architecture, motion API, collision math, state management |
| [Design System](docs/design.md) | Colors, typography, glow effects, UI principles |
| [Contributing](docs/contributing.md) | Setup, project structure, roadmap, how to add features |

---

## Stack

Next.js 14 · React 18 · Web Device Orientation API · CSS Modules

---

## Why TETRUTO?

Classic Tetris is about fitting blocks into the right places with precision and timing. TETRUTO keeps that core idea but strips away the grid, the queue, and the buttons — leaving only the purest challenge: **move the block, hit the hole**. The name is a nod to Tetris, remixed into something new.

---

*I made this for fun. My girlfriend came up with the name.*
