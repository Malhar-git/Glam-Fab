"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./Gallery.module.css";

const GALLERY = [
  {
    src: "/assets/images/bridal.webp",
    alt: "Bridal Makeup at Glam & Fab Salon",
    label: "Bridal Makeup",
  },
  {
    src: "/assets/images/gallery/hair-color/7.webp",
    alt: "Hair Color service at Glam & Fab Salon",
    label: "Hair Color",
  },
  {
    src: "/assets/images/nai.webp",
    alt: "Nail Art at Glam & Fab Salon",
    label: "Nail Art",
  },
  {
    src: "/assets/images/hair-treatment.webp",
    alt: "Skin Treatment at Glam & Fab Salon",
    label: "Hair Treatment",
  },
  {
    src: "/assets/images/gallery/other-services/other-services-2.webp",
    alt: "Editorial Look at Glam & Fab Salon",
    label: "Other Services",
  },
];

const CATEGORY_IMAGES = {
  "Bridal Makeup": [
    { src: "/assets/images/gallery/bridal/1.webp", alt: "Bridal Makeup 1" },
    { src: "/assets/images/gallery/bridal/2.webp", alt: "Bridal Makeup 2" },
    { src: "/assets/images/gallery/bridal/3.webp", alt: "Bridal Makeup 3" },
    { src: "/assets/images/gallery/bridal/4.webp", alt: "Bridal Makeup 4" },
  ],
  "Hair Color": [
    { src: "/assets/images/gallery/hair-color/1.webp", alt: "Hair Color 1" },
    { src: "/assets/images/gallery/hair-color/2.webp", alt: "Hair Color 2" },
    { src: "/assets/images/gallery/hair-color/3.webp", alt: "Hair Color 3" },
    { src: "/assets/images/gallery/hair-color/4.webp", alt: "Hair Color 4" },
    { src: "/assets/images/gallery/hair-color/6.webp", alt: "Hair Color 6" },
    { src: "/assets/images/gallery/hair-color/7.webp", alt: "Hair Color 7" },
    { src: "/assets/images/gallery/hair-color/8.webp", alt: "Hair Color 8" },
    { src: "/assets/images/gallery/hair-color/9.webp", alt: "Hair Color 9" },
    { src: "/assets/images/gallery/hair-color/10.webp", alt: "Hair Color 10" },
  ],
  "Hair Treatment": [
    {
      src: "/assets/images/gallery/hair-treatment/1.webp",
      alt: "Hair Treatment 1",
    },
    {
      src: "/assets/images/gallery/hair-treatment/2.webp",
      alt: "Hair Treatment 2",
    },
    {
      src: "/assets/images/gallery/hair-treatment/3(1).webp",
      alt: "Hair Treatment 3",
    },
    {
      src: "/assets/images/gallery/hair-treatment/4.webp",
      alt: "Hair Treatment 4",
    },
    {
      src: "/assets/images/gallery/hair-treatment/5.webp",
      alt: "Hair Treatment 5",
    },
    {
      src: "/assets/images/gallery/hair-treatment/6.webp",
      alt: "Hair Treatment 6",
    },
  ],
  "Nail Art": [
    { src: "/assets/images/gallery/nails/1.webp", alt: "Nail Art 1" },
    { src: "/assets/images/gallery/nails/2.webp", alt: "Nail Art 2" },
  ],
  "Other Services": [
    {
      src: "/assets/images/gallery/other-services/other-services-1.webp",
      alt: "Other Services 1",
    },
    {
      src: "/assets/images/gallery/other-services/other-services-2.webp",
      alt: "Other Services 2",
    },
  ],
};

// Compute a balanced grid layout based on image count
function getGridLayout(count) {
  if (count <= 0) return { cols: 1, rows: 1 };
  if (count <= 3) return { cols: count, rows: 1 };
  if (count === 4) return { cols: 2, rows: 2 };
  if (count <= 6) return { cols: 3, rows: 2 };
  return { cols: 5, rows: 2 }; // 7-10 images -> 5x2
}

export default function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const longPressTimeout = useRef(null);
  const longPressTriggered = useRef(false);

  // Track mobile breakpoint
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const closeLightbox = () => {
    setSelectedCategory(null);
    setSelectedImage(null);
  };

  const closeZoom = () => setSelectedImage(null);

  // Mobile: open zoom after 500ms hold
  const handleTouchStart = (img) => {
    longPressTriggered.current = false;
    longPressTimeout.current = setTimeout(() => {
      longPressTriggered.current = true;
      setSelectedImage(img);
    }, 500);
  };

  // Mobile: release finger — cancel pending press OR close zoom if it opened
  const handleTouchEnd = (e) => {
    clearTimeout(longPressTimeout.current);
    if (longPressTriggered.current) {
      e.preventDefault(); // suppress the click that would re-open
      longPressTriggered.current = false;
      setSelectedImage(null);
    }
  };

  // Esc key: close zoom first, then lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (selectedImage) {
        setSelectedImage(null);
      } else if (selectedCategory) {
        setSelectedCategory(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, selectedCategory]);

  useEffect(() => {
    if (selectedCategory) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedCategory]);

  return (
    <>
      <section className={styles.gallery} id="gallery">
        <div className={styles.sectionHeader}>
          <div>
            <div className={styles.sectionEyebrow}>Our Work</div>
            <h2 className={styles.sectionTitle}>
              The Art of
              <br />
              <em>Transformation</em>
            </h2>
          </div>
        </div>

        <div className={styles.galleryGrid}>
          {GALLERY.map((item) => {
            const hasImages = !!CATEGORY_IMAGES[item.label];
            return (
              <div
                key={item.label}
                className={styles.galleryItem}
                data-label={item.label}
                onClick={
                  hasImages ? () => setSelectedCategory(item.label) : undefined
                }
                style={{ cursor: hasImages ? "pointer" : "default" }}
              >
                <div className={styles.galleryGlow} />
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  style={{ objectFit: "fill" }}
                  sizes="(max-width: 900px) 90vw, 33vw"
                />
              </div>
            );
          })}
        </div>
      </section>

      {selectedCategory && (
        <div className={styles.lightboxOverlay} onClick={closeLightbox}>
          <div
            className={styles.lightboxContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeBtn}
              onClick={closeLightbox}
              aria-label="Close popup"
            >
              ✕
            </button>

            <div className={styles.lightboxHeader}>
              <h3>{selectedCategory}</h3>
            </div>

            <div
              className={styles.lightboxGrid}
              style={(() => {
                const images = CATEGORY_IMAGES[selectedCategory] || [];
                const cols = isMobile
                  ? images.length === 2
                    ? 1
                    : 2
                  : getGridLayout(images.length).cols;
                const rows = Math.ceil(images.length / cols);
                return {
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                  gridTemplateRows: `repeat(${rows}, 1fr)`,
                };
              })()}
            >
              {CATEGORY_IMAGES[selectedCategory] ? (
                CATEGORY_IMAGES[selectedCategory].map((img, i) => (
                  <div
                    key={i}
                    className={styles.placeholderItem}
                    onClick={() => setSelectedImage(img)}
                    onTouchStart={() => handleTouchStart(img)}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      style={{ objectFit: "contain" }}
                      sizes="(max-width: 600px) 100vw, 33vw"
                    />
                  </div>
                ))
              ) : (
                <p className={styles.placeholderText}>Coming Soon</p>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div
          className={styles.zoomOverlay}
          onClick={closeZoom}
          onTouchEnd={closeZoom}
        >
          <button
            className={styles.zoomCloseBtn}
            onClick={closeZoom}
            aria-label="Close zoom"
          >
            ✕
          </button>
          <div
            className={styles.zoomImageWrap}
            onClick={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedImage.src}
              alt={selectedImage.alt}
              fill
              style={{ objectFit: "contain" }}
              sizes="100vw"
            />
          </div>
        </div>
      )}
    </>
  );
}
