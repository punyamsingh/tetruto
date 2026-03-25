# Step 4: Cap Mine Count + Fix Pathfinding

## Goal
Prevent the game from becoming unplayable by capping mines at 10, and improve the BFS pathfinding to be more accurate with the new element sizes.

---

## Files to Modify

1. `src/components/Game.js`

---

## Changes in `src/components/Game.js`

### 4.1 Add mine cap constant (after existing constants, around line 18)

**Current code (lines 16-18):**
```js
const BARRIER_HALF = 4;   // (after step 1 changes)
const MINE_HALF = 8;
const PATH_CELL = 20;
```

**New code:**
```js
const BARRIER_HALF = 4;
const MINE_HALF = 8;
const PATH_CELL = 25;     // BFS grid cell — matches block size (25px after step 1)
const MAX_MINES = 10;     // Mine count cap
```

### 4.2 Cap mine count on score in level 3 (line 408)

**Current code:**
```js
                        if (levelRef.current >= 3) {
                            mineCountRef.current += 1;
                        }
```

**New code:**
```js
                        if (levelRef.current >= 3) {
                            mineCountRef.current = Math.min(mineCountRef.current + 1, MAX_MINES);
                        }
```

### 4.3 Add diagonal movement to BFS (line 176)

**Current code:**
```js
            for (const [dc,dr] of [[-1,0],[1,0],[0,-1],[0,1]]) {
```

**New code:**
```js
            for (const [dc,dr] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]) {
```

### 4.4 Make goal tolerance based on hole size (line 175)

After step 1, the hole is 30px. With `PATH_CELL = 25`, the tolerance should be `Math.ceil(30 / 25) = 2`.

**Current code:**
```js
            if (Math.abs(col - goalCol) <= 3 && Math.abs(row - goalRow) <= 3) return true;
```

**New code (if step 1 already changed this to 2, no change needed; otherwise):**
```js
            if (Math.abs(col - goalCol) <= 2 && Math.abs(row - goalRow) <= 2) return true;
```

### 4.5 Update `isBlocked` block size in BFS (lines 153-154)

**After step 1, these should already be 25. Verify:**
```js
            const bRight  = bLeft + 25;
            const bBottom = bTop  + 25;
```

If step 1 was applied, this is already correct.

---

## How the Changes Interact

1. **`PATH_CELL = 25`** now matches the 25px block from step 1. Each grid cell represents exactly one block-width, making the BFS accurately model whether the block can fit through gaps.

2. **8-directional BFS** allows the pathfinder to detect diagonal paths that exist in gameplay (the block moves diagonally when you tilt in both axes simultaneously). This prevents false negatives where a diagonal path exists but BFS couldn't find it.

3. **`MAX_MINES = 10`** prevents the board from becoming unplayable. At 10 mines, the game is still very challenging but the BFS can usually find valid placement positions.

4. **Goal tolerance of 2** cells = 50px, which covers the 30px hole with margin.

---

## Testing

1. **Mine cap:** Play to 20+ score in level 3 — mine count should stop at 10
2. **Pathfinding accuracy:** Mines should never block the only path to the hole
3. **Diagonal paths:** With barriers present, the BFS should find diagonal escape routes
4. **Mine placement:** Mines should still place correctly with the new grid size
5. **Performance:** BFS with 25px cells produces fewer cells than 20px, so it should be slightly faster
