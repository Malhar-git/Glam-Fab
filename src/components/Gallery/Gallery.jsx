import Image from 'next/image';
import styles from './Gallery.module.css';

const GALLERY = [
  { src: '/assets/images/bridal.jpg',     alt: 'Bridal Makeup at Glam & Fab Salon',       label: 'Bridal Makeup' },
  { src: '/assets/images/hair-color.jpg', alt: 'Hair Color service at Glam & Fab Salon',  label: 'Hair Color' },
  { src: '/assets/images/nai.jpeg',        alt: 'Nail Art at Glam & Fab Salon',             label: 'Nail Art' },
  { src: '/assets/images/hair-treatment.jpeg', alt: 'Skin Treatment at Glam & Fab Salon',       label: 'Hair Treatment' },
  { src: '/assets/images/editorial.jpg',   alt: 'Editorial Look at Glam & Fab Salon',       label: 'Editorial Look' },
];

export default function Gallery() {
  return (
    <section className={styles.gallery} id="gallery">
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.sectionEyebrow}>Our Work</div>
          <h2 className={styles.sectionTitle}>
            The Art of<br />
            <em>Transformation</em>
          </h2>
        </div>
      </div>

      <div className={styles.galleryGrid}>
        {GALLERY.map((item) => (
          <div key={item.label} className={styles.galleryItem} data-label={item.label}>
            <div className={styles.galleryGlow} />
            <Image
              src={item.src}
              alt={item.alt}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 900px) 100vw, 33vw"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
