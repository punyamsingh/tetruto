import { BARRIER_HALF, MINE_HALF, BLOCK_SIZE, HOLE_SIZE } from '../constants';

/**
 * Check if a block at (leftPct, topPct) collides with any barriers.
 */
export const wouldCollideWithBarriers = (leftPct, topPct, barriers, viewW, viewH) => {
    if (!barriers.length) return false;
    const blockLeft = (leftPct / 100) * viewW;
    const blockTop = (topPct / 100) * viewH;
    const blockRight = blockLeft + BLOCK_SIZE;
    const blockBottom = blockTop + BLOCK_SIZE;

    for (const b of barriers) {
        if (
            blockRight > b.x - BARRIER_HALF &&
            blockLeft < b.x + BARRIER_HALF &&
            blockBottom > b.y - BARRIER_HALF &&
            blockTop < b.y + BARRIER_HALF
        ) return true;
    }
    return false;
};

/**
 * Check if a block collides with any mines from the given list.
 */
export const wouldCollideWithMinesList = (leftPct, topPct, mineList, viewW, viewH) => {
    if (!mineList.length) return false;
    const blockLeft = (leftPct / 100) * viewW;
    const blockTop = (topPct / 100) * viewH;
    const blockRight = blockLeft + BLOCK_SIZE;
    const blockBottom = blockTop + BLOCK_SIZE;

    for (const m of mineList) {
        if (
            blockRight > m.x - MINE_HALF &&
            blockLeft < m.x + MINE_HALF &&
            blockBottom > m.y - MINE_HALF &&
            blockTop < m.y + MINE_HALF
        ) return true;
    }
    return false;
};

/**
 * Check if a hole at (leftPx, topPx) collides with barriers.
 */
export const holeCollidesWithBarriers = (leftPx, topPx, barriers, holeSize) => {
    if (!barriers.length) return false;
    const holeRight = leftPx + holeSize;
    const holeBottom = topPx + holeSize;
    for (const b of barriers) {
        if (
            holeRight > b.x - BARRIER_HALF &&
            leftPx < b.x + BARRIER_HALF &&
            holeBottom > b.y - BARRIER_HALF &&
            topPx < b.y + BARRIER_HALF
        ) return true;
    }
    return false;
};

/**
 * Check if block and hole have any overlap (ref-based, no DOM).
 */
export const hasOverlap = (blockPos, holePos, viewW, viewH) => {
    if (!holePos || !holePos.left) return false;
    const blockLeft = (blockPos.left / 100) * viewW;
    const blockTop = (blockPos.top / 100) * viewH;
    const blockRight = blockLeft + BLOCK_SIZE;
    const blockBottom = blockTop + BLOCK_SIZE;

    const holeLeft = parseFloat(holePos.left);
    const holeTop = parseFloat(holePos.top);
    const holeRight = holeLeft + HOLE_SIZE;
    const holeBottom = holeTop + HOLE_SIZE;

    return (
        blockRight > holeLeft &&
        blockLeft < holeRight &&
        blockBottom > holeTop &&
        blockTop < holeBottom
    );
};

/**
 * Calculate overlap percentage between block and hole (ref-based, no DOM).
 */
export const calculateOverlapPercentage = (blockPos, holePos, viewW, viewH) => {
    if (!holePos || !holePos.left) return 0;
    const blockLeft = (blockPos.left / 100) * viewW;
    const blockTop = (blockPos.top / 100) * viewH;
    const blockRight = blockLeft + BLOCK_SIZE;
    const blockBottom = blockTop + BLOCK_SIZE;

    const holeLeft = parseFloat(holePos.left);
    const holeTop = parseFloat(holePos.top);
    const holeRight = holeLeft + HOLE_SIZE;
    const holeBottom = holeTop + HOLE_SIZE;

    const overlapWidth = Math.max(0, Math.min(blockRight, holeRight) - Math.max(blockLeft, holeLeft));
    const overlapHeight = Math.max(0, Math.min(blockBottom, holeBottom) - Math.max(blockTop, holeTop));

    const overlapArea = overlapWidth * overlapHeight;
    const blockArea = BLOCK_SIZE * BLOCK_SIZE;

    return (overlapArea / blockArea) * 100;
};
