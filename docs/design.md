# Design System

TETRUTO has a minimal, dark aesthetic. Everything is intentional — low distraction, high contrast, full focus on the moving block.

---

## Color Palette

| Name | Hex | Used for |
|---|---|---|
| Background | `#0a0a14` | Full screen background |
| White | `#ffffff` | Player block |
| Red | `#e74c3c` | Target hole border |
| Blue | `#3498db` | Loading spinner |
| Green | `#2ecc71` | Score flash feedback |
| HUD text (dim) | `rgba(255,255,255,0.35)` | Title and stat labels |
| HUD text (bright) | `rgba(255,255,255,0.70)` | Stat values |

### Why this palette?

- **Dark background** removes all visual noise — the only things that matter are the white block and the red target.
- **White on dark** gives maximum contrast for the player block, making it easy to track at all times.
- **Red target** with a glow creates a "find me" visual pull without being harsh.
- **Green flash** is universally understood as success — instant feedback with no text needed.

---

## CSS Variables

Defined in `globals.css`:

```css
:root {
  --accent-blue:  #3498db;
  --accent-red:   #e74c3c;
  --accent-green: #2ecc71;

  --foreground-rgb: 255, 255, 255;
  --background-start-rgb: 10, 10, 20;
  --background-end-rgb:   10, 10, 20;

  --hud-bg:     rgba(0, 0, 0, 0.5);
  --hud-border: rgba(255, 255, 255, 0.1);

  --font-mono: ui-monospace, Menlo, Monaco, 'Cascadia Mono', ...;
}
```

---

## Typography

The entire game uses a **monospace font stack**. This is a deliberate design choice:

- Monospace reads as technical, minimal, game-like
- Numbers in the HUD don't shift width as the score changes (fixed character width)
- Matches the blocky, geometric aesthetic of the shapes

```
Font stack: ui-monospace → Menlo → Monaco → Cascadia Mono → Segoe UI Mono → ...
```

---

## Shapes

Both the player block and the target are **rounded squares** (`border-radius: 6px`). They're related, but distinct:

| Element | Size | Style |
|---|---|---|
| Player block | 50×50px | Solid white fill, soft white glow |
| Target hole | 60×60px | Transparent fill, red border, red glow |

The target being slightly **larger** than the block is intentional — it creates a natural "fit into" dynamic. You're trying to slip the block into the target, not collide with it.

---

## Glow Effects

Both elements have layered `box-shadow` to create depth and emphasis:

```css
/* Player block */
.shape {
    box-shadow:
        0 0 6px  rgba(255, 255, 255, 0.45),  /* tight inner glow */
        0 0 15px rgba(255, 255, 255, 0.2);   /* wider outer halo */
}

/* Target hole */
.hole {
    box-shadow:
        0 0 12px rgba(231, 76, 60, 0.6),           /* outer red glow */
        inset 0 0 12px rgba(231, 76, 60, 0.15);    /* inner red tint */
}
```

The inset shadow on the target gives it a subtle "hollow" appearance even though it's just a bordered div.

---

## HUD

The heads-up display is designed to be **present but not distracting**:

- Fixed position, top of screen
- Low-opacity text (`0.35`) for labels, slightly brighter (`0.70`) for values
- `pointer-events: none` — won't intercept any touch events
- Title "TETRUTO" is always visible but dim — branding without noise

```
TETRUTO                    LVL 1  SCORE 3
(opacity 0.35)            (labels 0.35, values 0.70)
```

---

## Loading Screen

A centered `BeatLoader` spinner with a small `LOADING` text label beneath it. Uses the `--accent-blue` color. Disappears after 1.5 seconds.

The loading state exists partly to give the device orientation API time to initialize — cold starts on some devices need a moment before sensor data is reliable.

---

## Design Principles

1. **Nothing on screen that isn't gameplay** — no menus, no buttons, no decorations.
2. **Feedback is visual, not textual** — the green flash says "you scored" better than any text could.
3. **Dark = focus** — bright backgrounds cause eye strain and distraction. Black canvas, glowing objects.
4. **Fullscreen by default** — the browser chrome is hidden when possible. The game is the whole screen.
