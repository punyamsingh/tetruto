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
        expect(score >= LEVEL_2_THRESHOLD).toBe(false);
    });

    test('score 3 advances to level 2', () => {
        const score = 3;
        expect(score >= LEVEL_2_THRESHOLD).toBe(true);
    });

    test('score 9 stays at level 2', () => {
        const score = 9;
        expect(score >= LEVEL_3_THRESHOLD).toBe(false);
    });

    test('score 10 advances to level 3', () => {
        const score = 10;
        expect(score >= LEVEL_3_THRESHOLD).toBe(true);
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
