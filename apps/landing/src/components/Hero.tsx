// apps/landing/src/components/Hero.tsx
import { 
  useMouseGlow, 
  useCountUp, 
  useScrollAnimation,
  useRipple 
} from '@/lib/motion';
import styles from '../styles/modules/Hero.module.css';

interface HeroProps {
  onVideoOpen?: () => void;
}

export function Hero({ onVideoOpen }: HeroProps) {
  // Mouse glow para el cursor follower
  const { glowRef, mouseX, mouseY, isActive } = useMouseGlow();
  
  // Ripple para botones
  const { RippleEffect } = useRipple();
  
  // Scroll reveal para las estadísticas
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation({
    threshold: 0.3,
    once: true,
  });

  // Contadores animados para las estadísticas
  const propertiesCount = useCountUp(320, { 
    duration: 2000, 
    start: statsVisible 
  });
  
  const clientsCount = useCountUp(150, { 
    duration: 2000, 
    start: statsVisible 
  });
  
  const yearsCount = useCountUp(6, { 
    duration: 1500, 
    start: statsVisible 
  });

  // Scroll suave para el indicador
  const handleScrollDown = () => {
    const catalogSection = document.getElementById('catalog');
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className={styles.hero} ref={glowRef}>
      {/* Ken Burns Background */}
      <div className={styles.heroBg}>
        <img
          src="/assets/images/hero-bg.jpg"
          className={styles.heroBgImg}
          alt="BIENENHAUS PROPIEDADES - Propiedades exclusivas"
          loading="eager"
          fetchpriority="high"
        />
      </div>

      {/* Overlays existentes */}
      <div className={styles.heroOverlayH} aria-hidden="true" />
      <div className={styles.heroOverlayV} aria-hidden="true" />

      {/* Cursor Follower Glow */}
      <div
        className={`${styles.heroGlow} ${isActive ? styles.isActive : ''}`}
        style={{ 
          left: `${mouseX}px`, 
          top: `${mouseY}px` 
        }}
        aria-hidden="true"
      />

      {/* Partículas flotantes */}
      <div aria-hidden="true">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className={styles.particle} />
        ))}
      </div>

      {/* Contenido principal */}
      <div className="container">
        <div className={styles.heroContent}>
          {/* Hero Left */}
          <div className={styles.heroLeft}>
            <span className={styles.heroDeco} aria-hidden="true" />

            <span className={styles.eyebrow}>
              Bienenhaus Propiedades
            </span>

            <h1 className={styles.heroTitle}>
              <span className={styles.line1}>Descubrí tu</span>
              <span className={styles.line2}>lugar en el mundo</span>
            </h1>

            <p className={styles.heroDesc}>
              Propiedades exclusivas en las mejores zonas.
              Asesoramiento personalizado en cada paso.
            </p>

            <div className={styles.heroDivider} aria-hidden="true">
              <span className={styles.dot} />
              <span className={styles.line} />
            </div>

            <div className={styles.heroActions}>
              <RippleEffect>
                <a href="/catalogo" className={styles.btnPrimary}>
                  Ver Propiedades
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M9 3L13 8L9 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </a>
              </RippleEffect>
              
              <button className={styles.btnVideo} onClick={onVideoOpen}>
                <span className={styles.playCircle}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M4.5 2L14.25 9L4.5 16V2Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </span>
                Ver Video
              </button>
            </div>
          </div>

          {/* Hero Right - Stats Panel */}
          <div className={styles.heroRight} ref={statsRef}>
            <div className={styles.statsPanel}>
              <div className={styles.statRow}>
                <div className={styles.statIcon}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <path d="M3 12L5 10L9 14L13 10L19 16L21 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M3 18V12" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M21 18V14" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </div>
                <div>
                  <div className={styles.statNumber}>
                    {propertiesCount.value}+
                  </div>
                  <div className={styles.statLabel}>Propiedades</div>
                  <div className={styles.statDesc}>en cartera exclusiva</div>
                </div>
              </div>

              <div className={styles.statRow}>
                <div className={styles.statIcon}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M5 20V19C5 15.6863 7.68629 13 11 13H13C16.3137 13 19 15.6863 19 19V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <div className={styles.statNumber}>
                    {clientsCount.value}+
                  </div>
                  <div className={styles.statLabel}>Clientes</div>
                  <div className={styles.statDesc}>satisfechos</div>
                </div>
              </div>

              <div className={styles.statRow}>
                <div className={styles.statIcon}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 6V12L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <div className={styles.statNumber}>
                    {yearsCount.value}+
                  </div>
                  <div className={styles.statLabel}>Años</div>
                  <div className={styles.statDesc}>de experiencia</div>
                </div>
              </div>

              <div className={`${styles.statRow} ${styles.statRowTrust}`}>
                <div className={styles.statIcon}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <div className={styles.trustTitle}>Confianza y Transparencia</div>
                  <div className={styles.trustDesc}>
                    Acompañamos cada paso con honestidad y compromiso
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <button 
        className={styles.scrollIndicator} 
        aria-label="Scroll hacia abajo"
        onClick={handleScrollDown}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M2 6L9 13L16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Feature Bar */}
      <div className={styles.featureBar}>
        <div className={styles.featureItem}>
          <span className={styles.featureIcon}>🏡</span>
          <div>
            <div className={styles.featureTitle}>Propiedades Premium</div>
            <div className={styles.featureDesc}>Selección exclusiva</div>
          </div>
        </div>
        <div className={styles.featureItem}>
          <span className={styles.featureIcon}>📍</span>
          <div>
            <div className={styles.featureTitle}>Mejores Zonas</div>
            <div className={styles.featureDesc}>Ubicaciones estratégicas</div>
          </div>
        </div>
        <div className={styles.featureItem}>
          <span className={styles.featureIcon}>🤝</span>
          <div>
            <div className={styles.featureTitle}>Asesoramiento</div>
            <div className={styles.featureDesc}>Personalizado en cada paso</div>
          </div>
        </div>
        <div className={styles.featureItem}>
          <span className={styles.featureIcon}>📊</span>
          <div>
            <div className={styles.featureTitle}>6+ Años</div>
            <div className={styles.featureDesc}>de experiencia en el mercado</div>
          </div>
        </div>
      </div>
    </section>
  );
}