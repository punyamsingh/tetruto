# Gameplay Guide

## The Idea

TETRUTO is a precision game. The name is a riff on Tetris — and like Tetris, the whole game is about one thing: **getting the block where it needs to go**.

The twist? You don't press anything. You tilt your phone. Your device becomes the controller, and your hands become the joystick.

---

## The Loop

Every round looks like this:

```
Game starts → Block appears at center → Red target appears somewhere random
     ↓
You tilt your phone to move the block toward the target
     ↓
Block overlaps the target by more than 20% → SCORE
     ↓
Green flash → Target jumps to a new random position → Repeat
```

Simple. But harder than it sounds.

---

## Controls

TETRUTO uses your device's **gyroscope and accelerometer** — no touch, no buttons.

| Movement | How to do it |
|---|---|
| Move left | Tilt phone to the left |
| Move right | Tilt phone to the right |
| Move up | Tilt phone backward (top away from you) |
| Move down | Tilt phone forward (top toward you) |

Hold your phone like you're reading a message — portrait mode, naturally in your hands. Small, deliberate tilts work better than big swings.

---

## Scoring

You score a point when:

- The white block **overlaps the red target** by at least **20%**
- At least **1 second has passed** since your last score (cooldown)

When you score:
- The screen flashes **green** for half a second
- The block resets to the center
- The red target jumps to a new random position

---

## Tips

**Start slow.** The block moves proportionally to how much you tilt. Tiny adjustments beat wild swings every time.

**Use the cooldown.** After scoring, you have 1 second before the next point is possible. Use that moment to read where the new target spawned before chasing it.

**Anchor your elbows.** Holding your arms out with no support makes steady tilting hard. Tuck your elbows in, or rest on a surface for better control.

**20% is not a lot.** You don't need to perfectly center the block on the target. Just get a corner in — that's enough.

---

## Visual Guide

```
┌─────────────────────────────────┐
│  TETRUTO          LVL 1  SCORE 3│  ← HUD (always visible)
│                                 │
│                                 │
│        ┌──────┐                 │
│        │      │  ← RED TARGET   │
│        └──────┘   (60×60px)     │
│                                 │
│  ■                              │  ← WHITE BLOCK (50×50px)
│  (you are here)                 │
│                                 │
└─────────────────────────────────┘
```

The block is slightly smaller than the target — by design. You have 10px of wiggle room on each side. Use it.

---

## What's Coming

The level system is wired up but not fully implemented yet. Future updates may include:

- Speed increases per level (faster block response)
- Smaller targets at higher levels
- Time-based scoring
- Obstacles

For now: pure, unadulterated block-tilting.
