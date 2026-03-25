import { BARRIER_HALF, MINE_HALF, BLOCK_SIZE, HOLE_SIZE, PATH_CELL } from '../constants';

/**
 * BFS: Can the block reach the hole given current mines and barriers?
 */
export const hasPathToHole = (blockPos, currentHoleStyles, currentMines, currentBarriers, viewW, viewH) => {
    const cols = Math.ceil(viewW / PATH_CELL);
    const rows = Math.ceil(viewH / PATH_CELL);

    const startPxX = (blockPos.left / 100) * viewW;
    const startPxY = (blockPos.top / 100) * viewH;
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
        // 8-directional movement
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

/**
 * Place `count` mines, avoiding block/hole/each-other and guaranteeing a path.
 */
export const placeMines = (count, blockPos, currentHoleStyles, currentBarriers, viewW, viewH) => {
    const margin = MINE_HALF + 5;
    const blockPxX = (blockPos.left / 100) * viewW;
    const blockPxY = (blockPos.top / 100) * viewH;
    const holePxX = parseFloat(currentHoleStyles.left);
    const holePxY = parseFloat(currentHoleStyles.top);
    const buf = MINE_HALF + 20;

    const placed = [];

    for (let i = 0; i < count; i++) {
        for (let attempt = 0; attempt < 200; attempt++) {
            const x = margin + Math.random() * (viewW - 2 * margin);
            const y = margin + Math.random() * (viewH - 2 * margin);

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
            if (!hasPathToHole(blockPos, currentHoleStyles, testMines, currentBarriers, viewW, viewH)) continue;

            placed.push({ x, y, id: Date.now() + i * 1000 + attempt });
            break;
        }
    }
    return placed;
};
