"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import styles from "./Hero.module.css";

const SLIDES = [
  {
    src: "/assets/images/hero-reel.mp4",
    alt: "Glam & Fab Salon — reel",
    type: "video",
  },
  {
    src: "/assets/images/slideshow-2.png",
    alt: "Glam & Fab Salon — luxury experience",
  },
  {
    src: "/assets/images/slideshow-3.png",
    alt: "Glam & Fab Salon — hair styling",
  },
  {
    src: "/assets/images/slideshow-4.png",
    alt: "Glam & Fab Salon — bridal makeup",
  },
  {
    src: "/assets/images/slideshow-5.jpeg",
    alt: "One Stop solution for you Hair Problems",
  },
];

const VIDEO_SLIDE_INDEX = SLIDES.findIndex((s) => s.type === "video");

export default function Hero() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 10000, stopOnInteraction: false }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const videoRef = useRef(null);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi],
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  // Play/pause video and stop/resume Embla autoplay based on active slide
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !emblaApi) return;

    // Access autoplay plugin through the Embla API
    const autoplayPlugin = emblaApi.plugins()?.autoplay;

    if (selectedIndex === VIDEO_SLIDE_INDEX) {
      // Stop Embla autoplay so it doesn't advance mid-video
      autoplayPlugin?.stop();
      video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
      // Resume Embla autoplay for image slides
      autoplayPlugin?.play();
    }
  }, [selectedIndex, emblaApi]);

  // When the video finishes, advance to the next slide
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      if (emblaApi) emblaApi.scrollNext();
    };

    video.addEventListener("ended", handleEnded);
    return () => video.removeEventListener("ended", handleEnded);
  }, [emblaApi]);

  return (
    <section className={styles.hero}>
      {/* ── LEFT PANEL ── */}
      <div className={styles.heroLeft}>
        <h1 className={styles.heroTitle}>
          Where Beauty
          <em>Comes Alive</em>
        </h1>

        <p className={styles.heroSubtitle}>
          Expert hair, flawless makeup, premium nail art &amp; transformative
          skin treatments — all in one destination.
        </p>

        <div className={styles.heroActions}>
          <button
            className={styles.btnPrimary}
            onClick={() =>
              document
                .getElementById("booking")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span>Book an Appointment</span>
          </button>
          <a href="#pricelist" className={styles.btnGhost}>
            Explore Services
          </a>
        </div>
      </div>

      {/* ── RIGHT PANEL — Image/Video Carousel (Embla) ── */}
      <div
        className={`${styles.heroRight} ${
          selectedIndex === VIDEO_SLIDE_INDEX
            ? styles.heroRightVideo
            : styles.heroRightImage
        }`}
      >
        <div className={styles.heroCarousel} ref={emblaRef}>
          <div className={styles.heroCarouselTrack}>
            {SLIDES.map((slide, index) => (
              <div key={slide.src} className={styles.heroCarouselSlide}>
                {slide.type === "video" ? (
                  <video
                    ref={videoRef}
                    src={slide.src}
                    muted
                    playsInline
                    preload="metadata"
                    aria-label={slide.alt}
                    className={styles.heroCarouselVideo}
                    priority={index === 0}
                  />
                ) : (
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    style={{ objectFit: "fit", objectPosition: "center top" }}
                  />
                )}
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
              className={`${styles.heroCarouselDot} ${i === selectedIndex ? styles.active : ""}`}
              onClick={() => scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
