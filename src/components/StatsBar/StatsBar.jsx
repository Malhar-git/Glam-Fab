import styles from './StatsBar.module.css';

const STATS = [
  { num: '12+', label: 'Years of Excellence' },
  { num: '8K+', label: 'Happy Clients' },
  { num: '25',  label: 'Expert Artists' },
  { num: '40+', label: 'Premium Services' },
];

export default function StatsBar() {
  return (
    <div className={styles.statsBar}>
      {STATS.map(({ num, label }) => (
        <div key={label} className={styles.stat}>
          <div className={styles.statNum}>{num}</div>
          <div className={styles.statLabel}>{label}</div>
        </div>
      ))}
    </div>
  );
}
