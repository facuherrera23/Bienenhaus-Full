import { useEffect, useState } from 'preact/hooks';
import { textOf, useSiteContent } from '../lib/content';
import { images } from '../lib/images';
import { useSiteSettings, getNextWhatsAppUrl } from '../lib/site-settings';

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
      <header className={`navbar${scrolled ? ' is-scrolled' : ''}`} id="navbar" role="banner">
        <div className="navbar-inner container">
          <a href="#inicio" className="logo" aria-label={siteName}>
            <img src={logoSrc} alt={siteName} className="logo-img" />
          </a>

          <nav className="nav-menu" aria-label="Navegación principal">
            {NAV_ITEMS.map((item, i) => (
              <a key={`${item.href}-${i}`} href={item.href} className={i === 0 ? 'is-active' : ''}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="nav-actions">
            <a href="#" className="btn-publish">
              PUBLICAR PROPIEDAD
              <i className="fas fa-arrow-right"></i>
            </a>
            <button
              className="icon-btn"
              id="whatsappBtn"
              aria-label="WhatsApp"
              onClick={() => window.open(whatsappUrl, '_blank')}
            >
              <i className="fab fa-whatsapp"></i>
            </button>
            <button
              className={`icon-btn${fav ? ' is-active' : ''}`}
              id="favBtn"
              aria-label="Favoritos"
              onClick={() => setFav((f) => !f)}
            >
              <i className={fav ? 'fas fa-heart' : 'far fa-heart'}></i>
            </button>
            <button
              className="icon-btn"
              id="menuBtn"
              aria-label="Menú"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className="hamburger-lines">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          </div>
        </div>
      </header>

      <nav
        className={`mobile-menu${menuOpen ? ' is-open' : ''}`}
        id="mobileMenu"
        aria-label="Navegación móvil"
      >
        {NAV_ITEMS.map((item, i) => (
          <a
            key={`${item.href}-${i}`}
            href={item.href}
            className={i === 0 ? 'is-active' : ''}
            onClick={() => setMenuOpen(false)}
          >
            {item.label}
          </a>
        ))}
        <a href="#" className="btn-publish" onClick={() => setMenuOpen(false)}>
          PUBLICAR PROPIEDAD
          <i className="fas fa-arrow-right"></i>
        </a>
      </nav>
    </>
  );
}
