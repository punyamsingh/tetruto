import React,{ useState,useEffect,useRef } from 'react';
import { BeatLoader } from 'react-spinners';
import styles from '../styles/game.module.css';

const randomHolePosition = () => ({
    left: `${Math.floor(Math.random() * (window.innerWidth - 70))}px`,
    top: `${Math.floor(Math.random() * (window.innerHeight - 70))}px`,
});

const Game = ({ onScoreChange,onLevelChange }) => {
    const [loading,setLoading] = useState(true);
    const [score,setScore] = useState(0);
    const [shapeStyles,setShapeStyles] = useState({
        left: '40%',
        top: '40%',
    });
    const [holeStyles,setHoleStyles] = useState({ left: '60%', top: '60%' });
    const [level,setLevel] = useState(1);
    const [trajectoryPoints,setTrajectoryPoints] = useState([]);
    const [hardBarriers,setHardBarriers] = useState([]);

    // Refs for mutable game state accessed inside event handler
    const scoreRef = useRef(0);
    const levelRef = useRef(1);
    const currentPosRef = useRef({ left: 40,top: 40 });
    const trajectoryRef = useRef([]);
    const hardBarriersRef = useRef([]);
    const barrierActiveRef = useRef(false);
    const lastTrajectoryTimeRef = useRef(0);

    useEffect(() => {
        setHoleStyles(randomHolePosition());
    },[]);

    useEffect(() => {
        const loadingTimeout = setTimeout(() => {
            setLoading(false);
        },1500);

        return () => {
            clearTimeout(loadingTimeout);
        };
    },[]);

    // Half-size of each barrier dot used for collision bounding box
    const BARRIER_HALF = 7;

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

    useEffect(() => {
        const sensitivity = 10;
        const cooldownDuration = 1000;

        let lastAlignmentTime = 0;

        const updatePosition = (event) => {
            const x = event.gamma / sensitivity;
            const y = event.beta / sensitivity;

            const prev = currentPosRef.current;
            let newLeft = Math.max(0,Math.min(100,prev.left + x));
            let newTop = Math.max(0,Math.min(100,prev.top + y));

            // Sliding collision against hardened barriers (level 2)
            if (barrierActiveRef.current) {
                if (wouldCollideWithBarriers(newLeft,prev.top)) newLeft = prev.left;
                if (wouldCollideWithBarriers(prev.left,newTop)) newTop = prev.top;
            }

            currentPosRef.current = { left: newLeft,top: newTop };
            setShapeStyles({ left: `${newLeft}%`,top: `${newTop}%` });

            // Track trajectory in level 2 while no barrier is active
            if (levelRef.current >= 2 && !barrierActiveRef.current) {
                const now = Date.now();
                if (now - lastTrajectoryTimeRef.current > 100) {
                    lastTrajectoryTimeRef.current = now;
                    const point = {
                        x: (newLeft / 100) * window.innerWidth + 25,
                        y: (newTop / 100) * window.innerHeight + 25,
                    };
                    trajectoryRef.current = [...trajectoryRef.current,point];
                    setTrajectoryPoints([...trajectoryRef.current]);
                }
            }

            const currentTime = Date.now();
            if (currentTime - lastAlignmentTime > cooldownDuration && isInsideHole()) {
                const overlapPercentage = calculateOverlapPercentage();
                if (overlapPercentage > 20) {
                    const newScore = scoreRef.current + 1;
                    scoreRef.current = newScore;
                    setScore(newScore);
                    onScoreChange(newScore);

                    // Advance to level 2 at 10 points
                    if (newScore >= 10 && levelRef.current < 2) {
                        levelRef.current = 2;
                        setLevel(2);
                        if (onLevelChange) onLevelChange(2);
                    }

                    // Trajectory hardening logic (level 2 only)
                    if (levelRef.current >= 2) {
                        if (!barrierActiveRef.current) {
                            // Harden the path the player traced
                            if (trajectoryRef.current.length > 0) {
                                hardBarriersRef.current = [...trajectoryRef.current];
                                barrierActiveRef.current = true;
                                setHardBarriers([...trajectoryRef.current]);
                            }
                        } else {
                            // Clear barriers once next target is hit
                            hardBarriersRef.current = [];
                            barrierActiveRef.current = false;
                            setHardBarriers([]);
                        }
                    }

                    // Reset trajectory for next round
                    trajectoryRef.current = [];
                    setTrajectoryPoints([]);

                    document.body.style.backgroundColor = '#00FF00';
                    setTimeout(() => {
                        document.body.style.backgroundColor = '';
                    },500);

                    resetGame();
                    lastAlignmentTime = currentTime;
                }
            }
        };

        window.addEventListener('deviceorientation',updatePosition);

        return () => {
            window.removeEventListener('deviceorientation',updatePosition);
        };
    },[onScoreChange,onLevelChange]);

    const resetGame = () => {
        currentPosRef.current = { left: 40,top: 40 };
        setShapeStyles({
            left: '40%',
            top: '40%',
        });
        setHoleStyles(randomHolePosition());
    };

    const isInsideHole = () => {
        const holeElement = document.getElementById(styles.hole);
        if (!holeElement) return false;

        const holeRect = holeElement.getBoundingClientRect();
        const shapeRect = document.querySelector(`.${styles.shape}`).getBoundingClientRect();

        return (
            shapeRect.left >= holeRect.left &&
            shapeRect.right <= holeRect.right &&
            shapeRect.top >= holeRect.top &&
            shapeRect.bottom <= holeRect.bottom
        );
    };

    const calculateOverlapPercentage = () => {
        const holeElement = document.getElementById(styles.hole);
        const shapeElement = document.querySelector(`.${styles.shape}`);

        if (!holeElement || !shapeElement) return 0;

        const holeRect = holeElement.getBoundingClientRect();
        const shapeRect = shapeElement.getBoundingClientRect();

        const overlapWidth = Math.max(0,Math.min(shapeRect.right,holeRect.right) - Math.max(shapeRect.left,holeRect.left));
        const overlapHeight = Math.max(0,Math.min(shapeRect.bottom,holeRect.bottom) - Math.max(shapeRect.top,holeRect.top));

        const overlapArea = overlapWidth * overlapHeight;
        const shapeArea = (shapeRect.right - shapeRect.left) * (shapeRect.bottom - shapeRect.top);

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

                    <div className={styles.shape} style={shapeStyles}></div>
                    <div className={styles.hole} id={styles.hole} style={holeStyles}></div>
                </>
            )}
        </div>
    );
};

export default Game;
