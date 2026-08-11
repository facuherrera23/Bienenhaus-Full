// apps/landing/src/components/Catalog.tsx
import { useState, useMemo } from 'preact/hooks';
import { useScrollAnimation, useTilt, useRipple } from '@/lib/motion';
import styles from './Catalog.module.css';

// Datos de ejemplo (reemplazar con datos reales de Supabase)
const propertiesData = [
  {
    id: 1,
    title: 'Penthouse de Lujo',
    price: '$1,200,000',
    location: 'Palermo, CABA',
    operation: 'Venta',
    type: 'Penthouse',
    bedrooms: 4,
    bathrooms: 3,
    area: 280,
    garage: 2,
    description: 'Penthouse exclusivo con terraza privada y vistas panorámicas.',
    image: '/assets/images/properties/penthouse.jpg',
    featured: true,
  },
  {
    id: 2,
    title: 'Casa en Barrio Cerrado',
    price: '$850,000',
    location: 'Nordelta, Bs As',
    operation: 'Venta',
    type: 'Casa',
    bedrooms: 5,
    bathrooms: 4,
    area: 350,
    garage: 3,
    description: 'Amplia casa con jardín y pileta en exclusivo barrio privado.',
    image: '/assets/images/properties/casa.jpg',
    featured: false,
  },
  // ... más propiedades
];

const operationTypes = ['Todos', 'Venta', 'Alquiler'];
const propertyTypes = ['Todos', 'Casa', 'Penthouse', 'Departamento', 'PH'];

export function Catalog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOperation, setSelectedOperation] = useState('Todos');
  const [selectedType, setSelectedType] = useState('Todos');
  const [selectedLocation, setSelectedLocation] = useState('Todos');
  const [priceRange, setPriceRange] = useState('Todos');
  const [selectedBedrooms, setSelectedBedrooms] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(6);

  // Scroll reveal para el header
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({
    threshold: 0.2,
    once: true,
  });

  // Scroll reveal para el grid
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation({
    threshold: 0.05,
    once: true,
  });

  // Filtrar propiedades
  const filteredProperties = useMemo(() => {
    return propertiesData.filter(prop => {
      const matchesSearch = prop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           prop.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesOperation = selectedOperation === 'Todos' || prop.operation === selectedOperation;
      const matchesType = selectedType === 'Todos' || prop.type === selectedType;
      const matchesBedrooms = selectedBedrooms === null || prop.bedrooms >= selectedBedrooms;
      return matchesSearch && matchesOperation && matchesType && matchesBedrooms;
    });
  }, [searchTerm, selectedOperation, selectedType, selectedBedrooms]);

  const visibleProperties = filteredProperties.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProperties.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 6);
  };

  return (
    <section className={styles.catalog} id="catalog">
      <div className="container">
        {/* Header */}
        <div 
          className={`${styles.catalogHeader} ${headerVisible ? styles.visible : ''}`}
          ref={headerRef}
        >
          <div className={styles.catalogHeaderLeft}>
            <span className={styles.catalogLabel}>Catálogo</span>
            <h2 className={styles.catalogTitle}>
              Propiedades <span className={styles.highlight}>Exclusivas</span>
            </h2>
            <p className={styles.catalogDesc}>
              Descubrí nuestra selección premium de propiedades en las mejores ubicaciones.
            </p>
          </div>
          <div className={styles.catalogHeaderRight}>
            <button className={styles.btnOutline}>
              Ver todas
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M9 3L13 8L9 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className={styles.searchBar}>
          <div className={styles.searchGroup}>
            <label>Buscar</label>
            <div className={styles.searchInputWrapper}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar propiedades..."
                value={searchTerm}
                onInput={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
              />
            </div>
          </div>

          <div className={styles.searchGroup}>
            <label>Operación</label>
            <select 
              value={selectedOperation}
              onChange={(e) => setSelectedOperation((e.target as HTMLSelectElement).value)}
            >
              {operationTypes.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>

          <div className={styles.searchGroup}>
            <label>Tipo</label>
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType((e.target as HTMLSelectElement).value)}
            >
              {propertyTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className={styles.searchGroup}>
            <label>Precio</label>
            <select 
              value={priceRange}
              onChange={(e) => setPriceRange((e.target as HTMLSelectElement).value)}
            >
              <option value="Todos">Todos</option>
              <option value="0-500000">Hasta $500k</option>
              <option value="500000-1000000">$500k - $1M</option>
              <option value="1000000+">Más de $1M</option>
            </select>
          </div>

          <div className={styles.searchGroup}>
            <label>Dormitorios</label>
            <div className={styles.bedroomPills}>
              {[1, 2, 3, 4].map(num => (
                <button
                  key={num}
                  className={`${styles.pill} ${selectedBedrooms === num ? styles.active : ''}`}
                  onClick={() => setSelectedBedrooms(selectedBedrooms === num ? null : num)}
                >
                  {num}
                </button>
              ))}
              <button
                className={`${styles.pill} ${selectedBedrooms === 5 ? styles.active : ''}`}
                onClick={() => setSelectedBedrooms(selectedBedrooms === 5 ? null : 5)}
              >
                4+
              </button>
            </div>
          </div>

          <button className={styles.btnSearch}>
            Buscar
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 3L13 8L9 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className={styles.filtersSection}>
          <div className={styles.filtersPills}>
            {['Todos', 'Destacadas', 'Nuevas', 'Oportunidad'].map(filter => (
              <button
                key={filter}
                className={`${styles.filterPill} ${filter === 'Todos' ? styles.active : ''}`}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className={styles.filtersRight}>
            <span className={styles.resultsCount}>
              {filteredProperties.length} propiedades
            </span>
            <div className={styles.viewToggles}>
              <button className={`${styles.viewBtn} ${styles.active}`}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="1" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="1" y="11" width="6" height="6" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="11" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="11" y="11" width="6" height="6" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </button>
              <button className={styles.viewBtn}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="1" y="1" width="15" height="4" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="1" y="7" width="15" height="4" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="1" y="13" width="15" height="4" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Property Grid */}
        <div 
          className={`${styles.catalogGrid} ${gridVisible ? styles.visible : ''}`}
          ref={gridRef}
        >
          {visibleProperties.length > 0 ? (
            visibleProperties.map((property, index) => (
              <PropertyCard key={property.id} property={property} index={index} />
            ))
          ) : (
            <div className={styles.catalogEmpty}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 8L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M16 8L8 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p>No se encontraron propiedades</p>
            </div>
          )}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className={styles.loadMoreWrapper}>
            <LoadMoreButton onClick={handleLoadMore} />
            <span className={styles.loadMoreHint}>
              Mostrando {visibleCount} de {filteredProperties.length} propiedades
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

// Componente de Property Card con Tilt 3D
function PropertyCard({ property, index }: { property: any; index: number }) {
  const [isLiked, setIsLiked] = useState(false);
  const { ref, style: tiltStyle } = useTilt({
    maxAngle: 8,
    transitionSpeed: 300,
    glow: true,
    glowIntensity: 0.3,
  });

  const { ref: cardRef, isVisible: cardVisible } = useScrollAnimation({
    threshold: 0.15,
    once: true,
    delay: index * 100,
  });

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    // Aquí iría la lógica de favoritos
  };

  return (
    <article 
      className={`${styles.propertyCard} ${cardVisible ? styles.visible : ''}`}
      ref={(el) => {
        if (el) {
          ref.current = el;
          cardRef.current = el;
        }
      }}
      style={tiltStyle}
    >
      <div className={styles.cardInner}>
        {/* Image */}
        <div className={styles.cardImageWrapper}>
          <img 
            src={property.image} 
            alt={property.title}
            loading="lazy"
          />
          <div className={styles.cardOverlay} aria-hidden="true" />

          {/* Badge */}
          {property.featured && (
            <span className={styles.cardBadge}>Destacada</span>
          )}

          {/* Favorite Button */}
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

        {/* Content */}
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

          {/* Features */}
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

        {/* Glow effect */}
        <div 
          className={styles.cardGlow}
          style={{
            '--mouse-x': '50%',
            '--mouse-y': '50%',
          }}
          aria-hidden="true"
        />
      </div>
    </article>
  );
}

// Componente Load More con Ripple
function LoadMoreButton({ onClick }: { onClick: () => void }) {
  const { RippleEffect } = useRipple();

  return (
    <RippleEffect>
      <button className={styles.btnLoadMore} onClick={onClick}>
        Cargar más
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 7H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M7 2L12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </RippleEffect>
  );
}