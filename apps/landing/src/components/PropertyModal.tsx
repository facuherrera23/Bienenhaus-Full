// apps/landing/src/components/PropertyModal.tsx
import { useEffect, useState } from 'preact/hooks';
import styles from '../styles/modules/PropertyModal.module.css';

interface PropertyModalProps {
    isOpen: boolean;
    onClose: () => void;
    property?: {
        id: number;
        title: string;
        price: string;
        location: string;
        operation: string;
        bedrooms: number;
        bathrooms: number;
        area: number;
        garage: number;
        description: string;
        images: string[];
        videoUrl?: string;
        featured?: boolean;
    };
}

export function PropertyModal({ isOpen, onClose, property }: PropertyModalProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setCurrentImageIndex(0);
            setIsVideoPlaying(false);
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen || !property) return null;

    const images = property.images || ['/assets/images/properties/placeholder.jpg'];
    const currentImage = images[currentImageIndex];
    const hasVideo = property.videoUrl;

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div
            className={styles.modalOverlay}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
                <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M18 6L6 18"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                        <path
                            d="M6 6L18 18"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>

                {/* Gallery */}
                <div className={styles.modalGallery}>
                    <div className={styles.modalMainImage}>
                        <img src={currentImage} alt={property.title} loading="lazy" />

                        {images.length > 1 && (
                            <>
                                <button
                                    className={`${styles.galleryNav} ${styles.galleryNavPrev}`}
                                    onClick={prevImage}
                                    aria-label="Imagen anterior"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M15 18L9 12L15 6"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </button>
                                <button
                                    className={`${styles.galleryNav} ${styles.galleryNavNext}`}
                                    onClick={nextImage}
                                    aria-label="Imagen siguiente"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M9 18L15 12L9 6"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </button>
                            </>
                        )}

                        <span className={styles.galleryCounter}>
                            {currentImageIndex + 1} / {images.length}
                        </span>

                        <div className={styles.modalBadges}>
                            {property.featured && (
                                <span className={`${styles.badge} ${styles.badgeFeatured}`}>
                                    Destacada
                                </span>
                            )}
                            <span className={`${styles.badge} ${styles.badgeOperation}`}>
                                {property.operation}
                            </span>
                        </div>
                    </div>

                    {images.length > 1 && (
                        <div className={styles.galleryThumbs}>
                            {images.map((img, index) => (
                                <button
                                    key={index}
                                    className={`${styles.galleryThumb} ${index === currentImageIndex ? styles.active : ''}`}
                                    onClick={() => setCurrentImageIndex(index)}
                                    aria-label={`Ver imagen ${index + 1}`}
                                >
                                    <img src={img} alt="" />
                                    <div className={styles.thumbIndicator} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className={styles.modalContent}>
                    <div className={styles.modalHeader}>
                        <div className={styles.modalMeta}>
                            <span className={styles.propertyCode}>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <rect
                                        x="0.5"
                                        y="0.5"
                                        width="13"
                                        height="13"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    />
                                    <path d="M0.5 4H13.5" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M4 0.5V13.5" stroke="currentColor" strokeWidth="1.5" />
                                </svg>
                                PRO-{String(property.id).padStart(4, '0')}
                            </span>
                            <button className={styles.shareBtn} aria-label="Compartir">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                    <circle
                                        cx="4"
                                        cy="9"
                                        r="2.5"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    />
                                    <circle
                                        cx="14"
                                        cy="4"
                                        r="2.5"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    />
                                    <circle
                                        cx="14"
                                        cy="14"
                                        r="2.5"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    />
                                    <path
                                        d="M6.5 7.5L11.5 5.5"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    />
                                    <path
                                        d="M6.5 10.5L11.5 12.5"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    />
                                </svg>
                            </button>
                        </div>
                        <h2 id="modal-title" className={styles.modalTitle}>
                            {property.title}
                        </h2>
                        <div className={styles.modalLocation}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path
                                    d="M8 8.5C9.10457 8.5 10 7.60457 10 6.5C10 5.39543 9.10457 4.5 8 4.5C6.89543 4.5 6 5.39543 6 6.5C6 7.60457 6.89543 8.5 8 8.5Z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                />
                                <path
                                    d="M8 15C11 12.5 13.5 10 13.5 6.5C13.5 3.46243 11.0376 1 8 1C4.96243 1 2.5 3.46243 2.5 6.5C2.5 10 5 12.5 8 15Z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                />
                            </svg>
                            {property.location}
                        </div>
                        <div className={styles.modalPrice}>{property.price}</div>
                    </div>

                    {/* Features */}
                    <div className={styles.modalFeatures}>
                        <div className={styles.modalFeature}>
                            <div className={styles.featureIcon}>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <rect
                                        x="0.5"
                                        y="0.5"
                                        width="19"
                                        height="19"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    />
                                    <path
                                        d="M0.5 10H19.5"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    />
                                    <path
                                        d="M10 0.5V19.5"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    />
                                </svg>
                            </div>
                            <div className={styles.featureInfo}>
                                <span className={styles.featureLabel}>Área</span>
                                <span className={styles.featureValue}>{property.area} m²</span>
                            </div>
                        </div>
                        <div className={styles.modalFeature}>
                            <div className={styles.featureIcon}>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <circle
                                        cx="10"
                                        cy="10"
                                        r="9"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    />
                                    <path
                                        d="M10 2V10L14 14"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                            <div className={styles.featureInfo}>
                                <span className={styles.featureLabel}>Dormitorios</span>
                                <span className={styles.featureValue}>{property.bedrooms}</span>
                            </div>
                        </div>
                        <div className={styles.modalFeature}>
                            <div className={styles.featureIcon}>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <rect
                                        x="0.5"
                                        y="0.5"
                                        width="19"
                                        height="19"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    />
                                    <path
                                        d="M5 6H15"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />
                                    <path
                                        d="M5 14H15"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                            <div className={styles.featureInfo}>
                                <span className={styles.featureLabel}>Baños</span>
                                <span className={styles.featureValue}>{property.bathrooms}</span>
                            </div>
                        </div>
                        <div className={styles.modalFeature}>
                            <div className={styles.featureIcon}>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <rect
                                        x="0.5"
                                        y="0.5"
                                        width="19"
                                        height="19"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    />
                                    <path
                                        d="M12 4V16"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />
                                    <path
                                        d="M16 12H12"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                            <div className={styles.featureInfo}>
                                <span className={styles.featureLabel}>Cocheras</span>
                                <span className={styles.featureValue}>{property.garage}</span>
                            </div>
                        </div>
                    </div>

                    {/* Video */}
                    {hasVideo && (
                        <div
                            className={`${styles.modalVideo} ${isVideoPlaying ? styles.videoPlaying : ''}`}
                        >
                            <h3>Video de la propiedad</h3>
                            <div className={styles.videoWrapper}>
                                <div className={styles.videoPlaceholder}>
                                    <img
                                        src={`https://img.youtube.com/vi/${property.videoUrl}/hqdefault.jpg`}
                                        alt="Video preview"
                                    />
                                    <button
                                        className={styles.videoPlayOverlay}
                                        onClick={() => setIsVideoPlaying(true)}
                                        aria-label="Reproducir video"
                                    >
                                        <div className={styles.videoPlayBtn}>
                                            <svg
                                                width="32"
                                                height="32"
                                                viewBox="0 0 32 32"
                                                fill="none"
                                            >
                                                <path d="M8 4L24 16L8 28V4Z" fill="currentColor" />
                                            </svg>
                                        </div>
                                    </button>
                                </div>
                                {isVideoPlaying && (
                                    <iframe
                                        src={`https://www.youtube.com/embed/${property.videoUrl}?autoplay=1&rel=0`}
                                        allow="autoplay; encrypted-media"
                                        allowFullScreen
                                        title="Video de la propiedad"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div className={styles.modalDescription}>
                        <h3>Descripción</h3>
                        <p>{property.description}</p>
                    </div>

                    {/* Actions */}
                    <div className={styles.modalActions}>
                        <button className={styles.modalCta}>
                            Contactar
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path
                                    d="M3 8H13"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                />
                                <path
                                    d="M9 3L13 8L9 13"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Sticky CTA para mobile */}
                <div className={styles.modalStickyCta}>
                    <button className={styles.modalCta}>
                        Contactar
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                                d="M3 8H13"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                            <path
                                d="M9 3L13 8L9 13"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
