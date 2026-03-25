# Step 1: Fix Scoring + Halve Element Sizes

## Goal
Make scoring easier (2% overlap threshold) and halve all game element sizes to increase playable space.

---

## Files to Modify

1. `src/components/Game.js`
2. `src/styles/game.module.css`

---

## Changes in `src/components/Game.js`

### 1.1 Update Constants (lines 16-18)

**Current code:**
```js
const BARRIER_HALF = 7;
const MINE_HALF = 15;   // collision/placement radius for mines
const PATH_CELL = 20;   // BFS grid cell size in px
```

**New code:**
```js
const BARRIER_HALF = 4;   // half of 7px barrier (was 7 for 14px)
const MINE_HALF = 8;      // half of 15px mine (was 15 for 30px)
const PATH_CELL = 20;     // BFS grid cell size in px (unchanged)
```

### 1.2 Update `randomHolePosition` — hole is now 30px (line 5-8)

**Current code:**
```js
const randomHolePosition = () => ({
    left: `${Math.floor(Math.random() * (window.innerWidth - 70))}px`,
    top: `${Math.floor(Math.random() * (window.innerHeight - 70))}px`,
});
```

**New code:**
```js
const randomHolePosition = () => ({
    left: `${Math.floor(Math.random() * (window.innerWidth - 35))}px`,
    top: `${Math.floor(Math.random() * (window.innerHeight - 35))}px`,
});
```

**Why:** Margin was 70 = 60 (hole) + 10 buffer. Now 35 = 30 (hole) + 5 buffer.

### 1.3 Update `wouldCollideWithBarriers` — block is now 25px (lines 89-109)

**Current code (lines 95-96):**
```js
        const blockRight = blockLeft + 50;
        const blockBottom = blockTop + 50;
```

**New code:**
```js
        const blockRight = blockLeft + 25;
        const blockBottom = blockTop + 25;
```

### 1.4 Update `wouldCollideWithMinesList` — block is now 25px (lines 111-128)

**Current code (lines 115-116):**
```js
        const blockRight = blockLeft + 50;
        const blockBottom = blockTop + 50;
```

**New code:**
```js
        const blockRight = blockLeft + 25;
        const blockBottom = blockTop + 25;
```

### 1.5 Update BFS `isBlocked` — block is now 25px (lines 150-164)

**Current code (lines 153-154):**
```js
            const bRight  = bLeft + 50;
            const bBottom = bTop  + 50;
```

**New code:**
```js
            const bRight  = bLeft + 25;
            const bBottom = bTop  + 25;
```

### 1.6 Update BFS goal tolerance — hole is now 30px (line 175)

**Current code:**
```js
            if (Math.abs(col - goalCol) <= 3 && Math.abs(row - goalRow) <= 3) return true;
```

**New code:**
```js
            // ±2 cells covers the 30px hole at 20px grid cells
            if (Math.abs(col - goalCol) <= 2 && Math.abs(row - goalRow) <= 2) return true;
```

### 1.7 Update `placeMines` buffer zones — block 25px, hole 30px (lines 190-235)

**Current code (line 199):**
```js
        const buf = MINE_HALF + 40;
```

**New code:**
```js
        const buf = MINE_HALF + 20;
```

**Why:** Buffer was `15 + 40 = 55px` (roughly block size + mine size). Now `8 + 20 = 28px`.

**Current code (lines 209-210) — block spawn buffer:**
```js
                if (x > blockPxX - buf && x < blockPxX + 50 + buf &&
                    y > blockPxY - buf && y < blockPxY + 50 + buf) continue;
```

**New code:**
```js
                if (x > blockPxX - buf && x < blockPxX + 25 + buf &&
                    y > blockPxY - buf && y < blockPxY + 25 + buf) continue;
```

**Current code (lines 213-214) — hole buffer:**
```js
                if (x > holePxX - buf && x < holePxX + 60 + buf &&
                    y > holePxY - buf && y < holePxY + 60 + buf) continue;
```

**New code:**
```js
                if (x > holePxX - buf && x < holePxX + 30 + buf &&
                    y > holePxY - buf && y < holePxY + 30 + buf) continue;
```

### 1.8 Update trajectory tracking center offset — block is 25px (lines 333-336)

**Current code:**
```js
                    const point = {
                        x: (newLeft / 100) * window.innerWidth  + 25,
                        y: (newTop  / 100) * window.innerHeight + 25,
                    };
```

**New code:**
```js
                    const point = {
                        x: (newLeft / 100) * window.innerWidth  + 13,
                        y: (newTop  / 100) * window.innerHeight + 13,
                    };
```

**Why:** Center of 25px block = 12.5, rounded to 13.

### 1.9 Fix `isInsideHole` — change from full containment to ANY overlap (lines 533-546)

**Current code:**
```js
    const isInsideHole = () => {
        const holeElement = document.getElementById(styles.hole);
        if (!holeElement) return false;

        const holeRect  = holeElement.getBoundingClientRect();
        const shapeRect = document.querySelector(`.${styles.shape}`).getBoundingClientRect();

        return (
            shapeRect.left   >= holeRect.left   &&
            shapeRect.right  <= holeRect.right  &&
            shapeRect.top    >= holeRect.top    &&
            shapeRect.bottom <= holeRect.bottom
        );
    };
```

**New code:**
```js
    const isInsideHole = () => {
        const holeElement = document.getElementById(styles.hole);
        if (!holeElement) return false;

        const holeRect  = holeElement.getBoundingClientRect();
        const shapeRect = document.querySelector(`.${styles.shape}`).getBoundingClientRect();

        // Check for ANY overlap (not full containment)
        return (
            shapeRect.right  > holeRect.left   &&
            shapeRect.left   < holeRect.right  &&
            shapeRect.bottom > holeRect.top    &&
            shapeRect.top    < holeRect.bottom
        );
    };
```

**Why:** Old code required block fully inside hole — contradicted the overlap% check. New code passes if there's any intersection at all, then `calculateOverlapPercentage()` does the real threshold check.

### 1.10 Change scoring threshold — 10% → 2% (line 355)

**Current code:**
```js
                if (overlapPercentage > 10) {
```

**New code:**
```js
                if (overlapPercentage > 2) {
```

### 1.11 Update `holeCollidesWithBarriers` — hole is now 30px (lines 424-440)

**Current code (lines 427-428):**
```js
        const holeRight  = leftPx + 60;
        const holeBottom = topPx  + 60;
```

**New code:**
```js
        const holeRight  = leftPx + 30;
        const holeBottom = topPx  + 30;
```

### 1.12 Update `safeHolePosition` margin — hole is 30px (lines 455-464)

**Current code (lines 457-458):**
```js
            const left = Math.floor(Math.random() * (window.innerWidth  - 70));
            const top  = Math.floor(Math.random() * (window.innerHeight - 70));
```

**New code:**
```js
            const left = Math.floor(Math.random() * (window.innerWidth  - 35));
            const top  = Math.floor(Math.random() * (window.innerHeight - 35));
```

---

## Changes in `src/styles/game.module.css`

### 1.13 Update `.shape` and `.additionalShape` — 50→25px (lines 12-18, 41-48)

**Current code (lines 12-18):**
```css
.shape,
.additionalShape,
.hole {
    width: 50px;
    height: 50px;
    position: absolute;
}
```

**New code:**
```css
.shape,
.additionalShape,
.hole {
    width: 25px;
    height: 25px;
    position: absolute;
}
```

**Current code (lines 41-48):**
```css
.additionalShape {
    width: 50px;
    height: 50px;
    background-color: #3498db;
    border-radius: 6px;
    position: absolute;
    box-shadow: 0 0 12px rgba(52, 152, 219, 0.7);
}
```

**New code:**
```css
.additionalShape {
    width: 25px;
    height: 25px;
    background-color: #3498db;
    border-radius: 4px;
    position: absolute;
    box-shadow: 0 0 8px rgba(52, 152, 219, 0.7);
}
```

### 1.14 Update `.shape` border-radius (line 22)

**Current:** `border-radius: 6px;`
**New:** `border-radius: 4px;`

### 1.15 Update `.hole` — 60→30px (lines 29-39)

**Current code:**
```css
.hole {
    width: 60px;
    height: 60px;
    border: 2px solid #e74c3c;
    background-color: transparent;
    border-radius: 6px;
    box-shadow:
        0 0 12px rgba(231, 76, 60, 0.6),
        inset 0 0 12px rgba(231, 76, 60, 0.15);
    z-index: 10;
}
```

**New code:**
```css
.hole {
    width: 30px;
    height: 30px;
    border: 2px solid #e74c3c;
    background-color: transparent;
    border-radius: 4px;
    box-shadow:
        0 0 8px rgba(231, 76, 60, 0.6),
        inset 0 0 8px rgba(231, 76, 60, 0.15);
    z-index: 10;
}
```

### 1.16 Update `.trajectoryDot` — 14→7px (lines 50-59)

**Current code:**
```css
.trajectoryDot {
    position: absolute;
    width: 14px;
    height: 14px;
    background-color: rgba(52, 152, 219, 0.45);
    border-radius: 50%;
    z-index: 5;
    transform: translate(-50%, -50%);
    pointer-events: none;
}
```

**New code:**
```css
.trajectoryDot {
    position: absolute;
    width: 7px;
    height: 7px;
    background-color: rgba(52, 152, 219, 0.45);
    border-radius: 50%;
    z-index: 5;
    transform: translate(-50%, -50%);
    pointer-events: none;
}
```

### 1.17 Update `.hardBarrier` — 14→7px (lines 61-73)

**Current code:**
```css
.hardBarrier {
    position: absolute;
    width: 14px;
    height: 14px;
    background-color: rgba(231, 76, 60, 0.88);
    border-radius: 3px;
    z-index: 6;
    transform: translate(-50%, -50%);
    pointer-events: none;
    box-shadow:
        0 0 8px rgba(231, 76, 60, 0.7),
        0 0 2px rgba(231, 76, 60, 1);
}
```

**New code:**
```css
.hardBarrier {
    position: absolute;
    width: 7px;
    height: 7px;
    background-color: rgba(231, 76, 60, 0.88);
    border-radius: 2px;
    z-index: 6;
    transform: translate(-50%, -50%);
    pointer-events: none;
    box-shadow:
        0 0 5px rgba(231, 76, 60, 0.7),
        0 0 2px rgba(231, 76, 60, 1);
}
```

### 1.18 Update `.mine` — 30→15px (lines 75-88)

**Current code:**
```css
.mine {
    position: absolute;
    width: 30px;
    height: 30px;
    background: radial-gradient(circle at 38% 32%, #ffe066, #e67e22 55%, #922b21);
    border-radius: 50%;
    z-index: 8;
    transform: translate(-50%, -50%);
    pointer-events: none;
    box-shadow:
        0 0 10px rgba(230, 126, 34, 0.9),
        0 0 28px rgba(146, 43, 33, 0.55),
        inset 0 -4px 6px rgba(0, 0, 0, 0.4);
}
```

**New code:**
```css
.mine {
    position: absolute;
    width: 15px;
    height: 15px;
    background: radial-gradient(circle at 38% 32%, #ffe066, #e67e22 55%, #922b21);
    border-radius: 50%;
    z-index: 8;
    transform: translate(-50%, -50%);
    pointer-events: none;
    box-shadow:
        0 0 6px rgba(230, 126, 34, 0.9),
        0 0 14px rgba(146, 43, 33, 0.55),
        inset 0 -2px 3px rgba(0, 0, 0, 0.4);
}
```

---

## Summary of All Size Changes

| Element | Old Size | New Size | Old Collision Half | New Collision Half |
|---------|----------|----------|--------------------|--------------------|
| Block | 50×50px | 25×25px | — | — |
| Hole | 60×60px | 30×30px | — | — |
| Barrier | 14×14px | 7×7px | 7 | 4 |
| Mine | 30×30px | 15×15px | 15 | 8 |
| Trajectory | 14×14px | 7×7px | — | — |

## Summary of All Scoring Changes

| Parameter | Old Value | New Value |
|-----------|-----------|-----------|
| Coarse check | Full containment | Any overlap |
| Fine threshold | > 10% | > 2% |

---

## Testing

1. **Scoring:** Tilt block so it barely touches the hole edge — should score at 2%+ overlap
2. **Visual sizes:** All elements should appear half their original size
3. **Collision:** Barriers and mines should block movement correctly at new sizes
4. **Mine placement:** Mines should still find valid positions and not overlap block/hole spawn
5. **BFS pathfinding:** Path should be found correctly with smaller elements
6. **Level transitions:** Levels 2 and 3 should still trigger correctly
7. **Game reset on mine blast:** Should still work correctly
