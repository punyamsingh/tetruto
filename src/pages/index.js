// pages/index.js

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useSession, signIn, signOut } from 'next-auth/react';
import Game from '../components/Game';
import Leaderboard from '../components/Leaderboard';
import styles from '../styles/Home.module.css';

const Home = () => {
  const { data: session } = useSession();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Seed high score from localStorage on first render
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tetruto_high_score');
      if (saved !== null) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val > 0) setHighScore(val);
      }
    } catch (e) {}
  }, []);

  const handleLevelChange = (newLevel) => {
    setCurrentLevel(newLevel);
  };

  const handleScoreChange = (newScore) => {
    setScore(newScore);
  };

  const handleHighScoreChange = (newHigh) => {
    setHighScore(newHigh);
  };

  const handleGameOver = useCallback((finalScore) => {
    if (session && finalScore > 0) {
      fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: finalScore }),
      }).catch(() => {}); // fire and forget
    }
  }, [session]);

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

      <div className={styles.hud}>
        <span className={styles.title}>TETRUTO</span>
        <div className={styles.hudStats} aria-live="polite">
          <span className={styles.hudStat}>LVL <strong>{currentLevel}</strong></span>
          <span className={styles.hudStat}>SCORE <strong>{score}</strong></span>
          {highScore > 0 && (
            <span className={styles.hudStat}>BEST <strong>{highScore}</strong></span>
          )}
        </div>
      </div>

      <div className={styles.hudLeft}>
        {session ? (
          <button className={styles.authButton} onClick={() => signOut()}>
            {session.user.image && (
              <img src={session.user.image} alt="" className={styles.authAvatar} referrerPolicy="no-referrer" />
            )}
            <span>{session.user.name?.split(' ')[0]}</span>
          </button>
        ) : (
          <button className={styles.authButton} onClick={() => signIn('google')}>
            Sign in
          </button>
        )}
        <button className={styles.authButton} onClick={() => setShowLeaderboard(true)}>
          Top 10
        </button>
      </div>

      <Game
        onLevelChange={handleLevelChange}
        onScoreChange={handleScoreChange}
        onHighScoreChange={handleHighScoreChange}
        onGameOver={handleGameOver}
      />

      <Leaderboard
        visible={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />
    </div>
  );
};

export default Home;
