import { useEffect, useRef } from 'react';
import { SENSITIVITY, BASE_FRAME_MS, GAME_STATE } from '../constants';
import { wouldCollideWithBarriers } from '../utils/collision';

/**
 * Hook that manages device orientation input, keyboard controls,
 * delta-time normalization, and RAF-batched rendering.
 *
 * @param {Object} params
 * @param {React.RefObject} params.currentPosRef - Current block position {left, top} in %
 * @param {React.RefObject} params.overlayActiveRef - Whether overlay is showing
 * @param {React.RefObject} params.gameStateRef - Current game state ref
 * @param {React.RefObject} params.barrierActiveRef - Whether barriers are active
 * @param {React.RefObject} params.hardBarriersRef - Array of barrier positions
 * @param {Function} params.setShapeStyles - State setter for block CSS styles
 * @param {Function} params.onMove - Callback(newLeft, newTop) for game logic (scoring, trajectory, mines)
 */
export const useMotionControl = ({
    currentPosRef,
    overlayActiveRef,
    gameStateRef,
    barrierActiveRef,
    hardBarriersRef,
    setShapeStyles,
    onMove,
}) => {
    const onMoveRef = useRef(onMove);
    useEffect(() => { onMoveRef.current = onMove; });

    useEffect(() => {
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
            if (overlayActiveRef.current || gameStateRef.current !== GAME_STATE.PLAYING) return;

            // Delta-time: normalize movement to 60fps baseline
            const now = performance.now();
            const deltaTime = lastEventTime > 0 ? Math.min(now - lastEventTime, 100) : BASE_FRAME_MS;
            lastEventTime = now;
            const dtFactor = deltaTime / BASE_FRAME_MS;

            const x = (event.gamma / SENSITIVITY) * dtFactor;
            const y = (event.beta / SENSITIVITY) * dtFactor;

            const prev = currentPosRef.current;
            let newLeft = Math.max(0, Math.min(100, prev.left + x));
            let newTop = Math.max(0, Math.min(100, prev.top + y));

            // Sliding collision against hardened barriers (level 2+)
            if (barrierActiveRef.current) {
                const barriers = hardBarriersRef.current;
                const W = window.innerWidth;
                const H = window.innerHeight;
                if (wouldCollideWithBarriers(newLeft, prev.top, barriers, W, H)) newLeft = prev.left;
                if (wouldCollideWithBarriers(prev.left, newTop, barriers, W, H)) newTop = prev.top;
                if (wouldCollideWithBarriers(newLeft, newTop, barriers, W, H)) {
                    newLeft = prev.left;
                    newTop = prev.top;
                }
            }

            currentPosRef.current = { left: newLeft, top: newTop };
            pendingPosition = { left: newLeft, top: newTop };

            // Notify Game.js for scoring, trajectory, mine checks
            if (onMoveRef.current) onMoveRef.current(newLeft, newTop);
        };

        // Keyboard controls for desktop/development
        const handleKeyDown = (e) => {
            if (gameStateRef.current !== GAME_STATE.PLAYING || overlayActiveRef.current) return;
            const step = 2;
            const fakeEvent = { gamma: 0, beta: 0 };
            if (e.key === 'ArrowLeft') fakeEvent.gamma = -step * SENSITIVITY;
            else if (e.key === 'ArrowRight') fakeEvent.gamma = step * SENSITIVITY;
            else if (e.key === 'ArrowUp') fakeEvent.beta = -step * SENSITIVITY;
            else if (e.key === 'ArrowDown') fakeEvent.beta = step * SENSITIVITY;
            else return;
            e.preventDefault();
            updatePosition(fakeEvent);
        };

        window.addEventListener('deviceorientation', updatePosition);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('deviceorientation', updatePosition);
            window.removeEventListener('keydown', handleKeyDown);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
};
