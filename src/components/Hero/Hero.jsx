'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import styles from './Hero.module.css';

const SLIDES = [
  { src: '/assets/images/slideshow-1.png', alt: 'Glam & Fab Salon — luxury experience' },
  { src: '/assets/images/slideshow-2.jpeg', alt: 'Glam & Fab Salon — hair styling' },
  { src: '/assets/images/slideshow-3.jpeg', alt: 'Glam & Fab Salon — bridal makeup' },
];

export default function Hero() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 10000, stopOnInteraction: false })]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

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
          <a href="#pricelist" className={styles.btnGhost}>
            Explore Services
          </a>
        </div>
      </div>

      {/* ── RIGHT PANEL — Image Carousel (Embla) ── */}
      <div className={styles.heroRight}>
        <div className={styles.heroCarousel} ref={emblaRef}>
          <div className={styles.heroCarouselTrack}>
            {SLIDES.map((slide, index) => (
              <div key={slide.src} className={styles.heroCarouselSlide}>
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  style={{ objectFit: 'fit', objectPosition: 'center top' }}
                  priority={index === 0}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Prev / Next buttons — absolute positioned over carousel */}
        <button
          className={`${styles.heroCarouselBtn} ${styles.prev}`}
          onClick={scrollPrev}
          aria-label="Previous slide"
        >
          ‹
        </button>
        <button
          className={`${styles.heroCarouselBtn} ${styles.next}`}
          onClick={scrollNext}
          aria-label="Next slide"
        >
          ›
        </button>

        {/* Dots */}
        <div className={styles.heroCarouselDots}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`${styles.heroCarouselDot} ${i === selectedIndex ? styles.active : ''}`}
              onClick={() => scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
