// Minimal Web Audio API sound manager
let audioCtx = null;

const getCtx = () => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
};

let muted = false;
export const setMuted = (val) => { muted = val; };
export const isMuted = () => muted;

const playTone = (frequency, duration, type = 'sine', volume = 0.15) => {
    if (muted) return;
    try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (e) {}
};

export const playScore = () => playTone(880, 0.15, 'sine', 0.12);
export const playLevelUp = () => {
    playTone(523, 0.1, 'sine', 0.1);
    setTimeout(() => playTone(659, 0.1, 'sine', 0.1), 100);
    setTimeout(() => playTone(784, 0.15, 'sine', 0.12), 200);
};
export const playBlast = () => playTone(120, 0.4, 'sawtooth', 0.2);
export const playCountdown = () => playTone(440, 0.08, 'square', 0.06);
