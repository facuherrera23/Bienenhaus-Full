import { useEffect, useRef, useState } from 'preact/hooks';
import type { PropertyCardData } from '../lib/supabase-data';

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
  { key: 'beds', icon: 'fa-bed', label: 'Dormitorios', unit: '' },
  { key: 'baths', icon: 'fa-bath', label: 'Baños', unit: '' },
  { key: 'area', icon: 'fa-ruler-combined', label: 'Superficie', unit: ' m²' },
  { key: 'garage', icon: 'fa-car', label: 'Cocheras', unit: '' },
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
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKey);
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
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-desc"
    >
      <div
        className="modal-container"
        ref={containerRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Cerrar detalle de la propiedad">
          <i className="fas fa-times" aria-hidden="true"></i>
          <span className="sr-only">Cerrar</span>
        </button>

        <div className="modal-gallery" role="region" aria-label="Galería de imágenes">
          <div className="modal-main-image">
            <img
              src={allImages[activeImage]}
              alt={`${property.alt} - Imagen ${activeImage + 1} de ${allImages.length}`}
              loading="eager"
            />
            {allImages.length > 1 && (
              <>
                <button
                  className="gallery-nav gallery-nav--prev"
                  onClick={() => setActiveImage((i) => (i === 0 ? allImages.length - 1 : i - 1))}
                  aria-label="Imagen anterior"
                >
                  <i className="fas fa-chevron-left" aria-hidden="true"></i>
                </button>
                <button
                  className="gallery-nav gallery-nav--next"
                  onClick={() => setActiveImage((i) => (i === allImages.length - 1 ? 0 : i + 1))}
                  aria-label="Imagen siguiente"
                >
                  <i className="fas fa-chevron-right" aria-hidden="true"></i>
                </button>
                <div className="gallery-counter" aria-live="polite">
                  {activeImage + 1} / {allImages.length}
                </div>
              </>
            )}
            <div className="modal-badges">
              {property.featured && (
                <span className="badge badge--featured">
                  <i className="fas fa-star" aria-hidden="true"></i> DESTACADA
                </span>
              )}
              <span className={`badge badge--operation badge--${property.operation}`}>
                <i className={property.operation === 'alquiler' ? 'fas fa-key' : 'fas fa-tag'} aria-hidden="true"></i>
                {property.operation === 'alquiler' ? 'Alquiler' : 'Venta'}
              </span>
            </div>
          </div>

          {allImages.length > 1 && (
            <div className="gallery-thumbs" role="tablist" aria-label="Miniaturas">
              {allImages.map((img, idx) => (
                <button
                  key={img}
                  className={`gallery-thumb${idx === activeImage ? ' active' : ''}`}
                  role="tab"
                  aria-selected={idx === activeImage}
                  aria-label={`Ver imagen ${idx + 1}`}
                  onClick={() => handleImageClick(idx)}
                  onKeyDown={(e) => handleThumbKey(e, idx)}
                >
                  <img src={img} alt="" aria-hidden="true" loading="lazy" />
                  {idx === activeImage && <span className="thumb-indicator" aria-hidden="true"></span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="modal-content">
          <div className="modal-header">
            <div className="modal-meta">
              {property.code && (
                <span className="property-code" id="modal-code">
                  <i className="fas fa-hashtag" aria-hidden="true"></i> Ref: {property.code}
                </span>
              )}
              <div className="modal-share" title="Compartir propiedad">
                <button
                  className="share-btn"
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
                  <i className="fas fa-share-alt" aria-hidden="true"></i>
                </button>
              </div>
            </div>
            <h2 id="modal-title" className="modal-title">{property.title}</h2>
            <div className="modal-location">
              <i className="fas fa-map-pin" aria-hidden="true"></i>
              <span>{property.location}</span>
            </div>
            <div className="modal-price">{property.price}</div>
          </div>

          <div className="modal-features" role="list" aria-label="Características principales">
            {features.map((f) => (
              <div key={f.key} className="modal-feature" role="listitem">
                <div className="feature-icon" aria-hidden="true">
                  <i className={`fas ${f.icon}`}></i>
                </div>
                <div className="feature-info">
                  <span className="feature-label">{f.label}</span>
                  <span className="feature-value">
                    {f.value}{f.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {videoId && !isVideoPlaying && (
            <div className="modal-video" id="modal-video">
              <h3>Video de la propiedad</h3>
              <div className="video-wrapper" onClick={() => setIsVideoPlaying(true)}>
                <div className="video-placeholder">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`}
                    title={`Video de ${property.title}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    loading="lazy"
                  ></iframe>
                  <div className="video-play-overlay">
                    <button className="video-play-btn" aria-label="Reproducir video">
                      <i className="fas fa-play" aria-hidden="true"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {videoId && isVideoPlaying && (
            <div className="modal-video video-playing" id="modal-video">
              <h3>Video de la propiedad</h3>
              <div className="video-wrapper">
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

          <div className="modal-description" id="modal-desc">
            <h3>Descripción</h3>
            <p>{property.desc}</p>
          </div>

          <div className="modal-actions">
            <a
              href="/#contacto"
              className="btn btn--primary modal-cta"
              onClick={onClose}
            >
              CONTACTAR <i className="fas fa-arrow-right" aria-hidden="true"></i>
            </a>
          </div>
        </div>

        <div className="modal-sticky-cta" role="complementary" aria-label="Acción rápida">
          <a
            href="/#contacto"
            className="btn btn--primary btn--full"
            onClick={onClose}
          >
            <i className="fas fa-paper-plane" aria-hidden="true"></i>
            CONSULTAR AHORA
          </a>
        </div>
      </div>
    </div>
  );
}