import { useEffect, useRef, useState } from 'preact/hooks';
import type { PropertyCardData } from '../lib/supabase-data';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Share2,
  MapPin,
  Bed,
  Bath,
  Ruler,
  Car,
  Star,
  Key,
  Tag,
  Play,
  ArrowRight,
} from 'lucide-preact';
import { HashIcon, SendIcon } from '../lib/brand-icons';
import styles from '../styles/modules/PropertyModal.module.css';

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

const FEATURE_CONFIG = [
  { key: 'beds', icon: Bed, label: 'Dormitorios', unit: '' },
  { key: 'baths', icon: Bath, label: 'Baños', unit: '' },
  { key: 'area', icon: Ruler, label: 'Superficie', unit: ' m²' },
  { key: 'garage', icon: Car, label: 'Cocheras', unit: '' },
] as const;

export function PropertyModal({
  property,
  onClose,
}: {
  property: PropertyCardData | null;
  onClose: () => void;
}) {
  if (!property) return null;

  const [activeImage, setActiveImage] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const allImages = property.gallery && property.gallery.length > 0
    ? property.gallery
    : [property.image];

  const features = FEATURE_CONFIG
    .map((f) => ({ ...f, value: property[f.key] as number }))
    .filter((f) => (f.value as number) > 0);

  const videoId = property.video_url ? getYouTubeId(property.video_url) : null;

  useEffect(() => {
    previousActiveElement.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';
    containerRef.current?.focus();

    const container = containerRef.current;
    if (!container) return;

    const focusableSelectors = [
      'button:not([disabled]):not([aria-hidden="true"])',
      'a[href]:not([aria-hidden="true"])',
      'input:not([disabled]):not([aria-hidden="true"])',
      'select:not([disabled]):not([aria-hidden="true"])',
      'textarea:not([disabled]):not([aria-hidden="true"])',
      '[tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])',
    ].join(', ');

    const getFocusableElements = () =>
      Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
        (el) => el.offsetParent !== null && !el.hasAttribute('aria-hidden')
      );

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTab);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && allImages.length > 1) {
        setActiveImage((i) => (i === 0 ? allImages.length - 1 : i - 1));
      }
      if (e.key === 'ArrowRight' && allImages.length > 1) {
        setActiveImage((i) => (i === allImages.length - 1 ? 0 : i + 1));
      }
    };
    document.addEventListener('keydown', handleKey);

    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKey);
      container.removeEventListener('keydown', handleTab);
      previousActiveElement.current?.focus();
    };
  }, [onClose, allImages.length]);

  const handleImageClick = (idx: number) => setActiveImage(idx);

  const handleThumbKey = (e: KeyboardEvent, idx: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveImage(idx);
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-desc"
    >
      <div
        className={styles.modalContainer}
        ref={containerRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar detalle de la propiedad">
          <X className={styles.icon} aria-hidden="true" />
          <span className={styles.srOnly}>Cerrar</span>
        </button>

        <div className={styles.modalGallery} role="region" aria-label="Galería de imágenes">
          <div className={styles.modalMainImage}>
            <img
              src={allImages[activeImage]}
              alt={`${property.alt} - Imagen ${activeImage + 1} de ${allImages.length}`}
              loading="eager"
            />
            {allImages.length > 1 && (
              <>
                <button
                  className={`${styles.galleryNav} ${styles.galleryNavPrev}`}
                  onClick={() => setActiveImage((i) => (i === 0 ? allImages.length - 1 : i - 1))}
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className={styles.icon} aria-hidden="true" />
                </button>
                <button
                  className={`${styles.galleryNav} ${styles.galleryNavNext}`}
                  onClick={() => setActiveImage((i) => (i === allImages.length - 1 ? 0 : i + 1))}
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight className={styles.icon} aria-hidden="true" />
                </button>
                <div className={styles.galleryCounter} aria-live="polite">
                  {activeImage + 1} / {allImages.length}
                </div>
              </>
            )}
            <div className={styles.modalBadges}>
              {property.featured && (
                <span className={`${styles.badge} ${styles.badgeFeatured}`}>
                  <Star className={styles.icon} aria-hidden="true" /> DESTACADA
                </span>
              )}
              <span className={`${styles.badge} ${styles.badgeOperation} ${property.operation === 'alquiler' ? styles.badgeOperationRent : styles.badgeOperationSale}`}>
                {property.operation === 'alquiler' ? (
                  <>
                    <Key className={styles.icon} aria-hidden="true" /> Alquiler
                  </>
                ) : (
                  <>
                    <Tag className={styles.icon} aria-hidden="true" /> Venta
                  </>
                )}
              </span>
            </div>
          </div>

          {allImages.length > 1 && (
            <div className={styles.galleryThumbs} role="tablist" aria-label="Miniaturas">
              {allImages.map((img, idx) => (
                <button
                  key={img}
                  className={`${styles.galleryThumb}${idx === activeImage ? ` ${styles.active}` : ''}`}
                  role="tab"
                  aria-selected={idx === activeImage}
                  aria-label={`Ver imagen ${idx + 1}`}
                  onClick={() => handleImageClick(idx)}
                  onKeyDown={(e) => handleThumbKey(e, idx)}
                >
                  <img src={img} alt="" aria-hidden="true" loading="lazy" />
                  {idx === activeImage && <span className={styles.thumbIndicator} aria-hidden="true"></span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <div className={styles.modalMeta}>
              {property.code && (
                <span className={styles.propertyCode} id="modal-code">
                  <HashIcon className={styles.icon} aria-hidden={true} /> Ref: {property.code}
                </span>
              )}
              <div className={styles.modalShare} title="Compartir propiedad">
                <button
                  className={styles.shareBtn}
                  onClick={async () => {
                    if (navigator.share) {
                      await navigator.share({
                        title: property.title,
                        text: `${property.price} - ${property.location}`,
                        url: window.location.href,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                    }
                  }}
                  aria-label="Compartir propiedad"
                >
                  <Share2 className={styles.icon} aria-hidden="true" />
                </button>
              </div>
            </div>
            <h2 id="modal-title" className={styles.modalTitle}>{property.title}</h2>
            <div className={styles.modalLocation}>
              <MapPin className={styles.icon} aria-hidden="true" />
              <span>{property.location}</span>
            </div>
            <div className={styles.modalPrice}>{property.price}</div>
          </div>

          <div className={styles.modalFeatures} role="list" aria-label="Características principales">
            {features.map((f) => (
              <div key={f.key} className={styles.modalFeature} role="listitem">
                <div className={styles.featureIcon} aria-hidden="true">
                  <f.icon className={styles.icon} aria-hidden="true" />
                </div>
                <div className={styles.featureInfo}>
                  <span className={styles.featureLabel}>{f.label}</span>
                  <span className={styles.featureValue}>
                    {f.value}{f.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {videoId && !isVideoPlaying && (
            <div className={styles.modalVideo} id="modal-video">
              <h3>Video de la propiedad</h3>
              <div className={styles.videoWrapper} onClick={() => setIsVideoPlaying(true)}>
                <div className={styles.videoPlaceholder}>
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`}
                    title={`Video de ${property.title}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    loading="lazy"
                  ></iframe>
                  <div className={styles.videoPlayOverlay}>
                    <button className={styles.videoPlayBtn} aria-label="Reproducir video">
                      <Play className={styles.icon} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {videoId && isVideoPlaying && (
            <div className={`${styles.modalVideo} ${styles.videoPlaying}`} id="modal-video">
              <h3>Video de la propiedad</h3>
              <div className={styles.videoWrapper}>
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                  title={`Video de ${property.title} (reproduciendo)`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}

          <div className={styles.modalDescription} id="modal-desc">
            <h3>Descripción</h3>
            <p>{property.desc}</p>
          </div>

          <div className={styles.modalActions}>
            <a
              href="/#contacto"
              className={`${styles.modalCta} ${styles.btnPrimary}`}
              onClick={onClose}
            >
              CONTACTAR <ArrowRight className={styles.icon} aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className={styles.modalStickyCta} role="complementary" aria-label="Acción rápida">
          <a
            href="/#contacto"
            className={`${styles.btnPrimary} ${styles.fullWidth}`}
            onClick={onClose}
          >
            <SendIcon className={styles.icon} aria-hidden={true} />
            CONSULTAR AHORA
          </a>
        </div>
      </div>
    </div>
  );
}