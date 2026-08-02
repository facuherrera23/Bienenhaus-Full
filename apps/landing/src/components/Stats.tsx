import { useEffect, useState } from 'preact/hooks';
import { useCountUp } from '../hooks/useCountUp';
import { useReveal } from '../hooks/useReveal';
import { faIcon, textOf, useSiteContent } from '../lib/content';

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
      icon: 'fas fa-building',
      title: 'Propiedades comercializadas',
      desc: 'Más de trescientas operaciones exitosas concretadas.',
    },
    {
      target: n('clientes', 1850),
      suffix: '+',
      icon: 'fas fa-users',
      title: 'Clientes satisfechos',
      desc: 'Personas que confiaron en nuestro equipo.',
    },
    {
      target: n('exito', 98),
      suffix: '%',
      icon: 'fas fa-shield-alt',
      title: 'Operaciones exitosas',
      desc: 'Resultados respaldados por experiencia y compromiso.',
    },
    {
      target: n('anios', 15),
      suffix: ' años',
      icon: 'fas fa-clock',
      title: 'Construyendo confianza',
      desc: 'Trayectoria acompañando a compradores e inversores.',
    },
  ];
}

function StatCard({ stat, started, delay }: { stat: Stat; started: boolean; delay: number }) {
  const value = useCountUp(stat.target, started);
  return (
    <div className="stat-card" data-delay={delay}>
      <div className="stat-card-content">
        <div className="stat-card-icon" aria-hidden="true">
          <i className={faIcon(stat.icon)}></i>
        </div>
        <div className="stat-card-number">
          <span className="stat-number-value">{value}</span>
          <span className="accent-symbol">{stat.suffix}</span>
        </div>
        <h3 className="stat-card-title">{stat.title}</h3>
        <p className="stat-card-desc">{stat.desc}</p>
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
    <section className="stats-premium" id="estadisticas" aria-label="Nuestras estadísticas" ref={rootRef}>
      <div className="container">
        <header className="stats-header">
          <span className="stats-label">{label}</span>
          <h2 className="stats-title">{title}</h2>
          <p className="stats-desc">{description}</p>
        </header>
        <div className="stats-grid" id="statsGrid">
          {stats.map((stat, i) => (
            <StatCard key={stat.title} stat={stat} started={started} delay={i * 120} />
          ))}
        </div>
        <div className="stats-cta" id="statsCta">
          <div className="stats-cta-icon">
            <i className="fas fa-gem"></i>
            <span>Más que cifras</span>
          </div>
          <div className="stats-cta-text">
            Construimos relaciones duraderas basadas en confianza, transparencia y resultados.
          </div>
          <button className="btn-stats">
            VER NUESTRAS PROPIEDADES <i className="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </section>
  );
}
