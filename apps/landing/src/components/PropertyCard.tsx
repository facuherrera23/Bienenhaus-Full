import { useState } from 'preact/hooks';
import type { Property } from '../data/properties';

export function PropertyCard({
  property,
  index,
  onClick,
}: { property: Property; index: number; onClick?: () => void }) {
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
    { icon: 'fa-bed', value: property.beds, show: property.beds > 0 },
    { icon: 'fa-bath', value: property.baths, show: property.baths > 0 },
    { icon: 'fa-ruler-combined', value: `${property.area}m²`, show: true },
    { icon: 'fa-car', value: property.garage, show: property.garage > 0 },
  ].filter((f) => f.show);

  return (
    <article
      className="property-card"
      data-delay={index * 100}
      data-featured={property.featured ? 'true' : undefined}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="card-image-wrapper">
        <img
          src={property.image}
          alt={property.alt}
          loading="lazy"
        />
        <div className="card-overlay"></div>
        {property.featured && <span className="card-badge">DESTACADA</span>}
        <button
          className={`card-favorite${liked ? ' liked' : ''}${bounce ? ' heart-bounce' : ''}`}
          aria-label="Agregar a favoritos"
          onClick={toggleFav}
        >
          <i className={liked ? 'fas fa-heart' : 'far fa-heart'}></i>
        </button>
      </div>
      <div className="card-body">
        <span className="card-operation">{property.operation === 'alquiler' ? 'Alquiler' : 'Venta'}</span>
        <div className="card-price">{property.price}</div>
        <h3 className="card-title">{property.title}</h3>
        <div className="card-location">
          <i className="fas fa-map-pin"></i> {property.location}
        </div>
        <ul className="card-features">
          {features.map((f) => (
            <li key={f.icon}>
              <i className={`fas ${f.icon}`}></i> {f.value}
            </li>
          ))}
        </ul>
        <p className="card-desc">{property.desc}</p>
        <button className="btn-card">
          VER PROPIEDAD <i className="fas fa-arrow-right"></i>
        </button>
      </div>
    </article>
  );
}
