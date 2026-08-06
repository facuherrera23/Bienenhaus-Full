import { useEffect, useState } from 'preact/hooks';
import { useCountUp } from '../hooks/useCountUp';
import { useReveal } from '../hooks/useReveal';
import { textOf, useSiteContent } from '../lib/content';
import { Building2, Users, Shield, Clock, Gem, ArrowRight } from 'lucide-preact';
import styles from '../styles/modules/Stats.module.css';

interface Stat {
  target: number;
  suffix: string;
  icon: string;
  title: string;
  desc: string;
}

function buildStats(settingsStats: Record<string, unknown>): Stat[] {
  const n = (key: string, fallback: number) =>
    typeof settingsStats[key] === 'number' ? (settingsStats[key] as number) : fallback;
  return [
    {
      target: n('comercializadas', 320),
      suffix: '+',
      icon: 'fa-building',
      title: 'Propiedades comercializadas',
      desc: 'Más de trescientas operaciones exitosas concretadas.',
    },
    {
      target: n('clientes', 1850),
      suffix: '+',
      icon: 'fa-users',
      title: 'Clientes satisfechos',
      desc: 'Personas que confiaron en nuestro equipo.',
    },
    {
      target: n('exito', 98),
      suffix: '%',
      icon: 'fa-shield-alt',
      title: 'Operaciones exitosas',
      desc: 'Resultados respaldados por experiencia y compromiso.',
    },
    {
      target: n('anios', 15),
      suffix: ' años',
      icon: 'fa-clock',
      title: 'Construyendo confianza',
      desc: 'Trayectoria acompañando a compradores e inversores.',
    },
  ];
}

function getLucideIcon(name: string) {
  const iconMap: Record<string, any> = {
    'fa-building': Building2,
    'fa-users': Users,
    'fa-shield-alt': Shield,
    'fa-clock': Clock,
  };
  return iconMap[name] || Building2;
}

function StatCard({ stat, started, delay }: { stat: Stat; started: boolean; delay: number }) {
  const value = useCountUp(stat.target, started);
  const StatIcon = getLucideIcon(stat.icon);
  return (
    <div className={`${styles.statCard} ${styles.visible}`} data-delay={delay}>
      <div className={styles.statCardContent}>
        <div className={styles.statCardIcon} aria-hidden="true">
          <StatIcon className={styles.icon} aria-hidden="true" />
        </div>
        <div className={styles.statCardNumber}>
          <span className={styles.statNumberValue}>{value}</span>
          <span className={styles.accentSymbol}>{stat.suffix}</span>
        </div>
        <h3 className={styles.statCardTitle}>{stat.title}</h3>
        <p className={styles.statCardDesc}>{stat.desc}</p>
      </div>
    </div>
  );
}

export function Stats() {
  const rootRef = useReveal<HTMLElement>('.stat-card', { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
  const [started, setStarted] = useState(false);
  const { content, settings } = useSiteContent();

  const section = content.estadisticas ?? {};
  const label = textOf(section.label, 'text', 'Nuestra trayectoria');
  const title = textOf(section.title, 'text', 'Los números hablan por nosotros.');
  const description = textOf(
    section.description,
    'text',
    'Cada operación representa una historia, una familia y un compromiso cumplido. Estos resultados reflejan el trabajo de un equipo dedicado a ofrecer experiencias inmobiliarias excepcionales.',
  );

  const stats = buildStats(settings.stats ?? {});

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const first = root.querySelector('.stat-card');
    if (!first) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => setStarted(true), 600);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' },
    );
    observer.observe(first);
    return () => observer.disconnect();
  }, [rootRef]);

  return (
    <section className={styles.statsPremium} id="estadisticas" aria-label="Nuestras estadísticas" ref={rootRef}>
      <div className="container">
        <header className={styles.statsHeader}>
          <span className={styles.statsLabel}>{label}</span>
          <h2 className={styles.statsTitle}>{title}</h2>
          <p className={styles.statsDesc}>{description}</p>
        </header>
        <div className={styles.statsGrid} id="statsGrid">
          {stats.map((stat, i) => (
            <StatCard key={stat.title} stat={stat} started={started} delay={i * 120} />
          ))}
        </div>
        <div className={styles.statsCta} id="statsCta">
          <div className={styles.statsCtaIcon}>
            <Gem className={styles.icon} aria-hidden="true" />
            <span>Más que cifras</span>
          </div>
          <div className={styles.statsCtaText}>
            Construimos relaciones duraderas basadas en confianza, transparencia y resultados.
          </div>
          <button className={styles.btnStats}>
            VER NUESTRAS PROPIEDADES <ArrowRight className={styles.icon} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}