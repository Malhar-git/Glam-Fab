"use client";
import { useEffect, useRef } from "react";
import styles from "./Testimonials.module.css";

const REVIEWS = [
  {
    text: '"Really good saloon with a great ambience. Need to mention about their service and customer friendly behaviour."',
    author: "Aiswarya Vijayan",
    link: "https://google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2xOU1kxRmlNV2hqZFZSek0yUk1URUZXYjBkYVRFRRAB!2m1!1s0x0:0x6947da6cdfcac008!3m1!1s2@1:CAIQACodChtycF9oOlNSY1FiMWhjdVRzM2RMTEFWb0daTEE%7C%7C?entry=tts&g_ep=EgoyMDI2MDkxNi4wIPu8ASoASAFQAw%3D%3D&skid=f056415a-a30b-4209-a6c5-0bbfab8dec97",
  },
  {
    text: '"Came in nervous, left feeling great. The team is super friendly and really makes you comfortable. Amazing haircut and amazing people."',
    author: "Aswathy B. Pillai",
    link: "https://www.google.com/maps/contrib/102591595330424921913/place/ChIJdfXM6UgTBjsRCMDK32zaR2k/@9.41046,76.6350181,59581m/data=!3m1!1e3!4m6!1m5!8m4!1e1!2s102591595330424921913!3m1!1e1?hl=en-GB&entry=ttu&g_ep=EgoyMDI2MDkxNi4wIKXMDSoASAFQAw%3D%3D",
  },
  {
    text: '"Shami Bhai who cut my hair at Glam and Fab on September 2026 was so good. They listened to each everything I asked them to do and they even gave me suggestions."',
    author: "Madhav M. Pillai",
    link: "https://google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2podmNEVnFOVXRmVGt0dFpHZGZiakoyYVdKRlVGRRAB!2m1!1s0x0:0x6947da6cdfcac008!3m1!1s2@1:CAIQACodChtycF9oOjhvcDVqNUtfTkttZGdfbjJ2aWJFUFE%7C%7C?entry=tts&g_ep=EgoyMDI2MDkxNi4wIPu8ASoASAFQAw%3D%3D&skid=0a1231f2-eddc-4ed0-9c9c-8b4d540944c4",
  },
  {
    text: '"I had an amazing experience at Glam & Fab Salon! I got the Hair Nanoplast Treatment, and the results exceeded my expectations. My hair feels incredibly smooth, soft, shiny, and frizz-free. Highly recommend this salon to anyone looking for a quality hair transformation."',
    author: "Anuja R",
    link: "https://www.google.com/maps/contrib/115207065274580988008/place/ChIJdfXM6UgTBjsRCMDK32zaR2k/@9.5897151,76.5217859,119100m/data=!3m1!1e3!4m6!1m5!8m4!1e1!2s115207065274580988008!3m1!1e1?hl=en-GB&entry=ttu&g_ep=EgoyMDI2MDkxNi4wIKXMDSoASAFQAw%3D%3D",
  },
];

export default function Testimonials() {
  const gridRef = useRef(null);

  /* Fade-in cards as they scroll into view */
  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll("[data-fade]");
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
      { threshold: 0.1 },
    );

    cards.forEach((card) => io.observe(card));
    return () => io.disconnect();
  }, []);

  return (
    <section className={styles.testimonials} id="testimonials">
      <div className={styles.inner}>
        <div className={styles.sectionEyebrow}>Client Love</div>
        <h2 className={styles.sectionTitle}>
          What Our Clients
          <br />
          <em>Say</em>
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
