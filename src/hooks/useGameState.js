import { useState, useRef, useEffect } from 'react';
import { GAME_STATE, INITIAL_MINE_COUNT } from '../constants';

/**
 * Hook that provides game state with both React state and refs for event handler access.
 */
export const useGameState = () => {
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

    // Refs mirror state for event handler access
    const scoreRef = useRef(0);
    const levelRef = useRef(1);
    const currentPosRef = useRef({ left: 40, top: 40 });
    const trajectoryRef = useRef([]);
    const hardBarriersRef = useRef([]);
    const minesRef = useRef([]);
    const mineCountRef = useRef(INITIAL_MINE_COUNT);
    const barrierActiveRef = useRef(false);
    const barrierScoreCountRef = useRef(0);
    const lastTrajectoryTimeRef = useRef(0);
    const overlayActiveRef = useRef(false);
    const overlayTimersRef = useRef([]);
    const highScoreRef = useRef(0);
    const holeStylesRef = useRef(null);
    const lastMineHitTimeRef = useRef(0);
    const gameStateRef = useRef(GAME_STATE.PLAYING);
    const rafIdRef = useRef(null);
    const pendingPosRef = useRef(null);

    // Load high score on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('tetruto_high_score');
            if (saved !== null) {
                const val = parseInt(saved, 10);
                if (!isNaN(val) && val > 0) highScoreRef.current = val;
            }
        } catch (e) {}
    }, []);

    return {
        // State
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
        // Refs
        scoreRef, levelRef, currentPosRef,
        trajectoryRef, hardBarriersRef, minesRef,
        mineCountRef, barrierActiveRef, barrierScoreCountRef,
        lastTrajectoryTimeRef, overlayActiveRef, overlayTimersRef,
        highScoreRef, holeStylesRef, lastMineHitTimeRef,
        gameStateRef, rafIdRef, pendingPosRef,
    };
};
