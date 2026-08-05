import { useRef, useState } from 'preact/hooks';
import { faIcon, listOf, textOf, useSiteContent } from '../lib/content';
import { VideoModal } from './VideoModal';

interface HeroStat {
  icon: string;
  value: string;
  title: string;
  note: string;
}

interface HeroFeature {
  icon: string;
  title: string;
  desc: string;
}

const heroImageSources = [
  { width: 1920, avif: '/assets/images/hero/hero-baner-xl.avif', webp: '/assets/images/hero/hero-baner-xl.webp' },
  { width: 1280, avif: '/assets/images/hero/hero-baner-lg.avif', webp: '/assets/images/hero/hero-baner-lg.webp' },
  { width: 1024, avif: '/assets/images/hero/hero-baner-md.avif', webp: '/assets/images/hero/hero-baner-md.webp' },
  { width: 640, avif: '/assets/images/hero/hero-baner-sm.avif', webp: '/assets/images/hero/hero-baner-sm.webp' },
  { width: 320, avif: '/assets/images/hero/hero-baner-xs.avif', webp: '/assets/images/hero/hero-baner-xs.webp' },
];

export function Hero() {
  const featureBarRef = useRef<HTMLDivElement>(null);
  const { content, settings } = useSiteContent();
  const [showVideo, setShowVideo] = useState(false);

  const hero = content.hero ?? {};
  const eyebrow = textOf(hero.eyebrow, 'text', 'Encontrá tu lugar');
  const title = (hero.title ?? {}) as { line1?: string; line2?: string };
  const description = textOf(
    hero.description,
    'text',
    'Selección premium en las mejores zonas. Asesoramiento personalizado en cada paso.',
  );

  const stats: HeroStat[] = listOf(hero.stats).map((s) => ({
    icon: faIcon(textOf(s, 'icon')),
    value: textOf(s, 'value'),
    title: textOf(s, 'title'),
    note: textOf(s, 'note'),
  }));

  const features: HeroFeature[] = listOf(hero.features).map((f) => ({
    icon: faIcon(textOf(f, 'icon')),
    title: textOf(f, 'title'),
    desc: textOf(f, 'text'),
  }));

  const videoUrl = textOf(settings.hero_video_url, 'value', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const videoTitle = textOf(settings.hero_video_title, 'value', 'BIENENHAUS PROPIEDADES');

  return (
    <section className="hero" id="inicio" aria-label="Presentación principal">
      <picture className="hero-bg" role="img" aria-label="Mansión moderna de arquitectura minimalista">
        {heroImageSources.map((src) => (
          <>
            <source srcSet={src.avif} type="image/avif" media={`(min-width: ${src.width}px)`} />
            <source srcSet={src.webp} type="image/webp" media={`(min-width: ${src.width}px)`} />
          </>
        ))}
        <img
          src="/assets/images/hero/hero-baner.png"
          alt="Mansión moderna de arquitectura minimalista en zona residencial exclusiva"
          aria-hidden="true"
          className="hero-bg-img"
          loading="eager"
          fetchPriority="high"
        />
      </picture>
      <div className="hero-overlay-h" aria-hidden="true"></div>
      <div className="hero-overlay-v" aria-hidden="true"></div>

      <div className="hero-content container">
        <div className="hero-left">
          <span className="hero-deco" aria-hidden="true"></span>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="hero-title">
            <span className="line line-1">{title.line1 ?? 'Propiedades exclusivas.'}</span>
            <span className="line line-2"> {title.line2 ?? 'Experiencias extraordinarias.'}</span>
          </h1>
          <p className="hero-desc">{description}</p>

          <div className="hero-divider" aria-hidden="true">
            <span className="dot"></span>
            <span className="line"></span>
          </div>

          <div className="hero-actions">
            <a href="#catalogo" className="btn-primary">
              Ver propiedades
              <i className="fas fa-arrow-right"></i>
            </a>
            <button className="btn-video" id="videoBtn" onClick={() => setShowVideo(true)}>
              <span className="play-circle" aria-hidden="true">
                <i className="fas fa-play"></i>
              </span>
              Ver video
            </button>
          </div>
        </div>

        <div className="hero-right">
          <aside className="stats-panel" aria-label="Estadísticas de la inmobiliaria">
            {stats.map((stat) => (
              <div className="stat-row" key={stat.title}>
                <span className="stat-icon" aria-hidden="true">
                  <i className={stat.icon}></i>
                </span>
                <div>
                  <p className="stat-number">{stat.value}</p>
                  <p className="stat-label">{stat.title}</p>
                  <p className="stat-desc">{stat.note}</p>
                </div>
              </div>
            ))}

            <div className="stat-row trust">
              <span className="stat-icon" aria-hidden="true">
                <i className="fas fa-shield-alt"></i>
              </span>
              <div>
                <p className="trust-title">Confianza & Seguridad</p>
                <p className="trust-desc">
                  Transacciones seguras y asesoramiento profesional durante todo el proceso.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <button
        className="scroll-indicator"
        id="scrollIndicator"
        aria-label="Desplazarse hacia abajo"
        onClick={() =>
          featureBarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
      >
        <i className="fas fa-chevron-down"></i>
      </button>

      <div className="feature-bar" id="featureBar" aria-label="Nuestros diferenciales" ref={featureBarRef}>
        {features.map((feature) => (
          <div className="feature-item" key={feature.title}>
            <span className="feature-icon" aria-hidden="true">
              <i className={feature.icon}></i>
            </span>
            <div>
              <p className="feature-title">{feature.title}</p>
              <p className="feature-desc">{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <VideoModal
        isOpen={showVideo}
        onClose={() => setShowVideo(false)}
        videoUrl={videoUrl}
        title={videoTitle}
      />
    </section>
  );
}