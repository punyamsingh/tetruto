# Step 3: Pause Menu + Game Over Screen

## Goal
Add a pause button, pause menu (resume + restart), and a game-over screen that appears on mine blast instead of silently resetting.

---

## Files to Modify

1. `src/components/Game.js`
2. `src/styles/game.module.css`
3. `src/pages/index.js`
4. `src/styles/Home.module.css`

---

## Changes in `src/pages/index.js`

### 3.1 Add pause state and handler (after line 11)

**Current code (lines 8-12):**
```js
const Home = () => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
```

**New code:**
```js
const Home = () => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
```

### 3.2 Add pause button to HUD (after line 55, before `</div>` closing `.hud`)

**Current code (lines 47-56):**
```jsx
      <div className={styles.hud}>
        <span className={styles.title}>TETRUTO</span>
        <div className={styles.hudStats}>
          <span className={styles.hudStat}>LVL <strong>{currentLevel}</strong></span>
          <span className={styles.hudStat}>SCORE <strong>{score}</strong></span>
          {highScore > 0 && (
            <span className={styles.hudStat}>BEST <strong>{highScore}</strong></span>
          )}
        </div>
      </div>
```

**New code:**
```jsx
      <div className={styles.hud}>
        <span className={styles.title}>TETRUTO</span>
        <div className={styles.hudRight}>
          <div className={styles.hudStats}>
            <span className={styles.hudStat}>LVL <strong>{currentLevel}</strong></span>
            <span className={styles.hudStat}>SCORE <strong>{score}</strong></span>
            {highScore > 0 && (
              <span className={styles.hudStat}>BEST <strong>{highScore}</strong></span>
            )}
          </div>
          <button
            className={styles.pauseBtn}
            onClick={() => setIsPaused(true)}
            aria-label="Pause game"
          >
            ||
          </button>
        </div>
      </div>
```

### 3.3 Pass pause props to Game component (lines 58-62)

**Current code:**
```jsx
      <Game
        onLevelChange={handleLevelChange}
        onScoreChange={handleScoreChange}
        onHighScoreChange={handleHighScoreChange}
      />
```

**New code:**
```jsx
      <Game
        onLevelChange={handleLevelChange}
        onScoreChange={handleScoreChange}
        onHighScoreChange={handleHighScoreChange}
        isPaused={isPaused}
        onResume={() => setIsPaused(false)}
        onPauseRestart={() => { setIsPaused(false); }}
      />
```

---

## Changes in `src/styles/Home.module.css`

### 3.4 Add `.hudRight` and `.pauseBtn` styles (append to end of file)

**Append after line 44:**
```css

.hudRight {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.pauseBtn {
  pointer-events: auto;
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.7rem;
  font-family: inherit;
  letter-spacing: 0.15em;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  line-height: 1;
}
```

---

## Changes in `src/components/Game.js`

### 3.5 Add `isPaused` and `onResume` to props (line 20)

**Current code:**
```js
const Game = ({ onScoreChange,onLevelChange,onHighScoreChange }) => {
```

**New code:**
```js
const Game = ({ onScoreChange,onLevelChange,onHighScoreChange,isPaused,onResume,onPauseRestart }) => {
```

### 3.6 Add game-over state (after line 31)

**Current code (lines 29-31):**
```js
    const [showOverlay,setShowOverlay] = useState(false);
    const [countdown,setCountdown] = useState(3);
    const [overlayLevel,setOverlayLevel] = useState(1);
```

**New code:**
```js
    const [showOverlay,setShowOverlay] = useState(false);
    const [countdown,setCountdown] = useState(3);
    const [overlayLevel,setOverlayLevel] = useState(1);
    const [gameOverData,setGameOverData] = useState(null); // { score, highScore } or null
```

### 3.7 Add pause ref for event handler access + sync effect (after line 51)

**After the existing refs, add:**
```js
    const isPausedRef = useRef(false);
```

**Add sync effect (near the other ref sync effects around line 53-55):**
```js
    useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
```

### 3.8 Block gyro input when paused (line 306 in updatePosition)

**Current code:**
```js
            // Pause gyro input while overlay is active
            if (overlayActiveRef.current) return;
```

**New code:**
```js
            // Pause gyro input while overlay is active or game is paused
            if (overlayActiveRef.current || isPausedRef.current) return;
```

### 3.9 Modify `handleMineBlast` to show game-over screen instead of instant reset (lines 489-531)

**Current code:**
```js
    const handleMineBlast = () => {
        // Record high score before resetting
        const currentScore = scoreRef.current;
        if (currentScore > highScoreRef.current) {
            highScoreRef.current = currentScore;
            try { localStorage.setItem('tetruto_high_score',String(currentScore)); } catch (e) {}
            if (onHighScoreChangeRef.current) onHighScoreChangeRef.current(currentScore);
        }

        // Red explosion flash
        document.body.style.backgroundColor = '#FF1100';
        setTimeout(() => { document.body.style.backgroundColor = ''; },700);

        // Wipe all game state
        scoreRef.current = 0;
        setScore(0);
        if (onScoreChangeRef.current) onScoreChangeRef.current(0);

        levelRef.current = 1;
        setLevel(1);
        if (onLevelChangeRef.current) onLevelChangeRef.current(1);

        hardBarriersRef.current = [];
        barrierActiveRef.current = false;
        barrierScoreCountRef.current = 0;
        setHardBarriers([]);

        trajectoryRef.current = [];
        setTrajectoryPoints([]);

        minesRef.current = [];
        mineCountRef.current = 3;
        setMines([]);

        // Fresh hole + block position
        const hole = randomHolePosition();
        setHoleStyles(hole);
        holeStylesRef.current = hole;

        const spawnPos = { left: 40,top: 40 };
        triggerOverlay(1,spawnPos);
    };
```

**New code:**
```js
    const handleMineBlast = () => {
        // Record high score before showing game over
        const currentScore = scoreRef.current;
        if (currentScore > highScoreRef.current) {
            highScoreRef.current = currentScore;
            try { localStorage.setItem('tetruto_high_score',String(currentScore)); } catch (e) {}
            if (onHighScoreChangeRef.current) onHighScoreChangeRef.current(currentScore);
        }

        // Red explosion flash
        document.body.style.backgroundColor = '#FF1100';
        setTimeout(() => { document.body.style.backgroundColor = ''; },700);

        // Show game-over screen instead of instant reset
        setGameOverData({ score: currentScore, highScore: highScoreRef.current });
    };

    const performFullReset = () => {
        setGameOverData(null);

        scoreRef.current = 0;
        setScore(0);
        if (onScoreChangeRef.current) onScoreChangeRef.current(0);

        levelRef.current = 1;
        setLevel(1);
        if (onLevelChangeRef.current) onLevelChangeRef.current(1);

        hardBarriersRef.current = [];
        barrierActiveRef.current = false;
        barrierScoreCountRef.current = 0;
        setHardBarriers([]);

        trajectoryRef.current = [];
        setTrajectoryPoints([]);

        minesRef.current = [];
        mineCountRef.current = 3;
        setMines([]);

        const hole = randomHolePosition();
        setHoleStyles(hole);
        holeStylesRef.current = hole;

        const spawnPos = { left: 40,top: 40 };
        triggerOverlay(1,spawnPos);
    };
```

### 3.10 Block gyro when game over (add to the same early-return in updatePosition)

**Update the paused check from 3.8:**
```js
            if (overlayActiveRef.current || isPausedRef.current || gameOverDataRef.current) return;
```

**Add a ref for gameOverData (near the other refs):**
```js
    const gameOverDataRef = useRef(null);
```

**Add sync effect:**
```js
    useEffect(() => { gameOverDataRef.current = gameOverData; }, [gameOverData]);
```

### 3.11 Add pause menu and game-over screen to JSX (after the overlay div, around line 581)

**Add inside the `<>` fragment, after the `{showOverlay && (...)}` block:**

```jsx
                    {/* Pause Menu */}
                    {isPaused && !gameOverData && (
                        <div className={styles.pauseOverlay}>
                            <div className={styles.pauseTitle}>PAUSED</div>
                            <button className={styles.menuBtn} onClick={onResume}>
                                RESUME
                            </button>
                            <button className={styles.menuBtn} onClick={() => {
                                if (onResume) onResume();
                                performFullReset();
                            }}>
                                RESTART
                            </button>
                        </div>
                    )}

                    {/* Game Over Screen */}
                    {gameOverData && (
                        <div className={styles.gameOverOverlay}>
                            <div className={styles.gameOverTitle}>MINE HIT</div>
                            <div className={styles.gameOverScore}>
                                SCORE <strong>{gameOverData.score}</strong>
                            </div>
                            <div className={styles.gameOverScore}>
                                BEST <strong>{gameOverData.highScore}</strong>
                            </div>
                            <button className={styles.menuBtn} onClick={performFullReset}>
                                RESTART
                            </button>
                        </div>
                    )}
```

---

## Changes in `src/styles/game.module.css`

### 3.12 Add pause and game-over styles (append to end of file)

```css

/* Pause overlay */
.pauseOverlay,
.gameOverOverlay {
    position: fixed;
    inset: 0;
    background: rgba(10, 10, 20, 0.92);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    z-index: 300;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    animation: overlayFadeIn 0.25s ease-out;
}

.pauseTitle,
.gameOverTitle {
    font-size: 0.7rem;
    letter-spacing: 0.5em;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
}

.gameOverTitle {
    color: rgba(231, 76, 60, 0.9);
}

.gameOverScore {
    font-size: 0.75rem;
    letter-spacing: 0.15em;
    color: rgba(255, 255, 255, 0.4);
}

.gameOverScore strong {
    color: rgba(255, 255, 255, 0.8);
    font-size: 1.2rem;
}

.menuBtn {
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.7);
    font-family: inherit;
    font-size: 0.75rem;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    padding: 0.75rem 2rem;
    border-radius: 4px;
    cursor: pointer;
    min-width: 160px;
    text-align: center;
}

.menuBtn:active {
    background: rgba(255, 255, 255, 0.05);
}
```

---

## Testing

1. **Pause button:** Tap `||` in HUD — game freezes, pause menu appears
2. **Resume:** Tap RESUME — game unfreezes, block movement resumes
3. **Restart from pause:** Tap RESTART — game resets to level 1, score 0
4. **Game over:** Hit a mine in level 3 — game-over screen shows with score and best
5. **Restart from game over:** Tap RESTART — game resets cleanly
6. **Gyro frozen:** While paused or on game-over screen, tilting phone should NOT move block
7. **Overlay interaction:** Pause during level overlay should not cause issues
8. **HUD updates:** Score and level in HUD should update correctly after restart
