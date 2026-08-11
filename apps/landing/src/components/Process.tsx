// apps/landing/src/components/Process.tsx
import { 
  useScrollAnimation, 
  useTilt,
  useParallax 
} from '@/lib/motion';
import styles from '../styles/modules/Process.module.css';

interface Step {
  id: number;
  icon: string;
  title: string;
  description: string;
}

const stepsData: Step[] = [
  {
    id: 1,
    icon: '🔍',
    title: 'Descubrimiento',
    description: 'Analizamos tus necesidades y objetivos para encontrar la propiedad ideal.',
  },
  {
    id: 2,
    icon: '📋',
    title: 'Evaluación',
    description: 'Realizamos un análisis detallado y tasación profesional de tu propiedad.',
  },
  {
    id: 3,
    icon: '📸',
    title: 'Presentación',
    description: 'Creamos una estrategia de marketing personalizada con fotos y videos.',
  },
  {
    id: 4,
    icon: '🤝',
    title: 'Negociación',
    description: 'Gestionamos ofertas y negociamos las mejores condiciones para ti.',
  },
  {
    id: 5,
    icon: '🏠',
    title: 'Cierre',
    description: 'Acompañamos todo el proceso hasta la firma y entrega de llaves.',
  },
];

export function Process() {
  // Scroll reveal para el header
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({
    threshold: 0.2,
    once: true,
  });

  // Scroll reveal para el timeline
  const { ref: timelineRef, isVisible: timelineVisible } = useScrollAnimation({
    threshold: 0.15,
    once: true,
  });

  // Parallax para el fondo
  const { ref: parallaxRef, style: parallaxStyle } = useParallax({
    speed: 0.1,
    direction: 'vertical',
    relativeToViewport: true,
  });

  return (
    <section className={styles.process} ref={parallaxRef}>
      {/* Fondo decorativo con parallax */}
      <div className={styles.processBg} style={parallaxStyle} aria-hidden="true" />

      <div className="container">
        {/* Header */}
        <div 
          className={`${styles.processHeader} ${headerVisible ? styles.visible : ''}`}
          ref={headerRef}
        >
          <div className={styles.processHeaderLeft}>
            <span className={styles.processLabel}>Proceso</span>
            <h2 className={styles.processTitle}>
              <span className={styles.highlight}>Cómo</span> trabajamos
            </h2>
            <p className={styles.processDesc}>
              Un proceso estructurado y transparente para garantizar
              los mejores resultados en cada paso.
            </p>
          </div>
          <div className={styles.processHeaderRight}>
            <button className={styles.btnProcess}>
              Más información
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M9 3L13 8L9 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Timeline y Steps */}
        <div 
          className={`${styles.timeline} ${timelineVisible ? styles.visible : ''}`}
          ref={timelineRef}
        >
          {/* Línea de progreso */}
          <div className={styles.timelineLine} aria-hidden="true">
            <div className={`${styles.timelineLineProgress} ${timelineVisible ? styles.animated : ''}`} />
          </div>

          {/* Dots de la timeline */}
          <div className={styles.timelineDots} aria-hidden="true">
            {stepsData.map((step, index) => (
              <div 
                key={step.id}
                className={`${styles.timelineDot} ${timelineVisible ? styles.visible : ''} ${index === 0 ? styles.active : ''}`}
                style={{ transitionDelay: `${index * 150}ms` }}
              />
            ))}
          </div>

          {/* Grid de pasos */}
          <div className={styles.stepsGrid}>
            {stepsData.map((step, index) => (
              <StepCard key={step.id} step={step} index={index} />
            ))}
          </div>
        </div>

        {/* Commitment Bar */}
        <div 
          className={`${styles.commitmentBar} ${timelineVisible ? styles.visible : ''}`}
        >
          <div className={styles.commitmentIcon}>
            <span>🤝</span>
            <span>Compromiso</span>
          </div>
          <p className={styles.commitmentText}>
            Acompañamos cada paso con honestidad, transparencia y dedicación.
          </p>
          <div className={styles.commitmentSignature}>
            Bienenhaus
          </div>
        </div>
      </div>
    </section>
  );
}

// Componente individual de Step Card con Tilt
function StepCard({ step, index }: { step: Step; index: number }) {
  const { ref, style: tiltStyle } = useTilt<HTMLElement>({
    maxAngle: 10,
    transitionSpeed: 300,
    glow: true,
    glowIntensity: 0.3,
  });

  // Scroll reveal individual con delay
  const { ref: cardRef, isVisible: cardVisible } = useScrollAnimation<HTMLElement>({
    threshold: 0.15,
    once: true,
    delay: index * 150,
  });

  return (
    <article 
      className={`${styles.stepCard} ${cardVisible ? styles.visible : ''}`}
      ref={(el) => {
        if (el) {
          ref.current = el;
          cardRef.current = el;
        }
      }}
      style={tiltStyle}
    >
      <div className={styles.stepNumber}>
        {String(step.id).padStart(2, '0')}
      </div>
      <div className={styles.stepIcon}>{step.icon}</div>
      <h3 className={styles.stepTitle}>{step.title}</h3>
      <p className={styles.stepDesc}>{step.description}</p>

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