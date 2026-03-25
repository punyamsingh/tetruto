# TETRUTO Improvement Plan — Master Document

## Overview

9 self-contained implementation steps. Each step has its own doc (`docs/step-X.md`) containing every file path, every code change, and testing instructions — zero external context needed.

---

## Step 1: Fix Scoring + Halve Element Sizes
**Doc:** `docs/step-1-scoring-and-sizes.md`
**Files changed:** `Game.js`, `game.module.css`
**Summary:**
- Change overlap threshold from `> 10` to `> 2` (line 355 of Game.js)
- Fix `isInsideHole()` — currently requires FULL containment, change to ANY overlap (lines 533-546)
- Halve all element sizes: block 50→25, hole 60→30, mine 30→15, barrier 14→7, trajectory 14→7
- Update all collision constants: `BARRIER_HALF` 7→4, `MINE_HALF` 15→8
- Update center offsets in trajectory tracking (25→13), BFS block size refs (50→25), buffer zones
- Update `randomHolePosition` and `safeHolePosition` margins (70→35)
- Update `holeCollidesWithBarriers` hole size (60→30)
- Update mine placement block/hole buffer (50→25, 60→30)
- Update CSS for `.shape`, `.hole`, `.trajectoryDot`, `.hardBarrier`, `.mine`

---

## Step 2: Delta-Time Movement Normalization
**Doc:** `docs/step-2-delta-time-movement.md`
**Files changed:** `Game.js`
**Summary:**
- Add `lastEventTime` tracking in the `deviceorientation` handler
- Calculate `deltaTime` between events, normalize to 16.67ms (60fps baseline)
- Scale movement: `position += (tilt / sensitivity) * deltaTimeFactor`
- Add `requestAnimationFrame` batching so DOM updates sync to display refresh
- Ensures identical feel on devices firing events at 10Hz vs 100Hz

---

## Step 3: Pause Menu + Game Over Screen
**Doc:** `docs/step-3-pause-and-gameover.md`
**Files changed:** `Game.js`, `game.module.css`, `index.js`, `Home.module.css`
**Summary:**
- Add game states: `PLAYING`, `PAUSED`, `GAME_OVER` (new state variable)
- Add pause button in HUD (top-right, small, semi-transparent)
- Pause modal: Resume + Restart buttons, blurred backdrop
- Game-over screen on mine blast: shows final score, best score, Restart button
- Freeze gyro input + timers when paused
- Wire pause button through `index.js` → `Game.js` via callback

---

## Step 4: Cap Mine Count + Fix Pathfinding
**Doc:** `docs/step-4-mines-and-pathfinding.md`
**Files changed:** `Game.js`
**Summary:**
- Cap `mineCountRef.current` at 10 (line 408)
- Fix BFS grid cell size: `PATH_CELL` 20→25 (to better match 25px block)
- Add diagonal movement to BFS (4-directional → 8-directional)
- Make goal tolerance explicit: `Math.ceil(30 / PATH_CELL)` instead of hardcoded 3
- Fix `isBlocked` block size from 50→25

---

## Step 5: Performance — Cache DOM, RAF, Trajectory Cap
**Doc:** `docs/step-5-performance.md`
**Files changed:** `Game.js`, `game.module.css`
**Summary:**
- Remove `getBoundingClientRect()` from `isInsideHole()` and `calculateOverlapPercentage()` — compute positions from refs instead
- Delete DOM queries from hot path entirely
- Cap trajectory array at 500 points (drop oldest)
- Add `will-change: transform` to `.shape`, `.hole`, `.trajectoryDot`, `.hardBarrier`, `.mine`
- Consolidate position rendering into RAF loop (if not done in step 2)

---

## Step 6: Sound Effects
**Doc:** `docs/step-6-sound-effects.md`
**Files changed:** `Game.js`, `game.module.css`, `index.js`, `Home.module.css`
**New dependency:** `howler` (or pure Web Audio API)
**Summary:**
- Create sound utility using Web Audio API (no external dependency — keep it lean)
- Generate tones programmatically: score ding, level-up ascending, mine blast, countdown beep
- Add mute toggle button near pause button in HUD
- Persist mute preference in localStorage
- Trigger sounds at: scoring (line ~358), level-up (lines ~374,383), mine blast (line ~500), countdown (lines ~249-251)

---

## Step 7: Refactor — Split Game.js Into Modules
**Doc:** `docs/step-7-refactor.md`
**Files changed:** `Game.js` (major refactor)
**New files:**
- `src/constants.js` — all magic numbers
- `src/hooks/useMotionControl.js` — deviceorientation + movement
- `src/hooks/useGameState.js` — score, level, refs management
- `src/utils/collision.js` — barrier/mine/hole collision functions
- `src/utils/pathfinding.js` — BFS + mine placement
- `src/utils/sound.js` — audio utilities (from step 6)
**Summary:**
- Extract constants: sizes, sensitivities, thresholds, timing
- Extract collision functions (pure functions taking params, no refs)
- Extract BFS pathfinding (pure function)
- Create custom hooks for motion control and game state
- Game.js becomes ~150 lines of rendering + hook wiring

---

## Step 8: Add Tests
**Doc:** `docs/step-8-tests.md`
**Files changed:** `package.json` (add jest deps)
**New files:**
- `jest.config.js`
- `src/__tests__/collision.test.js`
- `src/__tests__/pathfinding.test.js`
- `src/__tests__/scoring.test.js`
- `src/__tests__/levelProgression.test.js`
**Summary:**
- Install Jest + @testing-library/react
- Unit tests for collision detection (barrier, mine, hole overlap)
- Unit tests for BFS pathfinding (path exists, blocked, diagonal)
- Unit tests for scoring logic (overlap calculation, threshold)
- Unit tests for level progression (thresholds, mine cap)
- Tests depend on step 7 refactor for importable pure functions

---

## Step 9: Accessibility
**Doc:** `docs/step-9-accessibility.md`
**Files changed:** `Game.js`, `game.module.css`, `index.js`
**Summary:**
- Add `prefers-reduced-motion` media query — disable/reduce all animations
- Add `aria-live="polite"` region for score/level announcements
- Add `role` and `aria-label` attributes to game elements
- Add `prefers-contrast` support for high-contrast mode
- Add color-blind-friendly alternative palette (optional toggle)

---

## Dependency Order

```
Step 1 (scoring + sizes) ← independent
Step 2 (delta-time)      ← independent
Step 3 (pause + gameover) ← independent
Step 4 (mines + pathfinding) ← independent
Step 5 (performance)     ← should come after steps 1-2
Step 6 (sound)           ← independent
Step 7 (refactor)        ← should come after steps 1-6
Step 8 (tests)           ← requires step 7
Step 9 (accessibility)   ← independent, but best after step 7
```

Steps 1–4 and 6 can be done in any order. Step 5 builds on size changes from step 1. Step 7 refactors everything done in 1–6. Step 8 needs step 7's module structure.

---

## File Impact Matrix

| File | Steps |
|------|-------|
| `src/components/Game.js` | 1, 2, 3, 4, 5, 6, 7, 9 |
| `src/styles/game.module.css` | 1, 3, 5, 9 |
| `src/pages/index.js` | 3, 6, 9 |
| `src/styles/Home.module.css` | 3, 6 |
| `src/styles/globals.css` | 9 |
| `package.json` | 8 |
| `src/constants.js` (new) | 7 |
| `src/hooks/useMotionControl.js` (new) | 7 |
| `src/hooks/useGameState.js` (new) | 7 |
| `src/utils/collision.js` (new) | 7 |
| `src/utils/pathfinding.js` (new) | 7 |
| `src/utils/sound.js` (new) | 7 |
| `src/__tests__/*.test.js` (new) | 8 |
