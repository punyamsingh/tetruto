# Step 7: Refactor — Split Game.js Into Modules

## Goal
Break the monolithic 618+ line `Game.js` into focused modules: constants, collision utils, pathfinding utils, sound utils, and custom hooks. Game.js becomes a thin rendering shell.

---

## New Files to Create

1. `src/constants.js`
2. `src/utils/collision.js`
3. `src/utils/pathfinding.js`
4. `src/utils/sound.js`
5. `src/hooks/useMotionControl.js`
6. `src/hooks/useGameState.js`

## Files to Modify

1. `src/components/Game.js` (major rewrite)

---

## File 1: `src/constants.js`

```js
// Game element sizes (all in px)
export const BLOCK_SIZE = 25;
export const HOLE_SIZE = 30;
export const MINE_SIZE = 15;
export const BARRIER_SIZE = 7;
export const TRAJECTORY_DOT_SIZE = 7;

// Collision radii (half of visual size)
export const BARRIER_HALF = 4;
export const MINE_HALF = 8;

// Pathfinding
export const PATH_CELL = 25;
export const MAX_MINES = 10;

// Movement
export const SENSITIVITY = 10;
export const BASE_FRAME_MS = 16.67;

// Timing (ms)
export const SCORE_COOLDOWN = 1000;
export const MINE_HIT_DEBOUNCE = 1500;
export const TRAJECTORY_SAMPLE_INTERVAL = 100;
export const LOADING_DURATION = 1500;
export const OVERLAY_COUNTDOWN_STEP = 1000;
export const OVERLAY_TOTAL_DURATION = 3000;
export const DROP_ANIMATION_DURATION = 600;
export const SCORE_FLASH_DURATION = 500;
export const BLAST_FLASH_DURATION = 700;

// Scoring
export const OVERLAP_THRESHOLD = 2;   // percentage
export const LEVEL_2_THRESHOLD = 3;   // score to reach level 2
export const LEVEL_3_THRESHOLD = 10;  // score to reach level 3
export const INITIAL_MINE_COUNT = 3;

// Level rules text
export const LEVEL_RULES = {
    1: 'Tilt to guide the block into the red hole',
    2: 'Your path hardens into walls — don\'t get trapped',
    3: 'Mines lurk everywhere — one touch and it all resets',
};

// Trajectory cap
export const MAX_TRAJECTORY_POINTS = 500;
```

---

## File 2: `src/utils/collision.js`

Pure functions — no React, no DOM, no refs. Takes coordinates as arguments.

```js
import { BARRIER_HALF, MINE_HALF, BLOCK_SIZE } from '../constants';

/**
 * Check if a block at (leftPct, topPct) collides with any barriers.
 * @param {number} leftPct - Block left position as percentage (0-100)
 * @param {number} topPct - Block top position as percentage (0-100)
 * @param {Array<{x: number, y: number}>} barriers - Barrier positions in px
 * @param {number} viewW - Viewport width in px
 * @param {number} viewH - Viewport height in px
 * @returns {boolean}
 */
export const wouldCollideWithBarriers = (leftPct, topPct, barriers, viewW, viewH) => {
    if (!barriers.length) return false;
    const blockLeft = (leftPct / 100) * viewW;
    const blockTop = (topPct / 100) * viewH;
    const blockRight = blockLeft + BLOCK_SIZE;
    const blockBottom = blockTop + BLOCK_SIZE;

    for (const b of barriers) {
        if (
            blockRight > b.x - BARRIER_HALF &&
            blockLeft < b.x + BARRIER_HALF &&
            blockBottom > b.y - BARRIER_HALF &&
            blockTop < b.y + BARRIER_HALF
        ) return true;
    }
    return false;
};

/**
 * Check if a block collides with any mines from the given list.
 */
export const wouldCollideWithMinesList = (leftPct, topPct, mineList, viewW, viewH) => {
    if (!mineList.length) return false;
    const blockLeft = (leftPct / 100) * viewW;
    const blockTop = (topPct / 100) * viewH;
    const blockRight = blockLeft + BLOCK_SIZE;
    const blockBottom = blockTop + BLOCK_SIZE;

    for (const m of mineList) {
        if (
            blockRight > m.x - MINE_HALF &&
            blockLeft < m.x + MINE_HALF &&
            blockBottom > m.y - MINE_HALF &&
            blockTop < m.y + MINE_HALF
        ) return true;
    }
    return false;
};

/**
 * Check if a hole at (leftPx, topPx) collides with barriers.
 */
export const holeCollidesWithBarriers = (leftPx, topPx, barriers, holeSize) => {
    if (!barriers.length) return false;
    const holeRight = leftPx + holeSize;
    const holeBottom = topPx + holeSize;
    for (const b of barriers) {
        if (
            holeRight > b.x - BARRIER_HALF &&
            leftPx < b.x + BARRIER_HALF &&
            holeBottom > b.y - BARRIER_HALF &&
            topPx < b.y + BARRIER_HALF
        ) return true;
    }
    return false;
};

/**
 * Check if block and hole have any overlap (ref-based, no DOM).
 */
export const hasOverlap = (blockPos, holePos, viewW, viewH) => {
    if (!holePos || !holePos.left) return false;
    const blockLeft = (blockPos.left / 100) * viewW;
    const blockTop = (blockPos.top / 100) * viewH;
    const blockRight = blockLeft + BLOCK_SIZE;
    const blockBottom = blockTop + BLOCK_SIZE;

    const holeLeft = parseFloat(holePos.left);
    const holeTop = parseFloat(holePos.top);
    const holeRight = holeLeft + 30;
    const holeBottom = holeTop + 30;

    return (
        blockRight > holeLeft &&
        blockLeft < holeRight &&
        blockBottom > holeTop &&
        blockTop < holeBottom
    );
};

/**
 * Calculate overlap percentage between block and hole (ref-based, no DOM).
 */
export const calculateOverlapPercentage = (blockPos, holePos, viewW, viewH) => {
    if (!holePos || !holePos.left) return 0;
    const blockLeft = (blockPos.left / 100) * viewW;
    const blockTop = (blockPos.top / 100) * viewH;
    const blockRight = blockLeft + BLOCK_SIZE;
    const blockBottom = blockTop + BLOCK_SIZE;

    const holeLeft = parseFloat(holePos.left);
    const holeTop = parseFloat(holePos.top);
    const holeRight = holeLeft + 30;
    const holeBottom = holeTop + 30;

    const overlapWidth = Math.max(0, Math.min(blockRight, holeRight) - Math.max(blockLeft, holeLeft));
    const overlapHeight = Math.max(0, Math.min(blockBottom, holeBottom) - Math.max(blockTop, holeTop));

    const overlapArea = overlapWidth * overlapHeight;
    const blockArea = BLOCK_SIZE * BLOCK_SIZE;

    return (overlapArea / blockArea) * 100;
};
```

---

## File 3: `src/utils/pathfinding.js`

```js
import { BARRIER_HALF, MINE_HALF, BLOCK_SIZE, PATH_CELL } from '../constants';

/**
 * BFS: Can the block reach the hole given current mines and barriers?
 */
export const hasPathToHole = (blockPos, currentHoleStyles, currentMines, currentBarriers, viewW, viewH) => {
    const cols = Math.ceil(viewW / PATH_CELL);
    const rows = Math.ceil(viewH / PATH_CELL);

    const startPxX = (blockPos.left / 100) * viewW;
    const startPxY = (blockPos.top / 100) * viewH;
    const holePxX = parseFloat(currentHoleStyles.left);
    const holePxY = parseFloat(currentHoleStyles.top);

    const startCol = Math.max(0, Math.min(cols - 1, Math.floor(startPxX / PATH_CELL)));
    const startRow = Math.max(0, Math.min(rows - 1, Math.floor(startPxY / PATH_CELL)));
    const goalCol = Math.max(0, Math.min(cols - 1, Math.floor(holePxX / PATH_CELL)));
    const goalRow = Math.max(0, Math.min(rows - 1, Math.floor(holePxY / PATH_CELL)));

    const isBlocked = (col, row) => {
        const bLeft = col * PATH_CELL;
        const bTop = row * PATH_CELL;
        const bRight = bLeft + BLOCK_SIZE;
        const bBottom = bTop + BLOCK_SIZE;
        for (const m of currentMines) {
            if (bRight > m.x - MINE_HALF && bLeft < m.x + MINE_HALF &&
                bBottom > m.y - MINE_HALF && bTop < m.y + MINE_HALF) return true;
        }
        for (const b of currentBarriers) {
            if (bRight > b.x - BARRIER_HALF && bLeft < b.x + BARRIER_HALF &&
                bBottom > b.y - BARRIER_HALF && bTop < b.y + BARRIER_HALF) return true;
        }
        return false;
    };

    if (isBlocked(startCol, startRow)) return false;

    const visited = new Set();
    const queue = [[startCol, startRow]];
    visited.add(`${startCol},${startRow}`);

    const goalTolerance = Math.ceil(30 / PATH_CELL); // hole size / cell size

    while (queue.length > 0) {
        const [col, row] = queue.shift();
        if (Math.abs(col - goalCol) <= goalTolerance && Math.abs(row - goalRow) <= goalTolerance) return true;
        // 8-directional movement
        for (const [dc, dr] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]) {
            const nc = col + dc;
            const nr = row + dr;
            if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
            const key = `${nc},${nr}`;
            if (visited.has(key)) continue;
            if (isBlocked(nc, nr)) continue;
            visited.add(key);
            queue.push([nc, nr]);
        }
    }
    return false;
};

/**
 * Place `count` mines, avoiding block/hole/each-other and guaranteeing a path.
 */
export const placeMines = (count, blockPos, currentHoleStyles, currentBarriers, viewW, viewH) => {
    const margin = MINE_HALF + 5;
    const blockPxX = (blockPos.left / 100) * viewW;
    const blockPxY = (blockPos.top / 100) * viewH;
    const holePxX = parseFloat(currentHoleStyles.left);
    const holePxY = parseFloat(currentHoleStyles.top);
    const buf = MINE_HALF + 20;

    const placed = [];

    for (let i = 0; i < count; i++) {
        for (let attempt = 0; attempt < 200; attempt++) {
            const x = margin + Math.random() * (viewW - 2 * margin);
            const y = margin + Math.random() * (viewH - 2 * margin);

            if (x > blockPxX - buf && x < blockPxX + BLOCK_SIZE + buf &&
                y > blockPxY - buf && y < blockPxY + BLOCK_SIZE + buf) continue;

            if (x > holePxX - buf && x < holePxX + 30 + buf &&
                y > holePxY - buf && y < holePxY + 30 + buf) continue;

            let overlaps = false;
            for (const m of placed) {
                if (Math.abs(x - m.x) < MINE_HALF * 3.5 &&
                    Math.abs(y - m.y) < MINE_HALF * 3.5) { overlaps = true; break; }
            }
            if (overlaps) continue;

            const testMines = [...placed, { x, y }];
            if (!hasPathToHole(blockPos, currentHoleStyles, testMines, currentBarriers, viewW, viewH)) continue;

            placed.push({ x, y, id: Date.now() + i * 1000 + attempt });
            break;
        }
    }
    return placed;
};
```

---

## File 4: `src/utils/sound.js`

Move the sound functions from step 6 into this file. Export each function.

```js
let audioCtx = null;
const getAudioCtx = () => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
};

export const playTone = (freq, duration, type = 'sine', volume = 0.15) => {
    try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration / 1000);
    } catch (e) {}
};

export const playScoreSound = () => {
    try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
};

export const playLevelUpSound = () => {
    try {
        const ctx = getAudioCtx();
        [440, 660, 880].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
            gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.12);
            osc.stop(ctx.currentTime + i * 0.12 + 0.15);
        });
    } catch (e) {}
};

export const playBlastSound = () => {
    try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
};

export const playTickSound = (high = false) => {
    playTone(high ? 900 : 600, high ? 120 : 80, 'sine', 0.1);
};
```

---

## File 5: `src/hooks/useMotionControl.js`

This hook encapsulates the `deviceorientation` event listener, delta-time normalization, and RAF loop.

```js
import { useEffect, useRef } from 'react';
import { SENSITIVITY, BASE_FRAME_MS } from '../constants';
import { wouldCollideWithBarriers, wouldCollideWithMines } from '../utils/collision';

/**
 * Hook that manages device orientation input and block movement.
 *
 * @param {Object} params
 * @param {React.RefObject} params.currentPosRef - Current block position {left, top} in %
 * @param {React.RefObject} params.overlayActiveRef - Whether overlay is showing
 * @param {React.RefObject} params.isPausedRef - Whether game is paused
 * @param {React.RefObject} params.gameOverRef - Whether game over screen is showing
 * @param {React.RefObject} params.barrierActiveRef - Whether barriers are active
 * @param {React.RefObject} params.hardBarriersRef - Array of barrier positions
 * @param {React.RefObject} params.minesRef - Array of mine positions
 * @param {Function} params.onPositionUpdate - Callback with {left, top} in %
 * @returns {void}
 */
export const useMotionControl = ({
    currentPosRef,
    overlayActiveRef,
    isPausedRef,
    gameOverRef,
    barrierActiveRef,
    hardBarriersRef,
    minesRef,
    onPositionUpdate,
}) => {
    useEffect(() => {
        let lastEventTime = 0;
        let pendingPosition = null;
        let rafId = null;

        const renderFrame = () => {
            if (pendingPosition) {
                onPositionUpdate(pendingPosition);
                pendingPosition = null;
            }
            rafId = requestAnimationFrame(renderFrame);
        };
        rafId = requestAnimationFrame(renderFrame);

        const handleOrientation = (event) => {
            if (overlayActiveRef.current || isPausedRef.current || gameOverRef.current) return;

            const now = performance.now();
            let deltaFactor = 1;
            if (lastEventTime > 0) {
                const deltaMs = Math.min(now - lastEventTime, 100);
                deltaFactor = deltaMs / BASE_FRAME_MS;
            }
            lastEventTime = now;

            const x = (event.gamma / SENSITIVITY) * deltaFactor;
            const y = (event.beta / SENSITIVITY) * deltaFactor;

            const prev = currentPosRef.current;
            const viewW = window.innerWidth;
            const viewH = window.innerHeight;

            let newLeft = Math.max(0, Math.min(100, prev.left + x));
            let newTop = Math.max(0, Math.min(100, prev.top + y));

            if (barrierActiveRef.current) {
                const barriers = hardBarriersRef.current;
                if (wouldCollideWithBarriers(newLeft, prev.top, barriers, viewW, viewH)) newLeft = prev.left;
                if (wouldCollideWithBarriers(prev.left, newTop, barriers, viewW, viewH)) newTop = prev.top;
                if (wouldCollideWithBarriers(newLeft, newTop, barriers, viewW, viewH)) {
                    newLeft = prev.left;
                    newTop = prev.top;
                }
            }

            currentPosRef.current = { left: newLeft, top: newTop };
            pendingPosition = { left: newLeft, top: newTop };
        };

        window.addEventListener('deviceorientation', handleOrientation);

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
};
```

**Note:** The hook only handles movement. Scoring, trajectory, and mine collision checks remain in Game.js (or a useGameLogic hook) because they modify game state. Keeping the motion hook focused makes it testable.

---

## File 6: `src/hooks/useGameState.js`

This hook manages the synchronized state + ref pattern.

```js
import { useState, useRef, useEffect } from 'react';
import { INITIAL_MINE_COUNT } from '../constants';

/**
 * Hook that provides game state with both React state and refs for event handler access.
 */
export const useGameState = () => {
    const [loading, setLoading] = useState(true);
    const [score, setScore] = useState(0);
    const [shapeStyles, setShapeStyles] = useState({ left: '40%', top: '40%' });
    const [holeStyles, setHoleStyles] = useState({ left: '60%', top: '60%' });
    const [level, setLevel] = useState(1);
    const [trajectoryPoints, setTrajectoryPoints] = useState([]);
    const [hardBarriers, setHardBarriers] = useState([]);
    const [mines, setMines] = useState([]);
    const [showOverlay, setShowOverlay] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [overlayLevel, setOverlayLevel] = useState(1);
    const [gameOverData, setGameOverData] = useState(null);

    // Refs mirror state for event handler access
    const scoreRef = useRef(0);
    const levelRef = useRef(1);
    const currentPosRef = useRef({ left: 40, top: 40 });
    const trajectoryRef = useRef([]);
    const hardBarriersRef = useRef([]);
    const minesRef = useRef([]);
    const mineCountRef = useRef(INITIAL_MINE_COUNT);
    const barrierActiveRef = useRef(false);
    const barrierScoreCountRef = useRef(0);
    const lastTrajectoryTimeRef = useRef(0);
    const overlayActiveRef = useRef(false);
    const overlayTimersRef = useRef([]);
    const highScoreRef = useRef(0);
    const holeStylesRef = useRef(null);
    const lastMineHitTimeRef = useRef(0);
    const isPausedRef = useRef(false);
    const gameOverRef = useRef(null);

    // Load high score on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('tetruto_high_score');
            if (saved !== null) {
                const val = parseInt(saved, 10);
                if (!isNaN(val) && val > 0) highScoreRef.current = val;
            }
        } catch (e) {}
    }, []);

    return {
        // State
        loading, setLoading,
        score, setScore,
        shapeStyles, setShapeStyles,
        holeStyles, setHoleStyles,
        level, setLevel,
        trajectoryPoints, setTrajectoryPoints,
        hardBarriers, setHardBarriers,
        mines, setMines,
        showOverlay, setShowOverlay,
        countdown, setCountdown,
        overlayLevel, setOverlayLevel,
        gameOverData, setGameOverData,
        // Refs
        scoreRef, levelRef, currentPosRef,
        trajectoryRef, hardBarriersRef, minesRef,
        mineCountRef, barrierActiveRef, barrierScoreCountRef,
        lastTrajectoryTimeRef, overlayActiveRef, overlayTimersRef,
        highScoreRef, holeStylesRef, lastMineHitTimeRef,
        isPausedRef, gameOverRef,
    };
};
```

---

## Modified `src/components/Game.js`

After extracting, Game.js becomes a rendering component that:
1. Calls `useGameState()` for all state/refs
2. Calls `useMotionControl()` for gyro input
3. Contains game logic functions that use the extracted utils
4. Renders JSX

**The component shrinks from ~618 lines to ~250-300 lines.** The game logic (scoring, level transitions, mine blast) stays in Game.js since it orchestrates multiple state changes, but the pure computation is extracted to utils.

**Import changes at the top of Game.js:**
```js
import React, { useEffect, useRef } from 'react';
import { BeatLoader } from 'react-spinners';
import styles from '../styles/game.module.css';
import { useGameState } from '../hooks/useGameState';
import { useMotionControl } from '../hooks/useMotionControl';
import { hasOverlap, calculateOverlapPercentage, wouldCollideWithMinesList } from '../utils/collision';
import { placeMines } from '../utils/pathfinding';
import { playScoreSound, playLevelUpSound, playBlastSound, playTickSound } from '../utils/sound';
import {
    LEVEL_RULES, BLOCK_SIZE, HOLE_SIZE, OVERLAP_THRESHOLD,
    SCORE_COOLDOWN, MINE_HIT_DEBOUNCE, TRAJECTORY_SAMPLE_INTERVAL,
    LEVEL_2_THRESHOLD, LEVEL_3_THRESHOLD, INITIAL_MINE_COUNT,
    MAX_MINES, MAX_TRAJECTORY_POINTS, LOADING_DURATION,
    SCORE_FLASH_DURATION, BLAST_FLASH_DURATION,
} from '../constants';
```

---

## Testing

1. **All features still work identically** — this is a pure refactor, no behavior changes
2. **Imports resolve correctly** — verify all util functions are accessible
3. **Game.js is significantly shorter** — target ~250-300 lines
4. **Utils are independently testable** — can import collision.js in a test without React
5. **Build succeeds** — `npm run build` passes
6. **No circular dependencies** — constants → utils → hooks → Game.js (one direction)
