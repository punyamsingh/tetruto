import React, { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { BeatLoader } from 'react-spinners';
import styles from '../styles/game.module.css';
import { useGameState } from '../hooks/useGameState';
import { useMotionControl } from '../hooks/useMotionControl';
import { wouldCollideWithMinesList, holeCollidesWithBarriers, calculateOverlapPercentage } from '../utils/collision';
import { placeMines } from '../utils/pathfinding';
import { playScoreSound, playLevelUpSound, playBlastSound, playTickSound, setMuted } from '../utils/sound';
import {
    LEVEL_RULES, BLOCK_SIZE, HOLE_SIZE, OVERLAP_THRESHOLD,
    SCORE_COOLDOWN, MINE_HIT_DEBOUNCE, TRAJECTORY_SAMPLE_INTERVAL,
    LEVEL_2_THRESHOLD, LEVEL_3_THRESHOLD, INITIAL_MINE_COUNT,
    MAX_TRAJECTORY_POINTS, LOADING_DURATION,
    SCORE_FLASH_DURATION, BLAST_FLASH_DURATION,
    GAME_STATE,
} from '../constants';

const randomHolePosition = (w, h) => ({
    left: `${Math.floor(Math.random() * (w - HOLE_SIZE - 5))}px`,
    top: `${Math.floor(Math.random() * (h - HOLE_SIZE - 5))}px`,
});

const Game = forwardRef(({ onScoreChange, onLevelChange, onHighScoreChange, onGameOver, onGameStateChange }, ref) => {
    const {
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
        gameState, setGameState,
        finalScore, setFinalScore,
        soundMuted, setSoundMuted,
        scoreRef, levelRef, currentPosRef,
        trajectoryRef, hardBarriersRef, minesRef,
        mineCountRef, barrierActiveRef, barrierScoreCountRef,
        lastTrajectoryTimeRef, overlayActiveRef, overlayTimersRef,
        highScoreRef, holeStylesRef, lastMineHitTimeRef,
        gameStateRef,
    } = useGameState();

    // Container ref for accurate dimensions (game area != window)
    const containerRef = useRef(null);
    const containerDimsRef = useRef({ w: 0, h: 0 });

    const getContainerDims = () => {
        const el = containerRef.current;
        if (el) {
            containerDimsRef.current = { w: el.clientWidth, h: el.clientHeight };
        }
        return containerDimsRef.current;
    };

    // Keep callback refs in sync
    const onScoreChangeRef = useRef(onScoreChange);
    const onLevelChangeRef = useRef(onLevelChange);
    const onHighScoreChangeRef = useRef(onHighScoreChange);
    const onGameOverRef = useRef(onGameOver);
    const onGameStateChangeRef = useRef(onGameStateChange);
    useEffect(() => { onScoreChangeRef.current = onScoreChange; }, [onScoreChange]);
    useEffect(() => { onLevelChangeRef.current = onLevelChange; }, [onLevelChange]);
    useEffect(() => { onHighScoreChangeRef.current = onHighScoreChange; }, [onHighScoreChange]);
    useEffect(() => { onGameOverRef.current = onGameOver; }, [onGameOver]);
    useEffect(() => { onGameStateChangeRef.current = onGameStateChange; }, [onGameStateChange]);

    const updateGameState = (newState) => {
        gameStateRef.current = newState;
        setGameState(newState);
        if (onGameStateChangeRef.current) onGameStateChangeRef.current(newState);
    };

    // Report loaded high score to parent
    useEffect(() => {
        if (highScoreRef.current > 0 && onHighScoreChangeRef.current) {
            onHighScoreChangeRef.current(highScoreRef.current);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Set initial hole position + measure container
    useEffect(() => {
        const dims = getContainerDims();
        const w = dims.w || window.innerWidth;
        const h = dims.h || window.innerHeight;
        const pos = randomHolePosition(w, h);
        setHoleStyles(pos);
        holeStylesRef.current = pos;

        const onResize = () => getContainerDims();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Loading timer
    useEffect(() => {
        const t = setTimeout(() => setLoading(false), LOADING_DURATION);
        return () => clearTimeout(t);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Cleanup overlay timers
    useEffect(() => {
        return () => { overlayTimersRef.current.forEach(clearTimeout); };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // --- Ref-based overlap calculation (no DOM queries) ---
    const getOverlapPercentage = () => {
        const dims = getContainerDims();
        return calculateOverlapPercentage(
            currentPosRef.current, holeStylesRef.current,
            dims.w || window.innerWidth, dims.h || window.innerHeight
        );
    };

    // --- Overlay / countdown ---
    const triggerOverlay = (lvl, spawnPos) => {
        overlayTimersRef.current.forEach(clearTimeout);
        overlayTimersRef.current = [];
        overlayActiveRef.current = true;
        setOverlayLevel(lvl);
        setCountdown(3);
        setShowOverlay(true);
        playTickSound(false);

        setShapeStyles({ left: `${spawnPos.left}%`, top: '-8%' });

        const t1 = setTimeout(() => {
            setCountdown(2);
            playTickSound(false);
        }, 1000);
        const t2 = setTimeout(() => {
            setCountdown(1);
            playTickSound(true);
        }, 2000);
        const t3 = setTimeout(() => {
            playTickSound(true);
            setShowOverlay(false);
            setShapeStyles({
                left: `${spawnPos.left}%`,
                top: `${spawnPos.top}%`,
                transition: 'top 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
            });
            currentPosRef.current = spawnPos;
            const t4 = setTimeout(() => {
                overlayActiveRef.current = false;
                setShapeStyles({ left: `${spawnPos.left}%`, top: `${spawnPos.top}%` });
            }, 600);
            overlayTimersRef.current = [t4];
        }, 3000);

        overlayTimersRef.current = [t1, t2, t3];
    };

    // --- Safe positioning ---
    const safeSpawnPosition = () => {
        const dims = getContainerDims();
        const W = dims.w || window.innerWidth;
        const H = dims.h || window.innerHeight;
        const candidates = [{ left: 40, top: 40 }];
        for (let i = 0; i < 50; i++) {
            candidates.push({ left: 5 + Math.random() * 85, top: 5 + Math.random() * 85 });
        }
        for (const pos of candidates) {
            if (!wouldCollideWithMinesList(pos.left, pos.top, hardBarriersRef.current, W, H) &&
                !wouldCollideWithMinesList(pos.left, pos.top, minesRef.current, W, H)) return pos;
        }
        return null;
    };

    const safeHolePosition = () => {
        const dims = getContainerDims();
        const W = dims.w || window.innerWidth;
        const H = dims.h || window.innerHeight;
        for (let i = 0; i < 50; i++) {
            const left = Math.floor(Math.random() * (W - HOLE_SIZE - 5));
            const top = Math.floor(Math.random() * (H - HOLE_SIZE - 5));
            if (!holeCollidesWithBarriers(left, top, hardBarriersRef.current, HOLE_SIZE)) {
                return { left: `${left}px`, top: `${top}px` };
            }
        }
        return null;
    };

    // --- Game reset (after scoring) ---
    const resetGame = () => {
        const pos = safeSpawnPosition();
        if (pos) {
            currentPosRef.current = pos;
            setShapeStyles({ left: `${pos.left}%`, top: `${pos.top}%` });
        }
        const hole = safeHolePosition();
        const newHoleStyles = hole || holeStylesRef.current;
        if (hole) {
            setHoleStyles(hole);
            holeStylesRef.current = hole;
        }
        if (levelRef.current >= 3 && newHoleStyles && newHoleStyles.left && newHoleStyles.left.includes('px')) {
            const spawnPos = pos || currentPosRef.current;
            const dims = getContainerDims();
            const W = dims.w || window.innerWidth;
            const H = dims.h || window.innerHeight;
            const newMines = placeMines(mineCountRef.current, spawnPos, newHoleStyles, hardBarriersRef.current, W, H);
            minesRef.current = newMines;
            setMines(newMines);
        }
    };

    // --- Mine blast -> game over screen ---
    const handleMineBlast = () => {
        const currentScore = scoreRef.current;
        if (currentScore > highScoreRef.current) {
            highScoreRef.current = currentScore;
            try { localStorage.setItem('tetruto_high_score', String(currentScore)); } catch (e) {}
            if (onHighScoreChangeRef.current) onHighScoreChangeRef.current(currentScore);
        }
        playBlastSound();
        document.body.style.backgroundColor = '#FF1100';
        setTimeout(() => { document.body.style.backgroundColor = ''; }, BLAST_FLASH_DURATION);
        setFinalScore(currentScore);
        updateGameState(GAME_STATE.GAME_OVER);
        if (onGameOverRef.current) onGameOverRef.current(currentScore);
    };

    // --- Full restart ---
    const restartGame = () => {
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
        mineCountRef.current = INITIAL_MINE_COUNT;
        setMines([]);
        const dims = getContainerDims();
        const hole = randomHolePosition(dims.w || window.innerWidth, dims.h || window.innerHeight);
        setHoleStyles(hole);
        holeStylesRef.current = hole;
        updateGameState(GAME_STATE.PLAYING);
        triggerOverlay(1, { left: 40, top: 40 });
    };

    const pauseGame = () => {
        updateGameState(GAME_STATE.PAUSED);
    };

    const resumeGame = () => {
        updateGameState(GAME_STATE.PLAYING);
    };

    const toggleMute = () => {
        const next = !soundMuted;
        setSoundMuted(next);
        setMuted(next);
        return next;
    };

    // Expose controls to parent via ref
    useImperativeHandle(ref, () => ({
        pause: pauseGame,
        resume: resumeGame,
        restart: restartGame,
        toggleMute,
        isMuted: () => soundMuted,
    }));

    // --- Scoring/trajectory/mine logic called on every position update ---
    const lastAlignmentTimeRef = useRef(0);

    const onMove = useCallback((newLeft, newTop) => {
        const dims = getContainerDims();
        const W = dims.w || window.innerWidth;
        const H = dims.h || window.innerHeight;

        // Track trajectory in level 2+
        if (levelRef.current >= 2) {
            const nowMs = Date.now();
            if (nowMs - lastTrajectoryTimeRef.current > TRAJECTORY_SAMPLE_INTERVAL) {
                lastTrajectoryTimeRef.current = nowMs;
                const point = {
                    x: (newLeft / 100) * W + BLOCK_SIZE / 2,
                    y: (newTop / 100) * H + BLOCK_SIZE / 2,
                };
                if (trajectoryRef.current.length < MAX_TRAJECTORY_POINTS) {
                    trajectoryRef.current = [...trajectoryRef.current, point];
                    setTrajectoryPoints([...trajectoryRef.current]);
                }
            }
        }

        // Mine collision check (level 3+)
        if (levelRef.current >= 3) {
            const nowMs = Date.now();
            if (nowMs - lastMineHitTimeRef.current > MINE_HIT_DEBOUNCE &&
                wouldCollideWithMinesList(newLeft, newTop, minesRef.current, W, H)) {
                lastMineHitTimeRef.current = nowMs;
                handleMineBlast();
                return;
            }
        }

        // Scoring
        const currentTime = Date.now();
        if (currentTime - lastAlignmentTimeRef.current > SCORE_COOLDOWN) {
            const overlapPercentage = getOverlapPercentage();
            if (overlapPercentage > OVERLAP_THRESHOLD) {
                const newScore = scoreRef.current + 1;
                scoreRef.current = newScore;
                setScore(newScore);
                if (onScoreChangeRef.current) onScoreChangeRef.current(newScore);
                playScoreSound();

                if (newScore > highScoreRef.current) {
                    highScoreRef.current = newScore;
                    try { localStorage.setItem('tetruto_high_score', String(newScore)); } catch (e) {}
                    if (onHighScoreChangeRef.current) onHighScoreChangeRef.current(newScore);
                }

                let levelJustChanged = false;

                if (newScore >= LEVEL_2_THRESHOLD && levelRef.current < 2) {
                    overlayActiveRef.current = true;
                    levelRef.current = 2;
                    setLevel(2);
                    levelJustChanged = true;
                    if (onLevelChangeRef.current) onLevelChangeRef.current(2);
                    playLevelUpSound();
                }

                if (newScore >= LEVEL_3_THRESHOLD && levelRef.current < 3) {
                    overlayActiveRef.current = true;
                    levelRef.current = 3;
                    setLevel(3);
                    levelJustChanged = true;
                    if (onLevelChangeRef.current) onLevelChangeRef.current(3);
                    playLevelUpSound();
                }

                if (levelRef.current >= 2 && trajectoryRef.current.length > 0) {
                    hardBarriersRef.current = [...trajectoryRef.current];
                    barrierActiveRef.current = true;
                    setHardBarriers([...trajectoryRef.current]);
                }

                trajectoryRef.current = [];
                setTrajectoryPoints([]);

                document.body.style.backgroundColor = '#00FF00';
                setTimeout(() => { document.body.style.backgroundColor = ''; }, SCORE_FLASH_DURATION);

                if (!levelJustChanged) {
                    if (levelRef.current >= 3) {
                        mineCountRef.current += 1;
                    }
                    resetGame();
                }
                lastAlignmentTimeRef.current = currentTime;
            }
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // --- Wire up motion control ---
    useMotionControl({
        currentPosRef,
        overlayActiveRef,
        gameStateRef,
        barrierActiveRef,
        hardBarriersRef,
        getContainerDims,
        setShapeStyles,
        onMove,
    });

    // Trigger level 1 overlay when loading finishes
    useEffect(() => {
        if (!loading) triggerOverlay(1, { left: 40, top: 40 });
    }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

    // Trigger overlay when level advances to 2+
    useEffect(() => {
        if (level <= 1) return;
        const spawnPos = safeSpawnPosition() || { left: 40, top: 40 };
        const hole = safeHolePosition();
        const newHoleStyles = hole || holeStylesRef.current;
        if (hole) {
            setHoleStyles(hole);
            holeStylesRef.current = hole;
        }
        if (level === 3 && newHoleStyles && newHoleStyles.left.includes('px')) {
            const dims = getContainerDims();
            const W = dims.w || window.innerWidth;
            const H = dims.h || window.innerHeight;
            mineCountRef.current = INITIAL_MINE_COUNT;
            const initialMines = placeMines(INITIAL_MINE_COUNT, spawnPos, newHoleStyles, hardBarriersRef.current, W, H);
            minesRef.current = initialMines;
            setMines(initialMines);
        }
        triggerOverlay(level, spawnPos);
    }, [level]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div ref={containerRef} className={styles.gameContainer} id={styles.gameContainer} role="application" aria-label="TETRUTO game area">
            {loading ? (
                <div className={styles.loaderContainer}>
                    <BeatLoader color="#3498db" size={15} margin={4} />
                    <span className={styles.loaderText}>Loading</span>
                </div>
            ) : (
                <>
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
                        {gameState === GAME_STATE.GAME_OVER && ` Game over. Score ${finalScore}. Best ${highScoreRef.current}.`}
                    </div>

                    {showOverlay && (
                        <div className={styles.levelOverlay}>
                            <div className={styles.overlayLevelLabel}>Level {overlayLevel}</div>
                            <div className={styles.overlayRule}>{LEVEL_RULES[overlayLevel]}</div>
                            <div className={styles.overlayCountdown} key={countdown}>{countdown}</div>
                        </div>
                    )}

                    {/* Pause Menu */}
                    {gameState === GAME_STATE.PAUSED && (
                        <div className={styles.menuOverlay}>
                            <div className={styles.menuTitle}>PAUSED</div>
                            <button className={styles.menuButton} onClick={resumeGame}>Resume</button>
                            <button className={styles.menuButton} onClick={toggleMute}>Sound: {soundMuted ? 'OFF' : 'ON'}</button>
                            <button className={styles.menuButton} onClick={restartGame}>Restart</button>
                        </div>
                    )}

                    {/* Game Over Screen */}
                    {gameState === GAME_STATE.GAME_OVER && (
                        <div className={styles.menuOverlay}>
                            <div className={styles.menuTitle}>GAME OVER</div>
                            <div className={styles.menuScore}>Score: {finalScore}</div>
                            <div className={styles.menuScore}>Best: {highScoreRef.current}</div>
                            <button className={styles.menuButton} onClick={restartGame}>Play Again</button>
                        </div>
                    )}

                    {trajectoryPoints.map((pt, i) => (
                        <div
                            key={`traj-${i}`}
                            className={styles.trajectoryDot}
                            style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
                            aria-hidden="true"
                        />
                    ))}

                    {hardBarriers.map((pt, i) => (
                        <div
                            key={`barrier-${i}`}
                            className={styles.hardBarrier}
                            style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
                            aria-hidden="true"
                        />
                    ))}

                    {mines.map((m) => (
                        <div
                            key={`mine-${m.id}`}
                            className={styles.mine}
                            style={{ left: `${m.x}px`, top: `${m.y}px` }}
                            aria-hidden="true"
                        />
                    ))}

                    <div className={styles.shape} style={shapeStyles} aria-hidden="true"></div>
                    <div className={styles.hole} id={styles.hole} style={holeStyles} aria-hidden="true"></div>
                </>
            )}
        </div>
    );
});

Game.displayName = 'Game';

export default Game;
