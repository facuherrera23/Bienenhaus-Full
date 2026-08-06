import { useRef, useState } from 'preact/hooks';
import { faIcon, listOf, textOf, useSiteContent } from '../lib/content';
import { ComponentType, lazy, Suspense } from 'preact/compat';
import type { VideoModalProps } from './VideoModal';
import {
  ArrowRight,
  Play,
  ChevronDown,
  Shield,
  Home,
  Users,
  MapPin,
} from 'lucide-preact';
import styles from '../styles/modules/Hero.module.css';

const VideoModal = lazy(() => import('./VideoModal')) as unknown as ComponentType<VideoModalProps>;

// Map FontAwesome icon names to Lucide icons
function getLucideIcon(name: string) {
  const iconMap: Record<string, any> = {
    'fa-home': Home,
    'fa-user-tie': Users,
    'fa-map-marker-alt': MapPin,
    'fa-shield-alt': Shield,
    'fa-crown': Home,
    'fa-handshake': Users,
    'fa-clipboard-list': Home,
    'fa-clock': Shield,
  };
  return iconMap[name] || Home;
}

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
    <section className={styles.hero} id="inicio" aria-label="Presentación principal">
      <picture className={styles.heroBg} role="img" aria-label="Mansión moderna de arquitectura minimalista">
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
          className={styles.heroBgImg}
          loading="eager"
          fetchPriority="high"
        />
      </picture>
      <div className={styles.heroOverlayH} aria-hidden="true"></div>
      <div className={styles.heroOverlayV} aria-hidden="true"></div>

      <div className={styles.heroContent} role="main">
        <div className={styles.heroLeft}>
          <span className={styles.heroDeco} aria-hidden="true"></span>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.heroTitle}>
            <span className={`${styles.line} ${styles.line1}`}>{title.line1 ?? 'Propiedades exclusivas.'}</span>
            <span className={`${styles.line} ${styles.line2}`}> {title.line2 ?? 'Experiencias extraordinarias.'}</span>
          </h1>
          <p className={styles.heroDesc}>{description}</p>

          <div className={styles.heroDivider} aria-hidden="true">
            <span className={styles.dot}></span>
            <span className={styles.line}></span>
          </div>

          <div className={styles.heroActions}>
            <a href="#catalogo" className={styles.btnPrimary}>
              Ver propiedades
              <ArrowRight className={styles.icon} aria-hidden="true" />
            </a>
            <button className={styles.btnVideo} id="videoBtn" onClick={() => setShowVideo(true)}>
              <span className={styles.playCircle} aria-hidden="true">
                <Play className={styles.icon} aria-hidden="true" />
              </span>
              Ver video
            </button>
          </div>
        </div>

        <div className={styles.heroRight}>
          <aside className={styles.statsPanel} aria-label="Estadísticas de la inmobiliaria">
            {stats.map((stat) => {
              const StatIcon = getLucideIcon(stat.icon);
              return (
                <div className={styles.statRow} key={stat.title}>
                  <span className={styles.statIcon} aria-hidden="true">
                    <StatIcon className={styles.icon} aria-hidden="true" />
                  </span>
                  <div>
                    <p className={styles.statNumber}>{stat.value}</p>
                    <p className={styles.statLabel}>{stat.title}</p>
                    <p className={styles.statDesc}>{stat.note}</p>
                  </div>
                </div>
              );
            })}

            <div className={styles.statRowTrust}>
              <span className={styles.statIcon} aria-hidden="true">
                <Shield className={styles.icon} aria-hidden="true" />
              </span>
              <div>
                <p className={styles.trustTitle}>Confianza & Seguridad</p>
                <p className={styles.trustDesc}>
                  Transacciones seguras y asesoramiento profesional durante todo el proceso.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <button
        className={styles.scrollIndicator}
        id="scrollIndicator"
        aria-label="Desplazarse hacia abajo"
        onClick={() =>
          featureBarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
      >
        <ChevronDown className={styles.icon} aria-hidden="true" />
      </button>

      <div className={styles.featureBar} id="featureBar" aria-label="Nuestros diferenciales" ref={featureBarRef}>
        {features.map((feature) => {
          const FeatureIcon = getLucideIcon(feature.icon);
          return (
            <div className={styles.featureItem} key={feature.title}>
              <span className={styles.featureIcon} aria-hidden="true">
                <FeatureIcon className={styles.icon} aria-hidden="true" />
              </span>
              <div>
                <p className={styles.featureTitle}>{feature.title}</p>
                <p className={styles.featureDesc}>{feature.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {showVideo && (
        <Suspense fallback={<div className={styles.videoModalLoading}>Cargando video...</div>}>
          <VideoModal
            isOpen={showVideo}
            onClose={() => setShowVideo(false)}
            videoUrl={videoUrl}
            title={videoTitle}
          />
        </Suspense>
      )}
    </section>
  );
}