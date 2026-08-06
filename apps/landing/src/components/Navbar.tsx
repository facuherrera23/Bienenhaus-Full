import { useEffect, useState } from 'preact/hooks';
import { textOf, useSiteContent } from '../lib/content';
import { images } from '../lib/images';
import { useSiteSettings, getNextWhatsAppUrl } from '../lib/site-settings';
import { ArrowRight, Heart } from 'lucide-preact';
import { WhatsappIcon } from '../lib/brand-icons';
import styles from '../styles/modules/Navbar.module.css';

const NAV_ITEMS = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#catalogo', label: 'Venta' },
  { href: '#catalogo', label: 'Alquiler' },
  { href: '#servicios', label: 'Servicios' },
  { href: '#equipo', label: 'Equipo' },
  { href: '#estadisticas', label: 'Estadísticas' },
  { href: '#proceso', label: 'Cómo trabajamos' },
  { href: '#contacto', label: 'Contacto' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [fav, setFav] = useState(false);
  const { settings } = useSiteContent();
  const { settings: siteSettings } = useSiteSettings();
  const whatsappUrl = getNextWhatsAppUrl(siteSettings);

  const siteName = textOf(settings.site_name, 'value', 'BIENENHAUS PROPIEDADES');
  const logoUrl = textOf(settings.logo_url, 'value');

  const logoSrc = logoUrl || images.logoIcon;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <header className={`${styles.navbar}${scrolled ? ` ${styles.isScrolled}` : ''}`} id="navbar" role="banner">
        <div className={styles.navbarInner}>
          <a href="#inicio" className={styles.logo} aria-label={siteName}>
            <img src={logoSrc} alt={siteName} className={styles.logoImg} />
          </a>

          <nav className={styles.navMenu} role="navigation" aria-label="Navegación principal">
            {NAV_ITEMS.map((item, i) => (
              <a key={`${item.href}-${i}`} href={item.href} className={i === 0 ? styles.isActive : ''} aria-label={item.label}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className={styles.navActions}>
            <a href="#" className={styles.btnPublish} aria-label="Publicar propiedad">
              PUBLICAR PROPIEDAD
              <ArrowRight className={styles.icon} aria-hidden="true" />
            </a>
            <button
              className={styles.iconBtn}
              id="whatsappBtn"
              aria-label="WhatsApp"
              onClick={() => window.open(whatsappUrl, '_blank')}
            >
              <WhatsappIcon className={styles.icon} aria-hidden={true} />
            </button>
            <button
              className={`${styles.iconBtn}${fav ? ` ${styles.isActive}` : ''}`}
              id="favBtn"
              aria-label="Favoritos"
              onClick={() => setFav((f) => !f)}
            >
              <Heart className={styles.icon} aria-hidden={true} fill={fav ? 'currentColor' : 'none'} />
            </button>
            <button
              className={styles.iconBtn}
              id="menuBtn"
              aria-label="Menú"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className={styles.hamburgerLines}>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          </div>
        </div>
      </header>

      <nav
        className={`${styles.mobileMenu}${menuOpen ? ` ${styles.isOpen}` : ''}`}
        id="mobileMenu"
        role="navigation"
        aria-label="Navegación móvil"
      >
        {NAV_ITEMS.map((item, i) => (
          <a
            key={`${item.href}-${i}`}
            href={item.href}
            className={i === 0 ? styles.isActive : ''}
            onClick={() => setMenuOpen(false)}
            aria-label={item.label}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </>
  );
}