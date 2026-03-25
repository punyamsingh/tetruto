import {
    wouldCollideWithBarriers,
    wouldCollideWithMinesList,
    holeCollidesWithBarriers,
    hasOverlap,
    calculateOverlapPercentage,
} from '../utils/collision';

describe('wouldCollideWithBarriers', () => {
    const viewW = 400;
    const viewH = 800;

    test('returns false with no barriers', () => {
        expect(wouldCollideWithBarriers(50, 50, [], viewW, viewH)).toBe(false);
    });

    test('returns true when block overlaps a barrier', () => {
        // Block at 50% of 400 = 200px left, 50% of 800 = 400px top
        // Block is 25x25, so occupies 200-225 x 400-425
        // Barrier at (210, 410) should collide
        const barriers = [{ x: 210, y: 410 }];
        expect(wouldCollideWithBarriers(50, 50, barriers, viewW, viewH)).toBe(true);
    });

    test('returns false when block does not overlap barrier', () => {
        // Barrier far away
        const barriers = [{ x: 10, y: 10 }];
        expect(wouldCollideWithBarriers(50, 50, barriers, viewW, viewH)).toBe(false);
    });

    test('detects collision at block edge', () => {
        // Block right edge at 225px, barrier at x=225 with half=4
        // blockRight (225) > 225 - 4 = 221? yes. Collision.
        const barriers = [{ x: 225, y: 410 }];
        expect(wouldCollideWithBarriers(50, 50, barriers, viewW, viewH)).toBe(true);
    });
});

describe('wouldCollideWithMinesList', () => {
    const viewW = 400;
    const viewH = 800;

    test('returns false with no mines', () => {
        expect(wouldCollideWithMinesList(50, 50, [], viewW, viewH)).toBe(false);
    });

    test('returns true when block overlaps a mine', () => {
        const mines = [{ x: 210, y: 410 }];
        expect(wouldCollideWithMinesList(50, 50, mines, viewW, viewH)).toBe(true);
    });

    test('returns false when mine is far away', () => {
        const mines = [{ x: 10, y: 10 }];
        expect(wouldCollideWithMinesList(50, 50, mines, viewW, viewH)).toBe(false);
    });
});

describe('holeCollidesWithBarriers', () => {
    test('returns false with no barriers', () => {
        expect(holeCollidesWithBarriers(100, 100, [], 30)).toBe(false);
    });

    test('returns true when hole overlaps barrier', () => {
        // Hole at 100,100 size 30 -> occupies 100-130 x 100-130
        // Barrier at 115, 115 -> collision
        const barriers = [{ x: 115, y: 115 }];
        expect(holeCollidesWithBarriers(100, 100, barriers, 30)).toBe(true);
    });
});

describe('hasOverlap', () => {
    const viewW = 400;
    const viewH = 800;

    test('returns true when block overlaps hole', () => {
        // Block at 25% -> 100px left, hole at 100px left
        const blockPos = { left: 25, top: 50 };
        const holePos = { left: '100px', top: '400px' };
        expect(hasOverlap(blockPos, holePos, viewW, viewH)).toBe(true);
    });

    test('returns false when no overlap', () => {
        const blockPos = { left: 0, top: 0 };
        const holePos = { left: '300px', top: '600px' };
        expect(hasOverlap(blockPos, holePos, viewW, viewH)).toBe(false);
    });

    test('returns false with null holePos', () => {
        expect(hasOverlap({ left: 50, top: 50 }, null, viewW, viewH)).toBe(false);
    });
});

describe('calculateOverlapPercentage', () => {
    const viewW = 400;
    const viewH = 800;

    test('returns 0 with no overlap', () => {
        const blockPos = { left: 0, top: 0 };
        const holePos = { left: '300px', top: '600px' };
        expect(calculateOverlapPercentage(blockPos, holePos, viewW, viewH)).toBe(0);
    });

    test('returns 100 when block is fully inside hole', () => {
        // Block at 25% of 400 = 100px, 12.5% of 800 = 100px
        // Block: 100-125 inside hole 100-130
        const blockPos = { left: 25, top: 12.5 };
        const holePos = { left: '100px', top: '100px' };
        expect(calculateOverlapPercentage(blockPos, holePos, viewW, viewH)).toBe(100);
    });

    test('returns partial overlap percentage', () => {
        // Block: 100-125 x 100-125
        // Hole: 115-145 x 100-130
        // Overlap: 115-125 x 100-125 = 10 x 25 = 250
        // Block area: 25*25 = 625
        // Percentage: 250/625 * 100 = 40%
        const blockPos = { left: 25, top: 12.5 };
        const holePos = { left: '115px', top: '100px' };
        expect(calculateOverlapPercentage(blockPos, holePos, viewW, viewH)).toBe(40);
    });

    test('returns 0 with null holePos', () => {
        expect(calculateOverlapPercentage({ left: 50, top: 50 }, null, 400, 800)).toBe(0);
    });
});
