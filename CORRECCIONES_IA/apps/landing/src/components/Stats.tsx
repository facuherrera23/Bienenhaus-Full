// apps/landing/src/components/Stats.tsx
import { 
  useCountUp, 
  useParallax, 
  useScrollAnimation,
  useTilt 
} from '@/lib/motion';
import styles from '../styles/modules/Stats.module.css';

interface StatItem {
  id: number;
  icon: string;
  number: number;
  suffix?: string;
  title: string;
  description: string;
  featured?: boolean;
}

const statsData: StatItem[] = [
  {
    id: 1,
    icon: '🏡',
    number: 320,
    suffix: '+',
    title: 'Propiedades',
    description: 'En cartera exclusiva con los mejores estándares de calidad.',
    featured: true,
  },
  {
    id: 2,
    icon: '👥',
    number: 150,
    suffix: '+',
    title: 'Clientes',
    description: 'Satisfechos que confían en nuestro servicio premium.',
  },
  {
    id: 3,
    icon: '⭐',
    number: 98,
    suffix: '%',
    title: 'Satisfacción',
    description: 'Nuestros clientes nos recomiendan y vuelven a confiar en nosotros.',
  },
  {
    id: 4,
    icon: '📅',
    number: 6,
    suffix: '+',
    title: 'Años de Experiencia',
    description: 'Construyendo relaciones y proyectos con excelencia.',
  },
];

export function Stats() {
  // Scroll reveal para el header
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({
    threshold: 0.2,
    once: true,
  });

  // Scroll reveal para el grid
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation({
    threshold: 0.1,
    once: true,
  });

  // Parallax para el fondo
  const { ref: parallaxRef, style: parallaxStyle } = useParallax({
    speed: 0.1,
    direction: 'vertical',
    relativeToViewport: true,
  });

  return (
    <section className={styles.statsPremium} ref={parallaxRef}>
      {/* Fondo decorativo con parallax */}
      <div className={styles.statsBg} style={parallaxStyle} aria-hidden="true" />

      <div className="container">
        {/* Header */}
        <div 
          className={`${styles.statsHeader} ${headerVisible ? styles.visible : ''}`}
          ref={headerRef}
        >
          <span className={styles.statsLabel}>Estadísticas</span>
          <h2 className={styles.statsTitle}>
            <span className={styles.highlight}>Números</span> que hablan
          </h2>
          <p className={styles.statsDesc}>
            La confianza de nuestros clientes y los resultados obtenidos
            respaldan nuestro compromiso con la excelencia.
          </p>
        </div>

        {/* Grid de estadísticas */}
        <div 
          className={`${styles.statsGrid} ${gridVisible ? styles.visible : ''}`}
          ref={gridRef}
        >
          {statsData.map((stat, index) => (
            <StatCard key={stat.id} stat={stat} index={index} isGridVisible={gridVisible} />
          ))}
        </div>

        {/* CTA Inferior */}
        <div 
          className={`${styles.statsCta} ${gridVisible ? styles.visible : ''}`}
        >
          <div className={styles.statsCtaIcon}>
            <span>🏆</span>
            <span>Líderes en el mercado</span>
          </div>
          <p className={styles.statsCtaText}>
            Unimos experiencia, innovación y compromiso para ofrecerte el mejor servicio inmobiliario.
          </p>
          <button className={styles.btnStats}>
            Conocé más
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 3L13 8L9 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

// Componente individual de Stat Card
function StatCard({ 
  stat, 
  index, 
  isGridVisible 
}: { 
  stat: StatItem; 
  index: number; 
  isGridVisible: boolean;
}) {
  // Tilt 3D para la card
  const { ref, style: tiltStyle } = useTilt<HTMLElement>({
    maxAngle: 8,
    transitionSpeed: 300,
    glow: true,
    glowIntensity: 0.3,
  });

  // Scroll reveal individual
  const { ref: cardRef, isVisible: cardVisible } = useScrollAnimation<HTMLElement>({
    threshold: 0.15,
    once: true,
    delay: index * 150,
  });

  // Count-up animado (se activa cuando el grid es visible)
  const countUp = useCountUp(stat.number, {
    duration: 2000 + (index * 200), // Cada card dura un poco más
    start: isGridVisible,
    easing: easeOutExpo,
  });

  return (
    <article 
      className={`${styles.statCard} ${cardVisible ? styles.visible : ''} ${stat.featured ? styles.featured : ''}`}
      ref={(el) => {
        if (el) {
          ref.current = el;
          cardRef.current = el;
        }
      }}
      style={tiltStyle}
    >
      <div className={styles.statCardContent}>
        <div className={styles.statCardIcon}>{stat.icon}</div>
        <div className={styles.statCardNumber}>
          {countUp.value}
          {stat.suffix && <span className={styles.accentSymbol}>{stat.suffix}</span>}
        </div>
        <h3 className={styles.statCardTitle}>{stat.title}</h3>
        <p className={styles.statCardDesc}>{stat.description}</p>
      </div>

      {/* Efecto de glow que sigue al mouse */}
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

// Función de easing personalizada para el count-up
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}