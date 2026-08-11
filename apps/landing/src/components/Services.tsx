// apps/landing/src/components/Services.tsx
import { 
  useScrollAnimation, 
  useTilt,
  useParallax 
} from '@/lib/motion';
import styles from '../styles/modules/Services.module.css';

interface Service {
  id: number;
  icon: string;
  title: string;
  description: string;
  link?: string;
}

const servicesData: Service[] = [
  {
    id: 1,
    icon: '🏡',
    title: 'Propiedades Exclusivas',
    description: 'Selección premium de propiedades en las mejores ubicaciones de la ciudad.',
  },
  {
    id: 2,
    icon: '📊',
    title: 'Tasaciones Profesionales',
    description: 'Valuaciones precisas y análisis comparativo de mercado para tu propiedad.',
  },
  {
    id: 3,
    icon: '🤝',
    title: 'Asesoramiento Personalizado',
    description: 'Acompañamiento integral en cada paso con transparencia y honestidad.',
  },
  {
    id: 4,
    icon: '🏗️',
    title: 'Proyectos de Inversión',
    description: 'Oportunidades exclusivas de inversión en desarrollos inmobiliarios.',
  },
  {
    id: 5,
    icon: '📈',
    title: 'Marketing Inmobiliario',
    description: 'Estrategias de marketing digital para maximizar la visibilidad de tu propiedad.',
  },
  {
    id: 6,
    icon: '🔒',
    title: 'Seguridad y Confianza',
    description: 'Operaciones seguras y transparentes respaldadas por años de experiencia.',
  },
];

export function Services() {
  // Scroll reveal para el header y las cards
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({
    threshold: 0.2,
    once: true,
  });

  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation({
    threshold: 0.1,
    once: true,
  });

  // Parallax para el fondo decorativo
  const { ref: parallaxRef, style: parallaxStyle } = useParallax({
    speed: 0.15,
    direction: 'vertical',
    relativeToViewport: true,
  });

  return (
    <section className={styles.services} ref={parallaxRef}>
      {/* Fondo decorativo con parallax */}
      <div className={styles.servicesBg} style={parallaxStyle} aria-hidden="true" />

      <div className="container">
        {/* Header */}
        <div 
          className={`${styles.servicesHeader} ${headerVisible ? styles.visible : ''}`}
          ref={headerRef}
        >
          <span className={styles.servicesLabel}>Servicios</span>
          <h2 className={styles.servicesTitle}>
            <span className={styles.highlight}>Servicios</span> Premium
          </h2>
          <p className={styles.servicesDesc}>
            Ofrecemos un servicio integral y personalizado para que cada paso
            sea una experiencia excepcional.
          </p>
        </div>

        {/* Grid de servicios */}
        <div 
          className={`${styles.servicesGrid} ${gridVisible ? styles.visible : ''}`}
          ref={gridRef}
        >
          {servicesData.map((service, index) => (
            <ServiceCard 
              key={service.id} 
              service={service} 
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// Componente individual de Service Card con Tilt
function ServiceCard({ service, index }: { service: Service; index: number }) {
  const { ref, style: tiltStyle } = useTilt<HTMLElement>({
    maxAngle: 12,
    transitionSpeed: 300,
    glow: true,
    glowIntensity: 0.4,
  });

  // Scroll reveal individual con delay
  const { ref: cardRef, isVisible: cardVisible } = useScrollAnimation<HTMLElement>({
    threshold: 0.15,
    once: true,
    delay: index * 100,
  });

  return (
    <article 
      className={`${styles.serviceCard} ${cardVisible ? styles.visible : ''}`}
      ref={(el) => {
        // Combinar referencias para tilt y scroll
        if (el) {
          ref.current = el;
          cardRef.current = el;
        }
      }}
      style={tiltStyle}
    >
      <div className={styles.serviceCardInner}>
        <div className={styles.serviceIcon}>{service.icon}</div>
        <h3>{service.title}</h3>
        <p>{service.description}</p>
        <button className={styles.serviceLink}>
          Ver más
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M9 3L13 8L9 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Efecto de glow que sigue al mouse (controlado por useTilt) */}
      <div 
        className={styles.cardGlow}
        style={{
          '--mouse-x': '50%',
          '--mouse-y': '50%',
        }}
        aria-hidden="true"
      />
    </article>
  );
}