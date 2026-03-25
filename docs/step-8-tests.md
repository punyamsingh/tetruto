# Step 8: Add Tests

## Goal
Set up Jest and write unit tests for the pure utility functions extracted in step 7.

---

## Prerequisites
- Step 7 must be completed (utils extracted into separate files)

---

## Setup

### 8.1 Install dependencies

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

### 8.2 Create `jest.config.js` in project root

```js
const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
};

module.exports = createJestConfig(customJestConfig);
```

### 8.3 Add test script to `package.json`

Add to the `"scripts"` section:
```json
"test": "jest",
"test:watch": "jest --watch"
```

---

## New Test Files

### File 1: `src/__tests__/collision.test.js`

```js
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
        // Block right edge at 225px, barrier left edge at 225 - 4 = 221
        // blockRight (225) > 221? yes. Collision.
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
        // Hole at 100,100 size 30 → occupies 100-130 x 100-130
        // Barrier at 115, 115 → collision
        const barriers = [{ x: 115, y: 115 }];
        expect(holeCollidesWithBarriers(100, 100, barriers, 30)).toBe(true);
    });
});

describe('hasOverlap', () => {
    const viewW = 400;
    const viewH = 800;

    test('returns true when block overlaps hole', () => {
        // Block at 25% → 100px left, hole at 100px left
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
        // Block at position that's fully inside hole
        // Hole at 100,100 → 100-130 x 100-130
        // Block needs to be inside: 25% of 400 = 100, 12.5% of 800 = 100
        // Block: 100-125 inside hole 100-130 ✓
        const blockPos = { left: 25, top: 12.5 };
        const holePos = { left: '100px', top: '100px' };
        expect(calculateOverlapPercentage(blockPos, holePos, viewW, viewH)).toBe(100);
    });

    test('returns partial overlap percentage', () => {
        // Partial overlap: block edge overlaps hole edge
        const blockPos = { left: 25, top: 12.5 };  // 100px, 100px
        const holePos = { left: '115px', top: '100px' };
        // Block: 100-125 x 100-125
        // Hole: 115-145 x 100-130
        // Overlap: 115-125 x 100-125 = 10 x 25 = 250
        // Block area: 25*25 = 625
        // Percentage: 250/625 * 100 = 40%
        expect(calculateOverlapPercentage(blockPos, holePos, viewW, viewH)).toBe(40);
    });

    test('returns 0 with null holePos', () => {
        expect(calculateOverlapPercentage({ left: 50, top: 50 }, null, 400, 800)).toBe(0);
    });
});
```

### File 2: `src/__tests__/pathfinding.test.js`

```js
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
```

### File 3: `src/__tests__/scoring.test.js`

```js
import { OVERLAP_THRESHOLD, LEVEL_2_THRESHOLD, LEVEL_3_THRESHOLD, MAX_MINES } from '../constants';

describe('Game constants', () => {
    test('overlap threshold is 2%', () => {
        expect(OVERLAP_THRESHOLD).toBe(2);
    });

    test('level 2 at score 3', () => {
        expect(LEVEL_2_THRESHOLD).toBe(3);
    });

    test('level 3 at score 10', () => {
        expect(LEVEL_3_THRESHOLD).toBe(10);
    });

    test('max mines is 10', () => {
        expect(MAX_MINES).toBe(10);
    });
});

describe('Scoring logic', () => {
    test('overlap > 2% should score', () => {
        const overlapPercentage = 3;
        expect(overlapPercentage > OVERLAP_THRESHOLD).toBe(true);
    });

    test('overlap <= 2% should not score', () => {
        const overlapPercentage = 2;
        expect(overlapPercentage > OVERLAP_THRESHOLD).toBe(false);
    });

    test('overlap of exactly 1% should not score', () => {
        const overlapPercentage = 1;
        expect(overlapPercentage > OVERLAP_THRESHOLD).toBe(false);
    });
});

describe('Level progression', () => {
    test('score 2 stays at level 1', () => {
        const score = 2;
        const shouldAdvanceToL2 = score >= LEVEL_2_THRESHOLD;
        expect(shouldAdvanceToL2).toBe(false);
    });

    test('score 3 advances to level 2', () => {
        const score = 3;
        const shouldAdvanceToL2 = score >= LEVEL_2_THRESHOLD;
        expect(shouldAdvanceToL2).toBe(true);
    });

    test('score 9 stays at level 2', () => {
        const score = 9;
        const shouldAdvanceToL3 = score >= LEVEL_3_THRESHOLD;
        expect(shouldAdvanceToL3).toBe(false);
    });

    test('score 10 advances to level 3', () => {
        const score = 10;
        const shouldAdvanceToL3 = score >= LEVEL_3_THRESHOLD;
        expect(shouldAdvanceToL3).toBe(true);
    });
});

describe('Mine count cap', () => {
    test('mine count caps at MAX_MINES', () => {
        let mineCount = 9;
        mineCount = Math.min(mineCount + 1, MAX_MINES);
        expect(mineCount).toBe(10);

        mineCount = Math.min(mineCount + 1, MAX_MINES);
        expect(mineCount).toBe(10); // still 10, capped
    });
});
```

---

## Running Tests

```bash
npm test                    # Run all tests once
npm run test:watch          # Run in watch mode
npm test -- --coverage      # Run with coverage report
```

---

## Expected Output

```
PASS  src/__tests__/collision.test.js
PASS  src/__tests__/pathfinding.test.js
PASS  src/__tests__/scoring.test.js

Test Suites: 3 passed, 3 total
Tests:       ~25 passed, ~25 total
```

---

## Testing the Tests

1. **All tests pass on first run** — no flaky tests
2. **Collision tests match game behavior** — verify by playing
3. **Pathfinding tests handle edge cases** — blocked start, no path, diagonal paths
4. **Coverage report** — aim for 90%+ on collision.js and pathfinding.js
