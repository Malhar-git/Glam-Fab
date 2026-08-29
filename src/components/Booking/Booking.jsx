'use client';
import { useState } from 'react';
import styles from './Booking.module.css';

const SERVICES = [
  'Hair & Styling',
  'Colour Artistry',
  'Nail Art Studio',
  'Makeup & Bridal',
  'Skin & Facials',
  'Luxury Spa',
];

const TIMES = [
  '9:30 AM','10:30 AM','11:30 AM','12:30 PM',
  '1:30 PM','2:30 PM','3:30 PM','4:30 PM',
  '5:30 PM','6:30 PM','7:30 PM','8:30 PM',
];

export default function Booking() {
  const [form, setForm] = useState({
    fname: '', lname: '', phone: '', service: '', date: '', time: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const msg = encodeURIComponent(
      `Hi Glam & Fab! I'd like to book an appointment.\n\n` +
      `Name: ${form.fname} ${form.lname}\n` +
      `Phone: ${form.phone}\n` +
      `Service: ${form.service}\n` +
      `Date: ${form.date}\n` +
      `Time: ${form.time}`
    );
    window.open(`https://wa.me/918111997679?text=${msg}`, '_blank');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <section className={styles.booking} id="booking">
      {/* Left — info */}
      <div className={styles.bookingInfo}>
        <div className={styles.sectionEyebrow}>Reserve Your Spot</div>
        <h2 className={styles.sectionTitle}>
          Book an<br /><em>Appointment</em>
        </h2>
        <p className={styles.bookingDesc}>
          Step into luxury. Fill out the form and our team will confirm your
          booking within 2 hours. Walk-ins welcome based on availability.
        </p>

        <div className={styles.bookingAddress}>
          <div className={styles.addressLabel}>Find Us</div>
          <div className={styles.addressBody}>
            1724, Bata Showroom, Mohana Building<br />
            MC Rd, Parass La, Adoor<br />
            Kerala 691523<br /><br />
            📞 +91 8111997679<br />
            📧 glamfabsalon@gmail.com
          </div>
          <div className={styles.hours}>Open Everyday: 9:30 AM – 9:30 PM</div>
        </div>
      </div>

      {/* Right — form */}
      <form className={styles.bookingForm} onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="fname">First Name</label>
            <input className={styles.formInput} id="fname" name="fname" type="text"
              value={form.fname} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="lname">Last Name</label>
            <input className={styles.formInput} id="lname" name="lname" type="text"
              value={form.lname} onChange={handleChange} required />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="phone">Phone Number</label>
          <input className={styles.formInput} id="phone" name="phone" type="tel"
            value={form.phone} onChange={handleChange} required />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="service">Service</label>
          <select className={styles.formSelect} id="service" name="service"
            value={form.service} onChange={handleChange} required>
            <option value="" disabled>Select a service</option>
            {SERVICES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="date">Preferred Date</label>
            <input className={styles.formInput} id="date" name="date" type="date"
              value={form.date} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="time">Preferred Time</label>
            <select className={styles.formSelect} id="time" name="time"
              value={form.time} onChange={handleChange} required>
              <option value="" disabled>Select time</option>
              {TIMES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <button type="submit" className={styles.submitBtn}>
          <span>Confirm My Appointment</span>
        </button>

        {submitted && (
          <p className={styles.successMsg}>✓ Thank you! We&apos;ll confirm your booking shortly.</p>
        )}
      </form>
    </section>
  );
}
