// pages/index.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import { useSession, signIn, signOut } from 'next-auth/react';
import Game from '../components/Game';
import Leaderboard from '../components/Leaderboard';
import styles from '../styles/Home.module.css';
import { GAME_STATE } from '../constants';

const isMobileDevice = () => {
  if (typeof window === 'undefined') return true; // SSR: assume mobile
  const ua = navigator.userAgent || '';
  const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  // Real mobile devices have the gyroscope API the game needs
  const hasDeviceOrientation = 'DeviceOrientationEvent' in window;
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const narrowScreen = window.innerWidth <= 1024;
  // Must have mobile UA AND (gyro or touch on a small screen)
  return mobileUA && hasDeviceOrientation && hasTouch && narrowScreen;
};

const DesktopBlocker = () => (
  <div className={styles.gameWrapper}>
    <Head>
      <title>TETRUTO - Mobile Only</title>
      <link rel="icon" type="image/svg+xml" href="/logo-icon.svg" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>
    <div className={styles.desktopBlocker}>
      <div className={styles.blockerIcon}>📱</div>
      <h1 className={styles.blockerTitle}>TETRUTO</h1>
      <p className={styles.blockerText}>
        This game uses device motion controls and is designed exclusively for mobile devices.
      </p>
      <p className={styles.blockerHint}>
        Open this page on your phone to play.
      </p>
    </div>
  </div>
);

// SVG icons — clean, monochrome, 16x16 viewBox
const PauseIcon = () => (
  <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="2" width="3.5" height="12" rx="1" fill="currentColor" />
    <rect x="9.5" y="2" width="3.5" height="12" rx="1" fill="currentColor" />
  </svg>
);

const TrophyIcon = () => (
  <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 2h8v5a4 4 0 01-8 0V2z" fill="currentColor" opacity="0.9" />
    <path d="M4 4H2a2 2 0 000 4h0.5A4.5 4.5 0 004 4zM12 4h2a2 2 0 010 4h-0.5A4.5 4.5 0 0012 4z" fill="currentColor" opacity="0.5" />
    <rect x="6.5" y="10" width="3" height="2.5" rx="0.5" fill="currentColor" />
    <rect x="4.5" y="12" width="7" height="2" rx="1" fill="currentColor" opacity="0.7" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="5" r="3" fill="currentColor" />
    <path d="M2.5 14a5.5 5.5 0 0111 0z" fill="currentColor" opacity="0.7" />
  </svg>
);

const Home = () => {
  const { data: session } = useSession();
  const gameRef = useRef(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [gameState, setGameState] = useState(GAME_STATE.PLAYING);
  const [isMobile, setIsMobile] = useState(true); // default true to avoid flash

  useEffect(() => {
    setIsMobile(isMobileDevice());
    // Re-check on resize so toggling DevTools device mode doesn't bypass the gate
    const onResize = () => setIsMobile(isMobileDevice());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tetruto_high_score');
      if (saved !== null) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val > 0) setHighScore(val);
      }
    } catch (e) {}
  }, []);

  if (!isMobile) return <DesktopBlocker />;

  const handleGameOver = useCallback((finalScore) => {
    if (session && finalScore > 0) {
      fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: finalScore }),
      })
        .then((r) => {
          if (!r.ok) {
            r.text().then((body) => console.error('Score submit failed:', r.status, body));
          }
        })
        .catch((err) => console.error('Score submit error:', err));
    }
  }, [session]);

  const handlePause = () => {
    if (gameState === GAME_STATE.PLAYING) {
      gameRef.current?.pause();
    } else if (gameState === GAME_STATE.PAUSED) {
      gameRef.current?.resume();
    }
  };

  return (
    <div className={styles.gameWrapper}>
      <Head>
        <title>TETRUTO - Motion Control Game</title>
        <link rel="icon" type="image/svg+xml" href="/logo-icon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>

      {/* ── Top Bar ── */}
      <div className={styles.topBar}>
        <div className={styles.topBarRow1}>
          <span className={styles.title}>TETRUTO</span>
          <div className={styles.topBarActions}>
            {session ? (
              <button className={styles.userBtn} onClick={() => signOut()} aria-label={`Signed in as ${session.user.name}. Click to sign out`}>
                {session.user.image ? (
                  <img src={session.user.image} alt="" className={styles.userAvatar} referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon />
                )}
              </button>
            ) : (
              <button className={styles.userBtn} onClick={() => signIn('google')} aria-label="Sign in with Google">
                <UserIcon />
              </button>
            )}
            <div className={styles.divider} />
            <button className={styles.iconBtn} onClick={() => setShowLeaderboard(true)} aria-label="Leaderboard">
              <TrophyIcon />
            </button>
            <button
              className={styles.iconBtn}
              onClick={handlePause}
              aria-label={gameState === GAME_STATE.PAUSED ? 'Resume game' : 'Pause game'}
            >
              <PauseIcon />
            </button>
          </div>
        </div>
        <div className={styles.topBarRow2} aria-live="polite">
          <span className={styles.hudStat}>LVL <strong>{currentLevel}</strong></span>
          <span className={styles.hudStat}>SCORE <strong>{score}</strong></span>
          {highScore > 0 && (
            <span className={styles.hudStat}>BEST <strong>{highScore}</strong></span>
          )}
        </div>
      </div>

      {/* ── Game Area ── */}
      <div className={styles.gameArea}>
        <Game
          ref={gameRef}
          onLevelChange={setCurrentLevel}
          onScoreChange={setScore}
          onHighScoreChange={setHighScore}
          onGameOver={handleGameOver}
          onGameStateChange={setGameState}
        />
      </div>

      <Leaderboard
        visible={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />
    </div>
  );
};

export default Home;
