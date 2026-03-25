# Step 2: Delta-Time Movement Normalization

## Goal
Make block movement speed consistent across all devices, regardless of how frequently the `deviceorientation` event fires (10–100Hz varies by device).

---

## Files to Modify

1. `src/components/Game.js`

---

## Changes in `src/components/Game.js`

### 2.1 Add timestamp tracking and delta-time scaling in the motion handler (lines 298-422)

The entire `useEffect` block starting at line 298 manages the `deviceorientation` event. We need to modify the `updatePosition` function inside it.

**Current code (lines 298-326):**
```js
    useEffect(() => {
        const sensitivity = 10;
        const cooldownDuration = 1000;

        let lastAlignmentTime = 0;

        const updatePosition = (event) => {
            // Pause gyro input while overlay is active
            if (overlayActiveRef.current) return;

            const x = event.gamma / sensitivity;
            const y = event.beta / sensitivity;

            const prev = currentPosRef.current;
            let newLeft = Math.max(0,Math.min(100,prev.left + x));
            let newTop  = Math.max(0,Math.min(100,prev.top  + y));

            // Sliding collision against hardened barriers (level 2+)
            if (barrierActiveRef.current) {
                if (wouldCollideWithBarriers(newLeft,prev.top)) newLeft = prev.left;
                if (wouldCollideWithBarriers(prev.left,newTop)) newTop  = prev.top;
                if (wouldCollideWithBarriers(newLeft,newTop)) {
                    newLeft = prev.left;
                    newTop  = prev.top;
                }
            }

            currentPosRef.current = { left: newLeft,top: newTop };
            setShapeStyles({ left: `${newLeft}%`,top: `${newTop}%` });
```

**New code:**
```js
    useEffect(() => {
        const sensitivity = 10;
        const cooldownDuration = 1000;
        const BASE_FRAME_MS = 16.67; // 60fps baseline

        let lastAlignmentTime = 0;
        let lastEventTime = 0;
        let pendingPosition = null;
        let rafId = null;

        // RAF render loop: sync DOM updates with display refresh
        const renderFrame = () => {
            if (pendingPosition) {
                setShapeStyles({ left: `${pendingPosition.left}%`, top: `${pendingPosition.top}%` });
                pendingPosition = null;
            }
            rafId = requestAnimationFrame(renderFrame);
        };
        rafId = requestAnimationFrame(renderFrame);

        const updatePosition = (event) => {
            // Pause gyro input while overlay is active
            if (overlayActiveRef.current) return;

            // Delta-time: normalize movement to 60fps baseline
            const now = performance.now();
            let deltaFactor = 1;
            if (lastEventTime > 0) {
                const deltaMs = Math.min(now - lastEventTime, 100); // cap at 100ms to prevent jumps
                deltaFactor = deltaMs / BASE_FRAME_MS;
            }
            lastEventTime = now;

            const x = (event.gamma / sensitivity) * deltaFactor;
            const y = (event.beta / sensitivity) * deltaFactor;

            const prev = currentPosRef.current;
            let newLeft = Math.max(0, Math.min(100, prev.left + x));
            let newTop  = Math.max(0, Math.min(100, prev.top  + y));

            // Sliding collision against hardened barriers (level 2+)
            if (barrierActiveRef.current) {
                if (wouldCollideWithBarriers(newLeft, prev.top)) newLeft = prev.left;
                if (wouldCollideWithBarriers(prev.left, newTop)) newTop  = prev.top;
                if (wouldCollideWithBarriers(newLeft, newTop)) {
                    newLeft = prev.left;
                    newTop  = prev.top;
                }
            }

            currentPosRef.current = { left: newLeft, top: newTop };
            pendingPosition = { left: newLeft, top: newTop };
```

### 2.2 Update the cleanup return (lines 419-421)

**Current code:**
```js
        window.addEventListener('deviceorientation',updatePosition);

        return () => {
            window.removeEventListener('deviceorientation',updatePosition);
        };
    },[]); // eslint-disable-line react-hooks/exhaustive-deps
```

**New code:**
```js
        window.addEventListener('deviceorientation', updatePosition);

        return () => {
            window.removeEventListener('deviceorientation', updatePosition);
            if (rafId) cancelAnimationFrame(rafId);
        };
    },[]); // eslint-disable-line react-hooks/exhaustive-deps
```

### 2.3 Reset lastEventTime when overlay ends

When the overlay is active, events return early. When it deactivates, the next event would have a huge delta. The cap at 100ms in the delta calculation (step 2.1) already handles this — if 3 seconds pass during overlay, the delta is capped to 100ms which produces a `deltaFactor` of ~6, but since the overlay check returns early, the first real event after overlay will just get `deltaFactor = 1` (because `lastEventTime` was stale).

**Optional additional safety:** Reset `lastEventTime = 0` when overlay ends. This is already handled by the `if (lastEventTime > 0)` check — if delta is too large, the cap prevents jumps.

---

## How It Works

1. **`performance.now()`** gives sub-millisecond timestamps
2. **`deltaMs`** = time since last event (capped at 100ms to prevent huge jumps after pauses)
3. **`deltaFactor`** = `deltaMs / 16.67ms` — at 60fps this is 1.0, at 30fps this is 2.0, at 120fps this is 0.5
4. **Movement** is multiplied by `deltaFactor`, so a device firing at 30Hz moves the same total distance as one firing at 120Hz
5. **`requestAnimationFrame`** batches DOM updates to display refresh rate, preventing unnecessary repaints between frames

---

## Testing

1. **Consistency test:** On the same device, the block should move at the same perceived speed regardless of browser tab throttling
2. **No jumps:** After the level overlay (3s pause), the block should not suddenly jump when input resumes
3. **Smooth rendering:** Block movement should feel smoother due to RAF sync
4. **Tab background:** If the user switches tabs and returns, movement should resume smoothly (100ms cap prevents big jump)
5. **All existing features work:** Scoring, barriers, trajectory, mines — all unchanged behavior
