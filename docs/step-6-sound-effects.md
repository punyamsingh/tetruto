# Step 6: Sound Effects

## Goal
Add satisfying sound effects using the Web Audio API (no external dependencies). Include a mute toggle in the HUD.

---

## Files to Modify

1. `src/components/Game.js`
2. `src/pages/index.js`
3. `src/styles/Home.module.css`

---

## Sound Design

| Event | Sound | Frequency | Duration |
|-------|-------|-----------|----------|
| Score | Rising ding | 880Hz → 1320Hz | 150ms |
| Level up | Ascending sweep | 440Hz → 880Hz → 1320Hz | 400ms |
| Mine blast | Low rumble | 150Hz → 60Hz | 300ms |
| Countdown tick | Short beep | 600Hz | 80ms |
| Countdown GO (1) | Higher beep | 900Hz | 120ms |

---

## Changes in `src/components/Game.js`

### 6.1 Add sound utility functions at the top of the file (after line 18, before the component)

```js
// === Sound utilities (Web Audio API) ===
let audioCtx = null;
const getAudioCtx = () => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
};

const playTone = (freq, duration, type = 'sine', volume = 0.15) => {
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

const playScoreSound = () => {
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
};

const playLevelUpSound = () => {
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

const playBlastSound = () => {
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

const playTickSound = (high = false) => {
    playTone(high ? 900 : 600, high ? 120 : 80, 'sine', 0.1);
};
```

### 6.2 Add mute prop to component (line 20)

**Current props (after step 3):**
```js
const Game = ({ onScoreChange,onLevelChange,onHighScoreChange,isPaused,onResume,onPauseRestart }) => {
```

**New props:**
```js
const Game = ({ onScoreChange,onLevelChange,onHighScoreChange,isPaused,onResume,onPauseRestart,isMuted }) => {
```

### 6.3 Add muted ref (near other refs)

```js
    const isMutedRef = useRef(false);
```

**Add sync effect:**
```js
    useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
```

### 6.4 Add sound triggers throughout the code

**On scoring (inside the `if (overlapPercentage > 2)` block, after `setScore(newScore)` around line 358):**

Add after `onScoreChangeRef.current(newScore);`:
```js
                    if (!isMutedRef.current) playScoreSound();
```

**On level change (inside the level advance blocks, after `if (onLevelChangeRef.current)` calls, around lines 376 and 385):**

Add after each `onLevelChangeRef.current(...)`:
```js
                        if (!isMutedRef.current) playLevelUpSound();
```

**On mine blast (inside `handleMineBlast`, after the red flash line ~500):**

Add after `document.body.style.backgroundColor = '#FF1100';`:
```js
        if (!isMutedRef.current) playBlastSound();
```

**On countdown (inside `triggerOverlay`, at each setTimeout ~lines 249-251):**

Modify the countdown timeouts:

**Current:**
```js
        const t1 = setTimeout(() => setCountdown(2),1000);
        const t2 = setTimeout(() => setCountdown(1),2000);
```

**New:**
```js
        const t1 = setTimeout(() => {
            setCountdown(2);
            if (!isMutedRef.current) playTickSound(false);
        },1000);
        const t2 = setTimeout(() => {
            setCountdown(1);
            if (!isMutedRef.current) playTickSound(true);
        },2000);
```

Also add a tick for the initial "3":
After `setShowOverlay(true);` (line 244), add:
```js
        if (!isMutedRef.current) playTickSound(false);
```

---

## Changes in `src/pages/index.js`

### 6.5 Add mute state (after existing state declarations)

```js
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem('tetruto_muted') === 'true';
    } catch (e) { return false; }
  });
```

### 6.6 Add mute toggle handler

```js
  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      try { localStorage.setItem('tetruto_muted', String(next)); } catch (e) {}
      return next;
    });
  };
```

### 6.7 Add mute button next to pause button (in the HUD)

**After the pause button (added in step 3), add:**

```jsx
          <button
            className={styles.muteBtn}
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? 'x' : '♪'}
          </button>
```

### 6.8 Pass `isMuted` to Game component

Add `isMuted={isMuted}` to the `<Game>` props.

---

## Changes in `src/styles/Home.module.css`

### 6.9 Add mute button style (append to file)

```css

.muteBtn {
  pointer-events: auto;
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.7rem;
  font-family: inherit;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  line-height: 1;
  min-width: 28px;
  text-align: center;
}
```

---

## Notes

- **Web Audio API** requires a user gesture to start the AudioContext on most browsers. The first sound played after a tap will initialize it. Since the game requires tapping to start, this works naturally.
- **No external dependencies** — all sounds are generated programmatically.
- **Mute preference** persists across sessions via localStorage.
- **All sounds are short and subtle** — designed to provide feedback without being annoying.

---

## Testing

1. **Score sound:** Hear a rising ding when block enters hole
2. **Level-up sound:** Hear ascending notes when advancing to level 2 or 3
3. **Mine blast sound:** Hear a low rumble on mine collision
4. **Countdown sounds:** Hear ticks on 3, 2, and a higher tick on 1
5. **Mute toggle:** Tap mute button — all sounds stop. Tap again — sounds resume
6. **Mute persistence:** Mute the game, reload — should still be muted
7. **No errors on first load:** AudioContext creation should not throw
