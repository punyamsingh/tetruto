import React, { useState, useEffect, useRef } from 'react';
import { BeatLoader } from 'react-spinners';
import styles from '../styles/game.module.css';
import { playScore, playLevelUp, playBlast, playCountdown, setMuted } from '../utils/sound';

const BLOCK_SIZE = 25;
const HOLE_SIZE = 30;
const BARRIER_HALF = 3.5;
const MINE_HALF = 7.5;
const PATH_CELL = 10;

const GAME_STATE = { PLAYING: 'PLAYING', PAUSED: 'PAUSED', GAME_OVER: 'GAME_OVER' };

const LEVEL_RULES = {
    1: 'Tilt to guide the block into the red hole',
    2: "Your path hardens into walls — don't get trapped",
    3: 'Mines lurk everywhere — one touch and it all resets',
};

const randomHolePosition = () => ({
    left: `${Math.floor(Math.random() * (window.innerWidth - HOLE_SIZE - 5))}px`,
    top: `${Math.floor(Math.random() * (window.innerHeight - HOLE_SIZE - 5))}px`,
});

const Game = ({ onScoreChange, onLevelChange, onHighScoreChange }) => {
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
    const [gameState, setGameState] = useState(GAME_STATE.PLAYING);
    const [finalScore, setFinalScore] = useState(0);
    const [soundMuted, setSoundMuted] = useState(false);

    const scoreRef = useRef(0);
    const levelRef = useRef(1);
    const currentPosRef = useRef({ left: 40, top: 40 });
    const trajectoryRef = useRef([]);
    const hardBarriersRef = useRef([]);
    const minesRef = useRef([]);
    const mineCountRef = useRef(3);
    const barrierActiveRef = useRef(false);
    const barrierScoreCountRef = useRef(0);
    const lastTrajectoryTimeRef = useRef(0);
    const onScoreChangeRef = useRef(onScoreChange);
    const onLevelChangeRef = useRef(onLevelChange);
    const onHighScoreChangeRef = useRef(onHighScoreChange);
    const overlayActiveRef = useRef(false);
    const overlayTimersRef = useRef([]);
    const highScoreRef = useRef(0);
    const holeStylesRef = useRef(null);
    const lastMineHitTimeRef = useRef(0);
    const gameStateRef = useRef(GAME_STATE.PLAYING);
    const rafIdRef = useRef(null);
    const pendingPosRef = useRef(null);

    useEffect(() => { onScoreChangeRef.current = onScoreChange; }, [onScoreChange]);
    useEffect(() => { onLevelChangeRef.current = onLevelChange; }, [onLevelChange]);
    useEffect(() => { onHighScoreChangeRef.current = onHighScoreChange; }, [onHighScoreChange]);

    // Load high score from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('tetruto_high_score');
            if (saved !== null) {
                const val = parseInt(saved, 10);
                if (!isNaN(val) && val > 0) {
                    highScoreRef.current = val;
                    if (onHighScoreChangeRef.current) onHighScoreChangeRef.current(val);
                }
            }
        } catch (e) {}
    }, []);

    useEffect(() => {
        const pos = randomHolePosition();
        setHoleStyles(pos);
        holeStylesRef.current = pos;
    }, []);

    useEffect(() => {
        const loadingTimeout = setTimeout(() => setLoading(false), 1500);
        return () => clearTimeout(loadingTimeout);
    }, []);

    useEffect(() => {
        return () => { overlayTimersRef.current.forEach(clearTimeout); };
    }, []);

    const wouldCollideWithBarriers = (newLeftPct, newTopPct) => {
        const barriers = hardBarriersRef.current;
        if (!barriers.length) return false;
        const blockLeft = (newLeftPct / 100) * window.innerWidth;
        const blockTop = (newTopPct / 100) * window.innerHeight;
        const blockRight = blockLeft + BLOCK_SIZE;
        const blockBottom = blockTop + BLOCK_SIZE;
        for (const b of barriers) {
            if (blockRight > b.x - BARRIER_HALF && blockLeft < b.x + BARRIER_HALF &&
                blockBottom > b.y - BARRIER_HALF && blockTop < b.y + BARRIER_HALF) return true;
        }
        return false;
    };

    const wouldCollideWithMinesList = (newLeftPct, newTopPct, mineList) => {
        if (!mineList.length) return false;
        const blockLeft = (newLeftPct / 100) * window.innerWidth;
        const blockTop = (newTopPct / 100) * window.innerHeight;
        const blockRight = blockLeft + BLOCK_SIZE;
        const blockBottom = blockTop + BLOCK_SIZE;
        for (const m of mineList) {
            if (blockRight > m.x - MINE_HALF && blockLeft < m.x + MINE_HALF &&
                blockBottom > m.y - MINE_HALF && blockTop < m.y + MINE_HALF) return true;
        }
        return false;
    };

    const wouldCollideWithMines = (newLeftPct, newTopPct) =>
        wouldCollideWithMinesList(newLeftPct, newTopPct, minesRef.current);

    // BFS: can the block reach the hole given current mines and barriers?
    const hasPathToHole = (blockPos, currentHoleStyles, currentMines, currentBarriers) => {
        const W = window.innerWidth;
        const H = window.innerHeight;
        const cols = Math.ceil(W / PATH_CELL);
        const rows = Math.ceil(H / PATH_CELL);

        const startPxX = (blockPos.left / 100) * W;
        const startPxY = (blockPos.top / 100) * H;
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

        const goalTolerance = Math.ceil(HOLE_SIZE / PATH_CELL);

        while (queue.length > 0) {
            const [col, row] = queue.shift();
            if (Math.abs(col - goalCol) <= goalTolerance && Math.abs(row - goalRow) <= goalTolerance) return true;
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

    // Place mines, avoiding block/hole/each-other and guaranteeing a path to hole
    const placeMines = (count, blockPos, currentHoleStyles, currentBarriers) => {
        const W = window.innerWidth;
        const H = window.innerHeight;
        const margin = MINE_HALF + 5;
        const blockPxX = (blockPos.left / 100) * W;
        const blockPxY = (blockPos.top / 100) * H;
        const holePxX = parseFloat(currentHoleStyles.left);
        const holePxY = parseFloat(currentHoleStyles.top);
        const buf = MINE_HALF + 20;

        const placed = [];

        for (let i = 0; i < count; i++) {
            for (let attempt = 0; attempt < 200; attempt++) {
                const x = margin + Math.random() * (W - 2 * margin);
                const y = margin + Math.random() * (H - 2 * margin);

                if (x > blockPxX - buf && x < blockPxX + BLOCK_SIZE + buf &&
                    y > blockPxY - buf && y < blockPxY + BLOCK_SIZE + buf) continue;

                if (x > holePxX - buf && x < holePxX + HOLE_SIZE + buf &&
                    y > holePxY - buf && y < holePxY + HOLE_SIZE + buf) continue;

                let overlaps = false;
                for (const m of placed) {
                    if (Math.abs(x - m.x) < MINE_HALF * 3.5 &&
                        Math.abs(y - m.y) < MINE_HALF * 3.5) { overlaps = true; break; }
                }
                if (overlaps) continue;

                const testMines = [...placed, { x, y }];
                if (!hasPathToHole(blockPos, currentHoleStyles, testMines, currentBarriers)) continue;

                placed.push({ x, y, id: Date.now() + i * 1000 + attempt });
                break;
            }
        }
        return placed;
    };

    const triggerOverlay = (lvl, spawnPos) => {
        overlayTimersRef.current.forEach(clearTimeout);
        overlayTimersRef.current = [];
        overlayActiveRef.current = true;
        setOverlayLevel(lvl);
        setCountdown(3);
        setShowOverlay(true);

        setShapeStyles({ left: `${spawnPos.left}%`, top: '-8%' });

        const t1 = setTimeout(() => { setCountdown(2); playCountdown(); }, 1000);
        const t2 = setTimeout(() => { setCountdown(1); playCountdown(); }, 2000);
        const t3 = setTimeout(() => {
            playCountdown();
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
            mineCountRef.current = 3;
            const initialMines = placeMines(3, spawnPos, newHoleStyles, hardBarriersRef.current);
            minesRef.current = initialMines;
            setMines(initialMines);
        }
        triggerOverlay(level, spawnPos);
    }, [level]); // eslint-disable-line react-hooks/exhaustive-deps

    // Ref-based overlap calculation (no DOM queries)
    const getOverlapPercentage = () => {
        const holePos = holeStylesRef.current;
        if (!holePos) return 0;
        const W = window.innerWidth;
        const H = window.innerHeight;
        const pos = currentPosRef.current;
        const blockLeft = (pos.left / 100) * W;
        const blockTop = (pos.top / 100) * H;
        const blockRight = blockLeft + BLOCK_SIZE;
        const blockBottom = blockTop + BLOCK_SIZE;
        const holeLeft = parseFloat(holePos.left);
        const holeTop = parseFloat(holePos.top);
        const holeRight = holeLeft + HOLE_SIZE;
        const holeBottom = holeTop + HOLE_SIZE;
        const overlapW = Math.max(0, Math.min(blockRight, holeRight) - Math.max(blockLeft, holeLeft));
        const overlapH = Math.max(0, Math.min(blockBottom, holeBottom) - Math.max(blockTop, holeTop));
        if (overlapW === 0 || overlapH === 0) return 0;
        return (overlapW * overlapH) / (BLOCK_SIZE * BLOCK_SIZE) * 100;
    };

    useEffect(() => {
        const sensitivity = 10;
        const cooldownDuration = 1000;
        const targetFrameMs = 16.67;
        let lastAlignmentTime = 0;
        let lastEventTime = 0;

        const updatePosition = (event) => {
            if (overlayActiveRef.current || gameStateRef.current !== GAME_STATE.PLAYING) return;

            const now = performance.now();
            const deltaTime = lastEventTime > 0 ? Math.min(now - lastEventTime, 100) : targetFrameMs;
            lastEventTime = now;
            const dtFactor = deltaTime / targetFrameMs;

            const x = (event.gamma / sensitivity) * dtFactor;
            const y = (event.beta / sensitivity) * dtFactor;

            const prev = currentPosRef.current;
            let newLeft = Math.max(0, Math.min(100, prev.left + x));
            let newTop = Math.max(0, Math.min(100, prev.top + y));

            // Sliding collision against hardened barriers (level 2+)
            if (barrierActiveRef.current) {
                if (wouldCollideWithBarriers(newLeft, prev.top)) newLeft = prev.left;
                if (wouldCollideWithBarriers(prev.left, newTop)) newTop = prev.top;
                if (wouldCollideWithBarriers(newLeft, newTop)) {
                    newLeft = prev.left;
                    newTop = prev.top;
                }
            }

            currentPosRef.current = { left: newLeft, top: newTop };
            pendingPosRef.current = { left: newLeft, top: newTop };
            if (!rafIdRef.current) {
                rafIdRef.current = requestAnimationFrame(() => {
                    const pos = pendingPosRef.current;
                    if (pos) setShapeStyles({ left: `${pos.left}%`, top: `${pos.top}%` });
                    rafIdRef.current = null;
                });
            }

            // Track trajectory in level 2+
            if (levelRef.current >= 2) {
                const nowMs = Date.now();
                if (nowMs - lastTrajectoryTimeRef.current > 100) {
                    lastTrajectoryTimeRef.current = nowMs;
                    const point = {
                        x: (newLeft / 100) * window.innerWidth + BLOCK_SIZE / 2,
                        y: (newTop / 100) * window.innerHeight + BLOCK_SIZE / 2,
                    };
                    if (trajectoryRef.current.length < 500) {
                        trajectoryRef.current = [...trajectoryRef.current, point];
                        setTrajectoryPoints([...trajectoryRef.current]);
                    }
                }
            }

            // Mine collision check (level 3+)
            if (levelRef.current >= 3) {
                const nowMs = Date.now();
                if (nowMs - lastMineHitTimeRef.current > 1500 && wouldCollideWithMines(newLeft, newTop)) {
                    lastMineHitTimeRef.current = nowMs;
                    handleMineBlast();
                    return;
                }
            }

            // Scoring
            const currentTime = Date.now();
            if (currentTime - lastAlignmentTime > cooldownDuration) {
                const overlapPercentage = getOverlapPercentage();
                if (overlapPercentage > 2) {
                    const newScore = scoreRef.current + 1;
                    scoreRef.current = newScore;
                    setScore(newScore);
                    onScoreChangeRef.current(newScore);
                    playScore();

                    if (newScore > highScoreRef.current) {
                        highScoreRef.current = newScore;
                        try { localStorage.setItem('tetruto_high_score', String(newScore)); } catch (e) {}
                        if (onHighScoreChangeRef.current) onHighScoreChangeRef.current(newScore);
                    }

                    let levelJustChanged = false;

                    if (newScore >= 3 && levelRef.current < 2) {
                        overlayActiveRef.current = true;
                        levelRef.current = 2;
                        setLevel(2);
                        levelJustChanged = true;
                        if (onLevelChangeRef.current) onLevelChangeRef.current(2);
                        playLevelUp();
                    }

                    if (newScore >= 10 && levelRef.current < 3) {
                        overlayActiveRef.current = true;
                        levelRef.current = 3;
                        setLevel(3);
                        levelJustChanged = true;
                        if (onLevelChangeRef.current) onLevelChangeRef.current(3);
                        playLevelUp();
                    }

                    if (levelRef.current >= 2 && trajectoryRef.current.length > 0) {
                        hardBarriersRef.current = [...trajectoryRef.current];
                        barrierActiveRef.current = true;
                        setHardBarriers([...trajectoryRef.current]);
                    }

                    trajectoryRef.current = [];
                    setTrajectoryPoints([]);

                    document.body.style.backgroundColor = '#00FF00';
                    setTimeout(() => { document.body.style.backgroundColor = ''; }, 500);

                    if (!levelJustChanged) {
                        if (levelRef.current >= 3) {
                            mineCountRef.current += 1;
                        }
                        resetGame();
                    }
                    lastAlignmentTime = currentTime;
                }
            }
        };

        // Keyboard controls for desktop/development
        const handleKeyDown = (e) => {
            if (gameStateRef.current !== GAME_STATE.PLAYING || overlayActiveRef.current) return;
            const step = 2;
            const fakeEvent = { gamma: 0, beta: 0 };
            if (e.key === 'ArrowLeft') fakeEvent.gamma = -step * sensitivity;
            else if (e.key === 'ArrowRight') fakeEvent.gamma = step * sensitivity;
            else if (e.key === 'ArrowUp') fakeEvent.beta = -step * sensitivity;
            else if (e.key === 'ArrowDown') fakeEvent.beta = step * sensitivity;
            else return;
            e.preventDefault();
            updatePosition(fakeEvent);
        };

        window.addEventListener('deviceorientation', updatePosition);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('deviceorientation', updatePosition);
            window.removeEventListener('keydown', handleKeyDown);
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const holeCollidesWithBarriers = (leftPx, topPx) => {
        const barriers = hardBarriersRef.current;
        if (!barriers.length) return false;
        const holeRight = leftPx + HOLE_SIZE;
        const holeBottom = topPx + HOLE_SIZE;
        for (const b of barriers) {
            if (holeRight > b.x - BARRIER_HALF && leftPx < b.x + BARRIER_HALF &&
                holeBottom > b.y - BARRIER_HALF && topPx < b.y + BARRIER_HALF) return true;
        }
        return false;
    };

    const safeSpawnPosition = () => {
        const candidates = [{ left: 40, top: 40 }];
        for (let i = 0; i < 50; i++) {
            candidates.push({ left: 5 + Math.random() * 85, top: 5 + Math.random() * 85 });
        }
        for (const pos of candidates) {
            if (!wouldCollideWithBarriers(pos.left, pos.top) &&
                !wouldCollideWithMinesList(pos.left, pos.top, minesRef.current)) return pos;
        }
        return null;
    };

    const safeHolePosition = () => {
        for (let i = 0; i < 50; i++) {
            const left = Math.floor(Math.random() * (window.innerWidth - HOLE_SIZE - 5));
            const top = Math.floor(Math.random() * (window.innerHeight - HOLE_SIZE - 5));
            if (!holeCollidesWithBarriers(left, top)) return { left: `${left}px`, top: `${top}px` };
        }
        return null;
    };

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
            const newMines = placeMines(mineCountRef.current, spawnPos, newHoleStyles, hardBarriersRef.current);
            minesRef.current = newMines;
            setMines(newMines);
        }
    };

    const handleMineBlast = () => {
        const currentScore = scoreRef.current;
        if (currentScore > highScoreRef.current) {
            highScoreRef.current = currentScore;
            try { localStorage.setItem('tetruto_high_score', String(currentScore)); } catch (e) {}
            if (onHighScoreChangeRef.current) onHighScoreChangeRef.current(currentScore);
        }
        playBlast();
        document.body.style.backgroundColor = '#FF1100';
        setTimeout(() => { document.body.style.backgroundColor = ''; }, 700);
        setFinalScore(currentScore);
        gameStateRef.current = GAME_STATE.GAME_OVER;
        setGameState(GAME_STATE.GAME_OVER);
    };

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
        mineCountRef.current = 3;
        setMines([]);
        const hole = randomHolePosition();
        setHoleStyles(hole);
        holeStylesRef.current = hole;
        gameStateRef.current = GAME_STATE.PLAYING;
        setGameState(GAME_STATE.PLAYING);
        const spawnPos = { left: 40, top: 40 };
        triggerOverlay(1, spawnPos);
    };

    const pauseGame = () => {
        gameStateRef.current = GAME_STATE.PAUSED;
        setGameState(GAME_STATE.PAUSED);
    };

    const resumeGame = () => {
        gameStateRef.current = GAME_STATE.PLAYING;
        setGameState(GAME_STATE.PLAYING);
    };

    return (
        <div className={styles.gameContainer} id={styles.gameContainer} role="application" aria-label="TETRUTO game area">
            {loading ? (
                <div className={styles.loaderContainer}>
                    <BeatLoader color="#3498db" size={15} margin={4} />
                    <span className={styles.loaderText}>Loading</span>
                </div>
            ) : (
                <>
                    {showOverlay && (
                        <div className={styles.levelOverlay}>
                            <div className={styles.overlayLevelLabel}>Level {overlayLevel}</div>
                            <div className={styles.overlayRule}>{LEVEL_RULES[overlayLevel]}</div>
                            <div className={styles.overlayCountdown} key={countdown}>{countdown}</div>
                        </div>
                    )}

                    {gameState === GAME_STATE.PLAYING && !showOverlay && (
                        <button className={styles.pauseButton} onClick={pauseGame} aria-label="Pause game">⏸</button>
                    )}

                    {gameState === GAME_STATE.PAUSED && (
                        <div className={styles.menuOverlay}>
                            <div className={styles.menuTitle}>PAUSED</div>
                            <button className={styles.menuButton} onClick={resumeGame}>Resume</button>
                            <button className={styles.menuButton} onClick={() => {
                                const next = !soundMuted;
                                setSoundMuted(next);
                                setMuted(next);
                            }}>Sound: {soundMuted ? 'OFF' : 'ON'}</button>
                            <button className={styles.menuButton} onClick={restartGame}>Restart</button>
                        </div>
                    )}

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
                        />
                    ))}

                    {hardBarriers.map((pt, i) => (
                        <div
                            key={`barrier-${i}`}
                            className={styles.hardBarrier}
                            style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
                        />
                    ))}

                    {mines.map((m) => (
                        <div
                            key={`mine-${m.id}`}
                            className={styles.mine}
                            style={{ left: `${m.x}px`, top: `${m.y}px` }}
                        />
                    ))}

                    <div className={styles.shape} style={shapeStyles} aria-label="Player block" role="img"></div>
                    <div className={styles.hole} id={styles.hole} style={holeStyles} aria-label="Target hole" role="img"></div>
                </>
            )}
        </div>
    );
};

export default Game;
