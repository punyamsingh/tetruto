# Step 9: Accessibility

## Goal
Add `prefers-reduced-motion` support, ARIA labels, and color-blind-friendly considerations.

---

## Files to Modify

1. `src/styles/game.module.css`
2. `src/styles/globals.css`
3. `src/components/Game.js`
4. `src/pages/index.js`

---

## Changes in `src/styles/game.module.css`

### 9.1 Add `prefers-reduced-motion` media query (append to end of file)

```css

/* Accessibility: Reduced motion */
@media (prefers-reduced-motion: reduce) {
    .levelOverlay {
        animation: none;
    }

    .overlayCountdown {
        animation: none;
        transform: scale(1);
        opacity: 1;
    }

    .shape {
        transition: none !important;
    }
}
```

This disables:
- Overlay fade-in animation
- Countdown pop/scale animation
- Block drop-in spring animation

### 9.2 Add `will-change` hint for screen readers to ignore decorative elements

Already handled by `pointer-events: none` on trajectory dots, barriers, mines. No additional change needed.

---

## Changes in `src/styles/globals.css`

### 9.3 Add high-contrast support (append to end of file)

```css

/* Accessibility: High contrast */
@media (prefers-contrast: more) {
    :root {
        --foreground-rgb: 255, 255, 255;
        --background-start-rgb: 0, 0, 0;
        --background-end-rgb: 0, 0, 0;
    }
}
```

---

## Changes in `src/components/Game.js`

### 9.4 Add ARIA labels to game container and elements

**Update the game container div (line 567):**

**Current:**
```jsx
        <div className={styles.gameContainer} id={styles.gameContainer}>
```

**New:**
```jsx
        <div className={styles.gameContainer} id={styles.gameContainer} role="application" aria-label="TETRUTO game area">
```

### 9.5 Add `aria-live` region for score announcements

**Add a visually hidden live region inside the game container, after the loading block (around line 573):**

```jsx
                    {/* Screen reader announcements */}
                    <div
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                        style={{
                            position: 'absolute',
                            width: '1px',
                            height: '1px',
                            padding: 0,
                            margin: '-1px',
                            overflow: 'hidden',
                            clip: 'rect(0,0,0,0)',
                            whiteSpace: 'nowrap',
                            border: 0,
                        }}
                    >
                        {showOverlay
                            ? `Level ${overlayLevel}. ${LEVEL_RULES[overlayLevel]}. Starting in ${countdown}.`
                            : `Level ${level}. Score ${score}.`
                        }
                        {gameOverData && `Game over. Score ${gameOverData.score}. Best ${gameOverData.highScore}.`}
                    </div>
```

### 9.6 Add ARIA labels to interactive buttons (from step 3)

The pause button and menu buttons should already have `aria-label` from step 3. Verify:
- Pause button: `aria-label="Pause game"` ✓
- Mute button: `aria-label="Mute"` / `aria-label="Unmute"` ✓

### 9.7 Add `aria-hidden="true"` to decorative game elements

**Update trajectory dots (line 584-590):**

```jsx
                    {trajectoryPoints.map((pt,i) => (
                        <div
                            key={`traj-${i}`}
                            className={styles.trajectoryDot}
                            style={{ left: `${pt.x}px`,top: `${pt.y}px` }}
                            aria-hidden="true"
                        />
                    ))}
```

**Update barriers (line 593-599):**

```jsx
                    {hardBarriers.map((pt,i) => (
                        <div
                            key={`barrier-${i}`}
                            className={styles.hardBarrier}
                            style={{ left: `${pt.x}px`,top: `${pt.y}px` }}
                            aria-hidden="true"
                        />
                    ))}
```

**Update mines (line 602-608):**

```jsx
                    {mines.map((m) => (
                        <div
                            key={`mine-${m.id}`}
                            className={styles.mine}
                            style={{ left: `${m.x}px`,top: `${m.y}px` }}
                            aria-hidden="true"
                        />
                    ))}
```

**Update block and hole (lines 610-611):**

```jsx
                    <div className={styles.shape} style={shapeStyles} aria-hidden="true"></div>
                    <div className={styles.hole} id={styles.hole} style={holeStyles} aria-hidden="true"></div>
```

---

## Changes in `src/pages/index.js`

### 9.8 Add `lang` attribute verification

Verify `_document.js` has `<Html lang="en">`. It should already be there from Next.js setup.

### 9.9 Add descriptive title

**Current:**
```jsx
        <title>TETRUTO</title>
```

**New:**
```jsx
        <title>TETRUTO - Motion Control Game</title>
```

---

## Color-Blind Considerations

The game uses these colors for different elements:
- **Block:** White (#fff) — high contrast against dark background ✓
- **Hole:** Red border (#e74c3c) — distinct from block ✓
- **Trajectory:** Blue (rgba(52, 152, 219, 0.45)) — could be confused with barriers by protanopia users
- **Barriers:** Red (rgba(231, 76, 60, 0.88)) — same red as hole
- **Mines:** Orange-brown gradient — distinct shape (circle vs square)

**Current palette is acceptable** because:
1. Block is white (universal high contrast)
2. Trajectory dots and barriers have different shapes (circle vs square)
3. Mines have a unique radial gradient appearance
4. The primary game interaction (block → hole) uses white vs red, which is high-contrast for all color vision types

**Optional future enhancement:** Add a settings toggle for an alternative palette using shapes/patterns instead of color alone.

---

## Testing

1. **Reduced motion:** Enable "Reduce motion" in OS settings → overlays should appear instantly without animation, block should not have spring drop animation
2. **Screen reader:** Use VoiceOver/TalkBack → should announce score changes and level transitions
3. **High contrast:** Enable high contrast mode → background should be pure black
4. **ARIA attributes:** Inspect DOM → game container has `role="application"`, decorative elements have `aria-hidden="true"`
5. **Title:** Browser tab should show "TETRUTO - Motion Control Game"
