import React, { useEffect, useState } from 'react';
import styles from '../styles/leaderboard.module.css';

const Leaderboard = ({ visible, onClose }) => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((data) => setScores(data))
      .catch(() => setScores([]))
      .finally(() => setLoading(false));
  }, [visible]);

  if (!visible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.title}>LEADERBOARD</span>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : scores.length === 0 ? (
          <div className={styles.empty}>No scores yet. Be the first!</div>
        ) : (
          <div className={styles.list}>
            {scores.map((entry, i) => (
              <div key={entry.id} className={styles.row}>
                <span className={styles.rank}>
                  {i === 0 ? '#1' : i === 1 ? '#2' : i === 2 ? '#3' : `#${i + 1}`}
                </span>
                {entry.userImage && (
                  <img
                    src={entry.userImage}
                    alt=""
                    className={styles.avatar}
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className={styles.name}>{entry.userName}</span>
                <span className={styles.score}>{entry.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
