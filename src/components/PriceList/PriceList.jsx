'use client';
import { useState } from 'react';
import priceData from './priceData';
import styles from './PriceList.module.css';

export default function PriceList() {
  const [activeTab, setActiveTab] = useState(0);
  const cat = priceData[activeTab];

  return (
    <section className={styles.pricelist} id="pricelist">
      <div className={styles.sectionHeader}>
        <div className={styles.sectionEyebrow}>Transparent Pricing</div>
        <h2 className={styles.sectionTitle}>
          Our Signature<br /><em>Services</em>
        </h2>
      </div>

      {/* Desktop tabs */}
      <div className={styles.tabs} role="tablist">
        {priceData.map((d, i) => (
          <button
            key={d.cat}
            role="tab"
            aria-selected={i === activeTab}
            className={`${styles.tab} ${i === activeTab ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {d.cat}
          </button>
        ))}
      </div>

      {/* Mobile select */}
      <select
        className={styles.mobileSelect}
        value={activeTab}
        onChange={(e) => setActiveTab(Number(e.target.value))}
        aria-label="Select service category"
      >
        {priceData.map((d, i) => (
          <option key={d.cat} value={i}>{d.cat}</option>
        ))}
      </select>

      {/* Panel */}
      <div className={styles.panel}>
        {cat.type === 'single' ? (
          <table className={styles.priceTable}>
            <tbody>
              {cat.items.map(([name, price]) => (
                <tr key={name} className={styles.priceRow}>
                  <td className={styles.priceName}>{name}</td>
                  <td className={styles.priceVal}>₹{price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className={styles.priceTable}>
            <thead>
              <tr>
                <th className={styles.priceNameHead}>Service</th>
                {cat.cols.map((col) => (
                  <th key={col} className={styles.priceColHead}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cat.items.map(([name, vals]) => (
                <tr key={name} className={styles.priceRow}>
                  <td className={styles.priceName}>{name}</td>
                  {vals.map((v, i) => (
                    <td key={i} className={styles.priceVal}>
                      {v === '-' ? '—' : `₹${v}`}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className={styles.note}>* Prices may vary based on hair length &amp; density. Final price confirmed during consultation.</p>
    </section>
  );
}
