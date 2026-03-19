// pages/index.js

import React, { useState } from 'react';
import Head from 'next/head';
import Game from '../components/Game';
import styles from '../styles/Home.module.css';

const Home = () => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);

  const handleLevelChange = (newLevel) => {
    setCurrentLevel(newLevel);
  };

  const handleScoreChange = (newScore) => {
    setScore(newScore);
  };

  return (
    <div className={styles.gameWrapper}>
      <Head>
        <title>TETRUTO</title>
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
        </div>
      </div>

      <Game onLevelChange={handleLevelChange} onScoreChange={handleScoreChange} />
    </div>
  );
};

export default Home;
