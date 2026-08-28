import styles from './Marquee.module.css';

const ITEMS = [
  'Hair Styling',
  'Bridal Packages',
  'Nail Art',
  'Skin Treatments',
  'Makeup Artistry',
  'Luxury Spa',
  'Eyebrow Design',
  'Hair Coloring',
];

export default function Marquee() {
  return (
    <div className={styles.marqueeWrap} aria-hidden="true">
      <div className={styles.marquee}>
        {/* Duplicate for seamless infinite loop */}
        {[...ITEMS, ...ITEMS].map((item, i) => (
          <div key={i} className={styles.marqueeItem}>
            {item}
            <span className={styles.marqueeDot} />
          </div>
        ))}
      </div>
    </div>
  );
}
