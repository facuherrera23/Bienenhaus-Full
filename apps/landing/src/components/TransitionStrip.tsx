// apps/landing/src/components/TransitionStrip.tsx
import { useScrollAnimation } from '@/lib/motion';
import styles from './TransitionStrip.module.css';

export function TransitionStrip() {
  const { ref, isVisible } = useScrollAnimation({
    threshold: 0.3,
    once: true,
  });

  return (
    <div className={styles.transitionStrip} ref={ref}>
      <div className={styles.stripLine} aria-hidden="true" />
      <div className={styles.stripGlow} aria-hidden="true" />
      <p className={`${styles.stripText} ${isVisible ? styles.visible : ''}`}>
        <span className={styles.highlight}>Excelencia</span> · 
        <span className={styles.highlight}> Confianza</span> · 
        <span className={styles.highlight}> Compromiso</span>
      </p>
    </div>
  );
}