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
      </Head>

      <header className={styles.header}>
        <h1 className={styles.title}>TETRUTO</h1>
        <div className={styles.hud}>
          <div className={styles.hudItem}>
            <span className={styles.hudLabel}>Level</span>
            <span className={styles.hudValue}>{currentLevel}</span>
          </div>
          <div className={styles.hudItem}>
            <span className={styles.hudLabel}>Score</span>
            <span className={styles.hudValue}>{score}</span>
          </div>
        </div>
      </header>

      <main className={styles.gameArea}>
        <Game onLevelChange={handleLevelChange} onScoreChange={handleScoreChange} />
      </main>
    </div>
  );
};

export default Home;
