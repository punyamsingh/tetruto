# Step 5: Performance — Cache DOM Queries, Cap Trajectory, GPU Hints

## Goal
Eliminate expensive DOM queries from the hot path (60Hz event handler), cap trajectory array growth, and add CSS GPU acceleration hints.

---

## Files to Modify

1. `src/components/Game.js`
2. `src/styles/game.module.css`

---

## Changes in `src/components/Game.js`

### 5.1 Replace `isInsideHole()` with ref-based calculation (lines 533-546)

The current implementation calls `document.getElementById()` and `getBoundingClientRect()` on every motion event (30-100Hz). This forces the browser to recalculate layout.

We already track `currentPosRef` (block position in %) and `holeStylesRef` (hole position in px). Use those instead.

**Current code:**
```js
    const isInsideHole = () => {
        const holeElement = document.getElementById(styles.hole);
        if (!holeElement) return false;

        const holeRect  = holeElement.getBoundingClientRect();
        const shapeRect = document.querySelector(`.${styles.shape}`).getBoundingClientRect();

        // Check for ANY overlap (after step 1 fix)
        return (
            shapeRect.right  > holeRect.left   &&
            shapeRect.left   < holeRect.right  &&
            shapeRect.bottom > holeRect.top    &&
            shapeRect.top    < holeRect.bottom
        );
    };
```

**New code:**
```js
    const isInsideHole = () => {
        const holePos = holeStylesRef.current;
        if (!holePos || !holePos.left) return false;

        const blockPos = currentPosRef.current;
        const W = window.innerWidth;
        const H = window.innerHeight;

        const blockLeft   = (blockPos.left / 100) * W;
        const blockTop    = (blockPos.top / 100) * H;
        const blockRight  = blockLeft + 25;   // block size after step 1
        const blockBottom = blockTop + 25;

        const holeLeft   = parseFloat(holePos.left);
        const holeTop    = parseFloat(holePos.top);
        const holeRight  = holeLeft + 30;     // hole size after step 1
        const holeBottom = holeTop + 30;

        // Any overlap check
        return (
            blockRight  > holeLeft   &&
            blockLeft   < holeRight  &&
            blockBottom > holeTop    &&
            blockTop    < holeBottom
        );
    };
```

### 5.2 Replace `calculateOverlapPercentage()` with ref-based calculation (lines 548-564)

**Current code:**
```js
    const calculateOverlapPercentage = () => {
        const holeElement  = document.getElementById(styles.hole);
        const shapeElement = document.querySelector(`.${styles.shape}`);

        if (!holeElement || !shapeElement) return 0;

        const holeRect  = holeElement.getBoundingClientRect();
        const shapeRect = shapeElement.getBoundingClientRect();

        const overlapWidth  = Math.max(0,Math.min(shapeRect.right,holeRect.right)   - Math.max(shapeRect.left,holeRect.left));
        const overlapHeight = Math.max(0,Math.min(shapeRect.bottom,holeRect.bottom) - Math.max(shapeRect.top,holeRect.top));

        const overlapArea = overlapWidth * overlapHeight;
        const shapeArea   = (shapeRect.right - shapeRect.left) * (shapeRect.bottom - shapeRect.top);

        return (overlapArea / shapeArea) * 100;
    };
```

**New code:**
```js
    const calculateOverlapPercentage = () => {
        const holePos = holeStylesRef.current;
        if (!holePos || !holePos.left) return 0;

        const blockPos = currentPosRef.current;
        const W = window.innerWidth;
        const H = window.innerHeight;

        const blockLeft   = (blockPos.left / 100) * W;
        const blockTop    = (blockPos.top / 100) * H;
        const blockRight  = blockLeft + 25;
        const blockBottom = blockTop + 25;

        const holeLeft   = parseFloat(holePos.left);
        const holeTop    = parseFloat(holePos.top);
        const holeRight  = holeLeft + 30;
        const holeBottom = holeTop + 30;

        const overlapWidth  = Math.max(0, Math.min(blockRight, holeRight)   - Math.max(blockLeft, holeLeft));
        const overlapHeight = Math.max(0, Math.min(blockBottom, holeBottom) - Math.max(blockTop, holeTop));

        const overlapArea = overlapWidth * overlapHeight;
        const blockArea   = 25 * 25;  // block size squared

        return (overlapArea / blockArea) * 100;
    };
```

### 5.3 Cap trajectory array at 500 points (lines 337-338)

**Current code:**
```js
                    trajectoryRef.current = [...trajectoryRef.current,point];
                    setTrajectoryPoints([...trajectoryRef.current]);
```

**New code:**
```js
                    trajectoryRef.current = [...trajectoryRef.current, point];
                    // Cap at 500 to prevent memory growth
                    if (trajectoryRef.current.length > 500) {
                        trajectoryRef.current = trajectoryRef.current.slice(-500);
                    }
                    setTrajectoryPoints([...trajectoryRef.current]);
```

---

## Changes in `src/styles/game.module.css`

### 5.4 Add `will-change` hints for GPU acceleration

**Update `.shape` (around line 20):**

Add to the `.shape` rule:
```css
    will-change: transform, left, top;
```

**Update `.hole` (around line 29):**

Add to the `.hole` rule:
```css
    will-change: left, top;
```

**Update `.trajectoryDot` (around line 50):**

Add:
```css
    will-change: transform;
```

**Update `.hardBarrier` (around line 61):**

Add:
```css
    will-change: transform;
```

**Update `.mine` (around line 75):**

Add:
```css
    will-change: transform;
```

---

## Performance Impact

| Before | After |
|--------|-------|
| `getBoundingClientRect()` 2x per event (60Hz) = 120 forced layouts/sec | 0 forced layouts from scoring checks |
| `document.getElementById()` + `document.querySelector()` per event | 0 DOM queries from scoring checks |
| Trajectory array unbounded | Capped at 500 DOM nodes max |
| No GPU layer promotion | `will-change` promotes elements to compositor layers |

---

## Testing

1. **Scoring still works:** Block + hole overlap should still trigger scoring correctly
2. **No visual difference:** Game should look identical but feel smoother
3. **Long sessions:** Play for 5+ minutes in level 2 — trajectory should cap at 500 dots
4. **Battery:** Reduced layout thrashing should result in less battery drain
5. **Edge case:** When hole position is in `%` format (initial state) — `parseFloat` on `"60%"` returns 60, which is wrong. Verify `holeStylesRef.current` is always in `px` format after first `randomHolePosition()` call (it is — line 72-74 sets px values on mount).
