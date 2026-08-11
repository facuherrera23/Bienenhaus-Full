// apps/landing/src/components/PropertyCard.tsx
import { useState } from 'preact/hooks';
import { useTilt } from '@/lib/motion';
import styles from './PropertyCard.module.css';

interface PropertyCardProps {
  property: {
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
    image: string;
    featured?: boolean;
  };
  index?: number;
  onClick?: () => void;
}

export function PropertyCard({ property, index = 0, onClick }: PropertyCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const { ref, style: tiltStyle } = useTilt({
    maxAngle: 8,
    transitionSpeed: 300,
    glow: true,
    glowIntensity: 0.3,
  });

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  return (
    <article
      className={`${styles.propertyCard} ${styles.visible}`}
      ref={ref}
      style={tiltStyle}
      onClick={onClick}
    >
      <div className={styles.cardImageWrapper}>
        <img
          src={property.image}
          alt={property.title}
          loading="lazy"
        />
        <div className={styles.cardOverlay} aria-hidden="true" />

        {property.featured && (
          <span className={styles.cardBadge}>Destacada</span>
        )}

        <button
          className={`${styles.cardFavorite} ${isLiked ? styles.liked : ''}`}
          onClick={handleLike}
          aria-label={isLiked ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'}>
            <path d="M12 21C12 21 3 15 3 8.5C3 5 5.5 3 8 3C10 3 11.5 4.5 12 6C12.5 4.5 14 3 16 3C18.5 3 21 5 21 8.5C21 15 12 21 12 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className={styles.cardBody}>
        <span className={styles.cardOperation}>{property.operation}</span>
        <div className={styles.cardPrice}>{property.price}</div>
        <h3 className={styles.cardTitle}>{property.title}</h3>
        <div className={styles.cardLocation}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 7.5C8.10457 7.5 9 6.60457 9 5.5C9 4.39543 8.10457 3.5 7 3.5C5.89543 3.5 5 4.39543 5 5.5C5 6.60457 5.89543 7.5 7 7.5Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7 12.5C10 9.5 12 7.5 12 5.5C12 2.73858 9.76142 0.5 7 0.5C4.23858 0.5 2 2.73858 2 5.5C2 7.5 4 9.5 7 12.5Z" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          {property.location}
        </div>

        <ul className={styles.cardFeatures}>
          <li>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="0.5" y="0.5" width="13" height="13" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M0.5 7H13.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 0.5V13.5" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            {property.area} m²
          </li>
          <li>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 2V7L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {property.bedrooms} dorm.
          </li>
          <li>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="0.5" y="0.5" width="13" height="13" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M3.5 4.5H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M3.5 9.5H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {property.bathrooms} baños
          </li>
          <li>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="0.5" y="0.5" width="13" height="13" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8.5 3V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M11 8.5H8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {property.garage} cocheras
          </li>
        </ul>

        <p className={styles.cardDesc}>{property.description}</p>

        <button className={styles.btnCard}>
          Ver detalles
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M7 3L10 6L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div
        className={styles.cardGlow}
        style={{ '--mouse-x': '50%', '--mouse-y': '50%' }}
        aria-hidden="true"
      />
    </article>
  );
}