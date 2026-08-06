import styles from '../styles/modules/TransitionStrip.module.css';

export function TransitionStrip() {
  return (
    <section className={styles.transitionStrip} aria-label="Transición">
      <div className={styles.stripGlow}></div>
      <div className={styles.stripLine}></div>
      <p className={styles.stripText}>
        Cada propiedad tiene una historia. <span className="highlight">La próxima puede ser la tuya.</span>
      </p>
    </section>
  );
}