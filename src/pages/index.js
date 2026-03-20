// pages/index.js

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Game from '../components/Game';
import styles from '../styles/Home.module.css';

const Home = () => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

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

  return (
    <div className={styles.gameWrapper}>
      <Head>
        <title>TETRUTO</title>
        <link rel="icon" type="image/svg+xml" href="/logo-icon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>

      <div className={styles.hud}>
        <span className={styles.title}>TETRUTO</span>
        <div className={styles.hudStats}>
          <span className={styles.hudStat}>LVL <strong>{currentLevel}</strong></span>
          <span className={styles.hudStat}>SCORE <strong>{score}</strong></span>
          {highScore > 0 && (
            <span className={styles.hudStat}>BEST <strong>{highScore}</strong></span>
          )}
        </div>
      </div>

      <Game
        onLevelChange={handleLevelChange}
        onScoreChange={handleScoreChange}
        onHighScoreChange={handleHighScoreChange}
      />
    </div>
  );
};

export default Home;
