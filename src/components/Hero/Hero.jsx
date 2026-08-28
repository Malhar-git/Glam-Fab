'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import styles from './Hero.module.css';

const SLIDES = [
  { src: '/assets/images/slideshow-1.png', alt: 'Glam & Fab Salon — luxury experience' },
  { src: '/assets/images/slideshow-2.jpeg', alt: 'Glam & Fab Salon — hair styling' },
  { src: '/assets/images/slideshow-3.jpeg', alt: 'Glam & Fab Salon — bridal makeup' },
];

export default function Hero() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((p) => (p + 1) % SLIDES.length), []);
  const prev = useCallback(() => setCurrent((p) => (p - 1 + SLIDES.length) % SLIDES.length), []);

  /* Auto-advance every 5 s */
  useEffect(() => {
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next]);

  return (
    <section className={styles.hero}>
      {/* ── LEFT PANEL ── */}
      <div className={styles.heroLeft}>

        <h1 className={styles.heroTitle}>
          Where Beauty
          <em>Comes Alive</em>
        </h1>

        <p className={styles.heroSubtitle}>
          Expert hair, flawless makeup, premium nail art &amp; transformative skin treatments —
          all in one destination.
        </p>

        <div className={styles.heroActions}>
          <button
            className={styles.btnPrimary}
            onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span>Book an Appointment</span>
          </button>
          <a href="#services" className={styles.btnGhost}>
            Explore Services
          </a>
        </div>
      </div>

      {/* ── RIGHT PANEL — Image Carousel ── */}
      {/* FIX: overflow: hidden is scoped here — no padding conflict that caused the old overflow bug */}
      <div className={styles.heroRight}>
        <div className={styles.heroCarousel}>
          <div
            className={styles.heroCarouselTrack}
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {SLIDES.map((slide) => (
              <div key={slide.src} className={styles.heroCarouselSlide}>
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  style={{ objectFit: 'cover', objectPosition: 'center top' }}
                  priority={slide.src.includes('slideshow-1')}
                />
              </div>
            ))}
          </div>

          {/* Prev / Next buttons — hidden on mobile */}
          <button
            className={`${styles.heroCarouselBtn} ${styles.prev}`}
            onClick={prev}
            aria-label="Previous slide"
          >
            ‹
          </button>
          <button
            className={`${styles.heroCarouselBtn} ${styles.next}`}
            onClick={next}
            aria-label="Next slide"
          >
            ›
          </button>

          {/* Dots */}
          <div className={styles.heroCarouselDots}>
            {SLIDES.map((_, i) => (
              <button
                key={i}
                className={`${styles.heroCarouselDot} ${i === current ? styles.active : ''}`}
                onClick={() => setCurrent(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
