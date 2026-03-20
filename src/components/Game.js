import React,{ useState,useEffect,useRef } from 'react';
import { BeatLoader } from 'react-spinners';
import styles from '../styles/game.module.css';

const randomHolePosition = () => ({
    left: `${Math.floor(Math.random() * (window.innerWidth - 70))}px`,
    top: `${Math.floor(Math.random() * (window.innerHeight - 70))}px`,
});

const LEVEL_RULES = {
    1: 'Tilt to guide the block into the red hole',
    2: 'Your path hardens into walls — don\'t get trapped',
    3: 'Mines lurk everywhere — one touch and it all resets',
};

const BARRIER_HALF = 7;
const MINE_HALF = 15;   // collision/placement radius for mines
const PATH_CELL = 20;   // BFS grid cell size in px

const Game = ({ onScoreChange,onLevelChange,onHighScoreChange }) => {
    const [loading,setLoading] = useState(true);
    const [score,setScore] = useState(0);
    const [shapeStyles,setShapeStyles] = useState({ left: '40%',top: '40%' });
    const [holeStyles,setHoleStyles] = useState({ left: '60%',top: '60%' });
    const [level,setLevel] = useState(1);
    const [trajectoryPoints,setTrajectoryPoints] = useState([]);
    const [hardBarriers,setHardBarriers] = useState([]);
    const [mines,setMines] = useState([]);
    const [showOverlay,setShowOverlay] = useState(false);
    const [countdown,setCountdown] = useState(3);
    const [overlayLevel,setOverlayLevel] = useState(1);

    // Refs for mutable game state accessed inside event handler
    const scoreRef = useRef(0);
    const levelRef = useRef(1);
    const currentPosRef = useRef({ left: 40,top: 40 });
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
    const holeStylesRef = useRef(null);   // always pixel-valued once game starts
    const lastMineHitTimeRef = useRef(0);

    useEffect(() => { onScoreChangeRef.current = onScoreChange; },[onScoreChange]);
    useEffect(() => { onLevelChangeRef.current = onLevelChange; },[onLevelChange]);
    useEffect(() => { onHighScoreChangeRef.current = onHighScoreChange; },[onHighScoreChange]);

    // Load high score from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('tetruto_high_score');
            if (saved !== null) {
                const val = parseInt(saved,10);
                if (!isNaN(val) && val > 0) {
                    highScoreRef.current = val;
                    if (onHighScoreChangeRef.current) onHighScoreChangeRef.current(val);
                }
            }
        } catch (e) {}
    },[]);

    useEffect(() => {
        const pos = randomHolePosition();
        setHoleStyles(pos);
        holeStylesRef.current = pos;
    },[]);

    useEffect(() => {
        const loadingTimeout = setTimeout(() => {
            setLoading(false);
        },1500);
        return () => clearTimeout(loadingTimeout);
    },[]);

    // Cleanup overlay timers on unmount
    useEffect(() => {
        return () => { overlayTimersRef.current.forEach(clearTimeout); };
    },[]);

    const wouldCollideWithBarriers = (newLeftPct,newTopPct) => {
        const barriers = hardBarriersRef.current;
        if (!barriers.length) return false;

        const blockLeft = (newLeftPct / 100) * window.innerWidth;
        const blockTop = (newTopPct / 100) * window.innerHeight;
        const blockRight = blockLeft + 50;
        const blockBottom = blockTop + 50;

        for (const b of barriers) {
            if (
                blockRight > b.x - BARRIER_HALF &&
                blockLeft < b.x + BARRIER_HALF &&
                blockBottom > b.y - BARRIER_HALF &&
                blockTop < b.y + BARRIER_HALF
            ) {
                return true;
            }
        }
        return false;
    };

    const wouldCollideWithMinesList = (newLeftPct,newTopPct,mineList) => {
        if (!mineList.length) return false;
        const blockLeft = (newLeftPct / 100) * window.innerWidth;
        const blockTop = (newTopPct / 100) * window.innerHeight;
        const blockRight = blockLeft + 50;
        const blockBottom = blockTop + 50;
        for (const m of mineList) {
            if (
                blockRight > m.x - MINE_HALF &&
                blockLeft < m.x + MINE_HALF &&
                blockBottom > m.y - MINE_HALF &&
                blockTop < m.y + MINE_HALF
            ) {
                return true;
            }
        }
        return false;
    };

    const wouldCollideWithMines = (newLeftPct,newTopPct) =>
        wouldCollideWithMinesList(newLeftPct,newTopPct,minesRef.current);

    // BFS: can the block reach the hole given current mines and barriers?
    const hasPathToHole = (blockPos,currentHoleStyles,currentMines,currentBarriers) => {
        const W = window.innerWidth;
        const H = window.innerHeight;
        const cols = Math.ceil(W / PATH_CELL);
        const rows = Math.ceil(H / PATH_CELL);

        const startPxX = (blockPos.left / 100) * W;
        const startPxY = (blockPos.top / 100) * H;
        const holePxX = parseFloat(currentHoleStyles.left);
        const holePxY = parseFloat(currentHoleStyles.top);

        const startCol = Math.max(0,Math.min(cols - 1,Math.floor(startPxX / PATH_CELL)));
        const startRow = Math.max(0,Math.min(rows - 1,Math.floor(startPxY / PATH_CELL)));
        const goalCol  = Math.max(0,Math.min(cols - 1,Math.floor(holePxX  / PATH_CELL)));
        const goalRow  = Math.max(0,Math.min(rows - 1,Math.floor(holePxY  / PATH_CELL)));

        const isBlocked = (col,row) => {
            const bLeft   = col * PATH_CELL;
            const bTop    = row * PATH_CELL;
            const bRight  = bLeft + 50;
            const bBottom = bTop  + 50;
            for (const m of currentMines) {
                if (bRight > m.x - MINE_HALF && bLeft < m.x + MINE_HALF &&
                    bBottom > m.y - MINE_HALF && bTop  < m.y + MINE_HALF) return true;
            }
            for (const b of currentBarriers) {
                if (bRight > b.x - BARRIER_HALF && bLeft < b.x + BARRIER_HALF &&
                    bBottom > b.y - BARRIER_HALF && bTop  < b.y + BARRIER_HALF) return true;
            }
            return false;
        };

        if (isBlocked(startCol,startRow)) return false;

        const visited = new Set();
        const queue = [[startCol,startRow]];
        visited.add(`${startCol},${startRow}`);

        while (queue.length > 0) {
            const [col,row] = queue.shift();
            // Close enough to goal (±3 cells ≈ ±60px, covers the 60×60 hole)
            if (Math.abs(col - goalCol) <= 3 && Math.abs(row - goalRow) <= 3) return true;
            for (const [dc,dr] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                const nc = col + dc;
                const nr = row + dr;
                if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
                const key = `${nc},${nr}`;
                if (visited.has(key)) continue;
                if (isBlocked(nc,nr)) continue;
                visited.add(key);
                queue.push([nc,nr]);
            }
        }
        return false;
    };

    // Place `count` mines, avoiding block/hole/each-other and guaranteeing a path to hole
    const placeMines = (count,blockPos,currentHoleStyles,currentBarriers) => {
        const W = window.innerWidth;
        const H = window.innerHeight;
        const margin = MINE_HALF + 5;
        const blockPxX = (blockPos.left / 100) * W;
        const blockPxY = (blockPos.top  / 100) * H;
        const holePxX  = parseFloat(currentHoleStyles.left);
        const holePxY  = parseFloat(currentHoleStyles.top);
        const buf = MINE_HALF + 40;

        const placed = [];

        for (let i = 0; i < count; i++) {
            for (let attempt = 0; attempt < 200; attempt++) {
                const x = margin + Math.random() * (W - 2 * margin);
                const y = margin + Math.random() * (H - 2 * margin);

                // Keep away from block spawn
                if (x > blockPxX - buf && x < blockPxX + 50 + buf &&
                    y > blockPxY - buf && y < blockPxY + 50 + buf) continue;

                // Keep away from hole
                if (x > holePxX - buf && x < holePxX + 60 + buf &&
                    y > holePxY - buf && y < holePxY + 60 + buf) continue;

                // Don't cluster with existing placed mines
                let overlaps = false;
                for (const m of placed) {
                    if (Math.abs(x - m.x) < MINE_HALF * 3.5 &&
                        Math.abs(y - m.y) < MINE_HALF * 3.5) { overlaps = true; break; }
                }
                if (overlaps) continue;

                // Ensure a path still exists if we add this mine
                const testMines = [...placed,{ x,y }];
                if (!hasPathToHole(blockPos,currentHoleStyles,testMines,currentBarriers)) continue;

                placed.push({ x,y,id: Date.now() + i * 1000 + attempt });
                break;
                // If all 200 attempts fail, we simply skip this mine
                // (fewer mines is safer than blocking the only path)
            }
        }
        return placed;
    };

    const triggerOverlay = (lvl,spawnPos) => {
        overlayTimersRef.current.forEach(clearTimeout);
        overlayTimersRef.current = [];

        overlayActiveRef.current = true;
        setOverlayLevel(lvl);
        setCountdown(3);
        setShowOverlay(true);

        // Move block off-screen above viewport (no transition)
        setShapeStyles({ left: `${spawnPos.left}%`,top: '-8%' });

        const t1 = setTimeout(() => setCountdown(2),1000);
        const t2 = setTimeout(() => setCountdown(1),2000);
        const t3 = setTimeout(() => {
            setShowOverlay(false);
            // Animate block dropping in with spring easing
            setShapeStyles({
                left: `${spawnPos.left}%`,
                top: `${spawnPos.top}%`,
                transition: 'top 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
            });
            currentPosRef.current = spawnPos;
            const t4 = setTimeout(() => {
                overlayActiveRef.current = false;
                setShapeStyles({ left: `${spawnPos.left}%`,top: `${spawnPos.top}%` });
            },600);
            overlayTimersRef.current = [t4];
        },3000);

        overlayTimersRef.current = [t1,t2,t3];
    };

    // Trigger level 1 overlay when loading finishes
    useEffect(() => {
        if (!loading) {
            triggerOverlay(1,{ left: 40,top: 40 });
        }
    },[loading]); // eslint-disable-line react-hooks/exhaustive-deps

    // Trigger overlay when level advances to 2+
    useEffect(() => {
        if (level <= 1) return;
        const spawnPos = safeSpawnPosition() || { left: 40,top: 40 };
        const hole = safeHolePosition();
        const newHoleStyles = hole || holeStylesRef.current;
        if (hole) {
            setHoleStyles(hole);
            holeStylesRef.current = hole;
        }

        if (level === 3 && newHoleStyles && newHoleStyles.left.includes('px')) {
            mineCountRef.current = 3;
            const initialMines = placeMines(3,spawnPos,newHoleStyles,hardBarriersRef.current);
            minesRef.current = initialMines;
            setMines(initialMines);
        }

        triggerOverlay(level,spawnPos);
    },[level]); // eslint-disable-line react-hooks/exhaustive-deps

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

            // Track trajectory in level 2+ always
            if (levelRef.current >= 2) {
                const now = Date.now();
                if (now - lastTrajectoryTimeRef.current > 100) {
                    lastTrajectoryTimeRef.current = now;
                    const point = {
                        x: (newLeft / 100) * window.innerWidth  + 25,
                        y: (newTop  / 100) * window.innerHeight + 25,
                    };
                    trajectoryRef.current = [...trajectoryRef.current,point];
                    setTrajectoryPoints([...trajectoryRef.current]);
                }
            }

            // Mine collision check (level 3 only)
            if (levelRef.current >= 3) {
                const now = Date.now();
                if (now - lastMineHitTimeRef.current > 1500 && wouldCollideWithMines(newLeft,newTop)) {
                    lastMineHitTimeRef.current = now;
                    handleMineBlast();
                    return;
                }
            }

            const currentTime = Date.now();
            if (currentTime - lastAlignmentTime > cooldownDuration && isInsideHole()) {
                const overlapPercentage = calculateOverlapPercentage();
                if (overlapPercentage > 10) {
                    const newScore = scoreRef.current + 1;
                    scoreRef.current = newScore;
                    setScore(newScore);
                    onScoreChangeRef.current(newScore);

                    // Update high score
                    if (newScore > highScoreRef.current) {
                        highScoreRef.current = newScore;
                        try { localStorage.setItem('tetruto_high_score',String(newScore)); } catch (e) {}
                        if (onHighScoreChangeRef.current) onHighScoreChangeRef.current(newScore);
                    }

                    let levelJustChanged = false;

                    // Advance to level 2 at 3 points
                    if (newScore >= 3 && levelRef.current < 2) {
                        overlayActiveRef.current = true;
                        levelRef.current = 2;
                        setLevel(2);
                        levelJustChanged = true;
                        if (onLevelChangeRef.current) onLevelChangeRef.current(2);
                    }

                    // Advance to level 3 at 10 points
                    if (newScore >= 10 && levelRef.current < 3) {
                        overlayActiveRef.current = true;
                        levelRef.current = 3;
                        setLevel(3);
                        levelJustChanged = true;
                        if (onLevelChangeRef.current) onLevelChangeRef.current(3);
                    }

                    // Trajectory hardening logic (level 2+)
                    if (levelRef.current >= 2 && trajectoryRef.current.length > 0) {
                        hardBarriersRef.current = [...trajectoryRef.current];
                        barrierActiveRef.current = true;
                        setHardBarriers([...trajectoryRef.current]);
                    }

                    // Reset trajectory for next round
                    trajectoryRef.current = [];
                    setTrajectoryPoints([]);

                    document.body.style.backgroundColor = '#00FF00';
                    setTimeout(() => {
                        document.body.style.backgroundColor = '';
                    },500);

                    // Let the level useEffect handle reset on level-up
                    if (!levelJustChanged) {
                        // In level 3, increase mine count each round
                        if (levelRef.current >= 3) {
                            mineCountRef.current += 1;
                        }
                        resetGame();
                    }
                    lastAlignmentTime = currentTime;
                }
            }
        };

        window.addEventListener('deviceorientation',updatePosition);

        return () => {
            window.removeEventListener('deviceorientation',updatePosition);
        };
    },[]); // eslint-disable-line react-hooks/exhaustive-deps

    const holeCollidesWithBarriers = (leftPx,topPx) => {
        const barriers = hardBarriersRef.current;
        if (!barriers.length) return false;
        const holeRight  = leftPx + 60;
        const holeBottom = topPx  + 60;
        for (const b of barriers) {
            if (
                holeRight  > b.x - BARRIER_HALF &&
                leftPx     < b.x + BARRIER_HALF &&
                holeBottom > b.y - BARRIER_HALF &&
                topPx      < b.y + BARRIER_HALF
            ) {
                return true;
            }
        }
        return false;
    };

    const safeSpawnPosition = () => {
        const candidates = [{ left: 40,top: 40 }];
        for (let i = 0; i < 50; i++) {
            candidates.push({ left: 5 + Math.random() * 85,top: 5 + Math.random() * 85 });
        }
        for (const pos of candidates) {
            const barrierSafe = !wouldCollideWithBarriers(pos.left,pos.top);
            const mineSafe    = !wouldCollideWithMinesList(pos.left,pos.top,minesRef.current);
            if (barrierSafe && mineSafe) return pos;
        }
        return null;
    };

    const safeHolePosition = () => {
        for (let i = 0; i < 50; i++) {
            const left = Math.floor(Math.random() * (window.innerWidth  - 70));
            const top  = Math.floor(Math.random() * (window.innerHeight - 70));
            if (!holeCollidesWithBarriers(left,top)) {
                return { left: `${left}px`,top: `${top}px` };
            }
        }
        return null;
    };

    const resetGame = () => {
        const pos = safeSpawnPosition();
        if (pos) {
            currentPosRef.current = pos;
            setShapeStyles({ left: `${pos.left}%`,top: `${pos.top}%` });
        }

        const hole = safeHolePosition();
        const newHoleStyles = hole || holeStylesRef.current;
        if (hole) {
            setHoleStyles(hole);
            holeStylesRef.current = hole;
        }

        // Re-place mines in level 3 after each successful score
        if (levelRef.current >= 3 && newHoleStyles && newHoleStyles.left && newHoleStyles.left.includes('px')) {
            const spawnPos = pos || currentPosRef.current;
            const newMines = placeMines(mineCountRef.current,spawnPos,newHoleStyles,hardBarriersRef.current);
            minesRef.current = newMines;
            setMines(newMines);
        }
    };

    // Full game reset on mine blast — back to level 1, score 0, high score preserved
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

    return (
        <div className={styles.gameContainer} id={styles.gameContainer}>
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

                    {/* Trajectory trail: soft blue dots showing where block has been */}
                    {trajectoryPoints.map((pt,i) => (
                        <div
                            key={`traj-${i}`}
                            className={styles.trajectoryDot}
                            style={{ left: `${pt.x}px`,top: `${pt.y}px` }}
                        />
                    ))}

                    {/* Hardened barriers: solid red dots that block movement */}
                    {hardBarriers.map((pt,i) => (
                        <div
                            key={`barrier-${i}`}
                            className={styles.hardBarrier}
                            style={{ left: `${pt.x}px`,top: `${pt.y}px` }}
                        />
                    ))}

                    {/* Mines: touch = blast */}
                    {mines.map((m) => (
                        <div
                            key={`mine-${m.id}`}
                            className={styles.mine}
                            style={{ left: `${m.x}px`,top: `${m.y}px` }}
                        />
                    ))}

                    <div className={styles.shape} style={shapeStyles}></div>
                    <div className={styles.hole} id={styles.hole} style={holeStyles}></div>
                </>
            )}
        </div>
    );
};

export default Game;
