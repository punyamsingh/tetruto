// Game element sizes (all in px)
export const BLOCK_SIZE = 25;
export const HOLE_SIZE = 30;
export const MINE_SIZE = 15;
export const BARRIER_SIZE = 7;
export const TRAJECTORY_DOT_SIZE = 7;

// Collision radii (half of visual size)
export const BARRIER_HALF = 4;
export const MINE_HALF = 8;

// Pathfinding
export const PATH_CELL = 25;

// Movement
export const SENSITIVITY = 10;
export const BASE_FRAME_MS = 16.67;

// Timing (ms)
export const SCORE_COOLDOWN = 1000;
export const MINE_HIT_DEBOUNCE = 1500;
export const TRAJECTORY_SAMPLE_INTERVAL = 100;
export const LOADING_DURATION = 1500;
export const OVERLAY_COUNTDOWN_STEP = 1000;
export const OVERLAY_TOTAL_DURATION = 3000;
export const DROP_ANIMATION_DURATION = 600;
export const SCORE_FLASH_DURATION = 500;
export const BLAST_FLASH_DURATION = 700;

// Scoring
export const OVERLAP_THRESHOLD = 2;   // percentage
export const LEVEL_2_THRESHOLD = 3;   // score to reach level 2
export const LEVEL_3_THRESHOLD = 10;  // score to reach level 3
export const INITIAL_MINE_COUNT = 3;

// Game states
export const GAME_STATE = {
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER',
};

// Level rules text
export const LEVEL_RULES = {
    1: 'Tilt to guide the block into the red hole',
    2: "Your path hardens into walls \u2014 don't get trapped",
    3: 'Mines lurk everywhere \u2014 one touch and it all resets',
};

// Trajectory cap
export const MAX_TRAJECTORY_POINTS = 500;
