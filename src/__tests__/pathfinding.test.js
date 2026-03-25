import { hasPathToHole, placeMines } from '../utils/pathfinding';

describe('hasPathToHole', () => {
    const viewW = 400;
    const viewH = 400;

    test('finds path with no obstacles', () => {
        const blockPos = { left: 10, top: 10 };
        const holeStyles = { left: '300px', top: '300px' };
        expect(hasPathToHole(blockPos, holeStyles, [], [], viewW, viewH)).toBe(true);
    });

    test('finds path around mines', () => {
        const blockPos = { left: 0, top: 50 };
        const holeStyles = { left: '350px', top: '200px' };
        // Place a mine in between but not blocking all paths
        const mines = [{ x: 200, y: 200 }];
        expect(hasPathToHole(blockPos, holeStyles, mines, [], viewW, viewH)).toBe(true);
    });

    test('returns false when completely blocked', () => {
        const blockPos = { left: 0, top: 0 };
        const holeStyles = { left: '350px', top: '350px' };
        // Create a wall of mines blocking all paths
        const mines = [];
        for (let y = 0; y <= 400; y += 10) {
            mines.push({ x: 200, y });
        }
        expect(hasPathToHole(blockPos, holeStyles, mines, [], viewW, viewH)).toBe(false);
    });

    test('returns false when start is blocked', () => {
        const blockPos = { left: 0, top: 0 };
        const holeStyles = { left: '300px', top: '300px' };
        // Mine right on the start position
        const mines = [{ x: 5, y: 5 }];
        expect(hasPathToHole(blockPos, holeStyles, mines, [], viewW, viewH)).toBe(false);
    });
});

describe('placeMines', () => {
    const viewW = 400;
    const viewH = 800;

    test('places requested number of mines', () => {
        const blockPos = { left: 10, top: 10 };
        const holeStyles = { left: '300px', top: '600px' };
        const mines = placeMines(3, blockPos, holeStyles, [], viewW, viewH);
        expect(mines.length).toBeLessThanOrEqual(3);
        expect(mines.length).toBeGreaterThan(0);
    });

    test('mines have x, y, and id properties', () => {
        const blockPos = { left: 10, top: 10 };
        const holeStyles = { left: '300px', top: '600px' };
        const mines = placeMines(1, blockPos, holeStyles, [], viewW, viewH);
        if (mines.length > 0) {
            expect(mines[0]).toHaveProperty('x');
            expect(mines[0]).toHaveProperty('y');
            expect(mines[0]).toHaveProperty('id');
        }
    });

    test('mines are not placed on block spawn', () => {
        const blockPos = { left: 50, top: 50 };  // center of screen
        const holeStyles = { left: '10px', top: '10px' };
        const mines = placeMines(5, blockPos, holeStyles, [], viewW, viewH);
        const blockPxX = (blockPos.left / 100) * viewW;
        const blockPxY = (blockPos.top / 100) * viewH;
        for (const m of mines) {
            const tooClose = (
                m.x > blockPxX - 28 && m.x < blockPxX + 25 + 28 &&
                m.y > blockPxY - 28 && m.y < blockPxY + 25 + 28
            );
            expect(tooClose).toBe(false);
        }
    });

    test('path to hole still exists after placing mines', () => {
        const blockPos = { left: 10, top: 10 };
        const holeStyles = { left: '300px', top: '600px' };
        const mines = placeMines(5, blockPos, holeStyles, [], viewW, viewH);
        const result = hasPathToHole(blockPos, holeStyles, mines, [], viewW, viewH);
        expect(result).toBe(true);
    });
});
