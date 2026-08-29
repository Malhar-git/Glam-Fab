'use client';
import { useEffect, useRef } from 'react';
import styles from './Services.module.css';

const SERVICES = [
  {
    icon: '✂️',
    name: 'Hair & Styling',
    desc: 'Precision cuts, blowouts, and bespoke styling by our master stylists.',
    price: 'From ₹249',
  },
  {
    icon: '🎨',
    name: 'Colour Artistry',
    desc: 'Global colours, balayage, highlights, and Olaplex bond treatments.',
    price: 'From ₹1,499',
  },
  {
    icon: '💅',
    name: 'Nail Art Studio',
    desc: 'Gel extensions, acrylic nails, chrome art, and intricate nail designs.',
    price: 'From ₹249',
  },
  {
    icon: '👰',
    name: 'Makeup & Bridal',
    desc: 'Party glam, engagement, bridal, and airbrush makeup by certified artists.',
    price: 'From ₹3,999',
  },
  {
    icon: '✨',
    name: 'Skin & Facials',
    desc: 'Hydra facials, Korean glass skin, premium clean-ups & D-tan treatments.',
    price: 'From ₹399',
  },
  {
    icon: '🧖',
    name: 'Luxury Spa',
    desc: 'Body polishing, massages, waxing, and full-body wellness treatments.',
    price: 'From ₹249',
  },
];

export default function Services() {
  const gridRef = useRef(null);

  /* IntersectionObserver fade-up for service cards */
  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll('[data-fade]');
    if (!cards) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add(styles.visible);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);

  return (
    <section className={styles.services} id="services">
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.sectionEyebrow}>What We Offer</div>
          <h2 className={styles.sectionTitle}>
            Our Signature<br />
            <em>Services</em>
          </h2>
        </div>
        <a href="#booking" className={styles.sectionLink}>
          Book a Service
        </a>
      </div>

      <div className={styles.servicesGrid} ref={gridRef}>
        {SERVICES.map((s, i) => (
          <div key={s.name} className={styles.serviceCard} data-fade style={{ transitionDelay: `${i * 0.08}s` }}>
            <span className={styles.serviceNum}>0{i + 1}</span>
            <span className={styles.serviceIcon}>{s.icon}</span>
            <h3 className={styles.serviceName}>{s.name}</h3>
            <p className={styles.serviceDesc}>{s.desc}</p>
            <span className={styles.servicePrice}>{s.price}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
