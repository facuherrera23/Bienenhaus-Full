import { useState } from 'preact/hooks';
import type { PropertyCardData } from '../lib/supabase-data';
import { Bed, Bath, Ruler, Car, MapPin, Heart, ArrowRight } from 'lucide-preact';
import styles from '../styles/modules/PropertyCard.module.css';

export function PropertyCard({
  property,
  index,
  onClick,
}: { property: PropertyCardData; index: number; onClick?: () => void }) {
  const [liked, setLiked] = useState(false);
  const [bounce, setBounce] = useState(false);

  const toggleFav = (e: MouseEvent) => {
    e.stopPropagation();
    const next = !liked;
    setLiked(next);
    if (next) {
      setBounce(true);
      setTimeout(() => setBounce(false), 400);
    }
  };

  const features = [
    { icon: Bed, value: property.beds, show: property.beds > 0, label: 'Dormitorios' },
    { icon: Bath, value: property.baths, show: property.baths > 0, label: 'Baños' },
    { icon: Ruler, value: `${property.area}m²`, show: true, label: 'Superficie' },
    { icon: Car, value: property.garage, show: property.garage > 0, label: 'Cocheras' },
  ].filter((f) => f.show);

  return (
    <article
      className={`${styles.propertyCard} ${styles.visible}`}
      data-delay={index * 100}
      data-featured={property.featured ? 'true' : undefined}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className={styles.cardImageWrapper}>
        <img
          src={property.image}
          alt={property.alt}
          loading="lazy"
        />
        <div className={styles.cardOverlay}></div>
        {property.featured && <span className={styles.cardBadge}>DESTACADA</span>}
        <button
          className={`${styles.cardFavorite}${liked ? ` ${styles.liked}` : ''}${bounce ? ` ${styles.heartBounce}` : ''}`}
          aria-label="Agregar a favoritos"
          onClick={toggleFav}
        >
          <Heart className={styles.icon} aria-hidden="true" fill={liked ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className={styles.cardBody}>
        <span className={styles.cardOperation}>{property.operation === 'alquiler' ? 'Alquiler' : 'Venta'}</span>
        <div className={styles.cardPrice}>{property.price}</div>
        <h3 className={styles.cardTitle}>{property.title}</h3>
        <div className={styles.cardLocation}>
          <MapPin className={styles.icon} aria-hidden="true" /> {property.location}
        </div>
        <ul className={styles.cardFeatures}>
          {features.map((f) => (
            <li key={f.icon}>
              <f.icon className={styles.icon} aria-hidden="true" /> {f.value}
            </li>
          ))}
        </ul>
        <p className={styles.cardDesc}>{property.desc}</p>
        <button className={styles.btnCard}>
          VER PROPIEDAD <ArrowRight className={styles.icon} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}