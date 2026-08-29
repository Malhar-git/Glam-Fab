'use client';
import { useEffect, useRef } from 'react';
import styles from './Testimonials.module.css';

const REVIEWS = [
  {
    text: '"Really happy with my haircut! The stylist did exactly what I wanted and I loved the final look. Great service! ❤️ Thankyou!!"',
    author: 'Serin Simon',
    link: 'https://www.google.com/maps/contrib/112199528373942530288/reviews?hl=en-GB',
  },
  {
    text: '"Came in nervous, left feeling great. The team is super friendly and really makes you comfortable. Amazing haircut and amazing people."',
    author: 'Aswathy B. Pillai',
    link: 'https://www.google.com/maps/contrib/102591595330424921913/reviews?hl=en-GB',
  },
  {
    text: '"I recently got a haircut here, and I\'m really happy with the result. The stylist listened to what I wanted, paid attention to the details, and made sure I was comfortable throughout. I would definitely recommend this salon and will be coming back."',
    author: 'Catharine',
    link: 'https://www.google.com/maps/contrib/106652021692188338803/reviews?hl=en-GB',
  },
  {
    text: '"I had an amazing experience at Glam & Fab Salon! I got the Hair Nanoplast Treatment, and the results exceeded my expectations. My hair feels incredibly smooth, soft, shiny, and frizz-free. Highly recommend this salon to anyone looking for a quality hair transformation."',
    author: 'Anuja R',
    link: 'https://www.google.com/maps/contrib/115207065274580988008/reviews?hl=en-GB',
  },
];

export default function Testimonials() {
  const gridRef = useRef(null);

  /* Fade-in cards as they scroll into view */
  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll('[data-fade]');
    if (!cards || cards.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add(styles.visible);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    cards.forEach((card) => io.observe(card));
    return () => io.disconnect();
  }, []);

  return (
    <section className={styles.testimonials} id="testimonials">
      <div className={styles.inner}>
        <div className={styles.sectionEyebrow}>Client Love</div>
        <h2 className={styles.sectionTitle}>
          What Our Clients<br /><em>Say</em>
        </h2>
        <p className={styles.note}>
          Genuine 5-star reviews, straight from our Google Business Profile.
        </p>
      </div>

      <div className={styles.grid} ref={gridRef}>
        {REVIEWS.map((r, i) => (
          <div
            key={r.author}
            className={styles.testimonial}
            data-fade
            style={{ transitionDelay: `${i * 0.12}s` }}
          >
            <div className={styles.stars}>★★★★★</div>
            <p className={styles.text}>{r.text}</p>
            <div className={styles.author}>{r.author}</div>
            <a
              href={r.link}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.source}
            >
              View on Google →
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
