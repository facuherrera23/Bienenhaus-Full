// apps/landing/src/components/Footer.tsx
import { useState } from 'preact/hooks';
import { useScrollAnimation, useRipple } from '@/lib/motion';
import styles from './Footer.module.css';

interface FooterLink {
  label: string;
  href: string;
}

const navLinks: FooterLink[] = [
  { label: 'Inicio', href: '/' },
  { label: 'Propiedades', href: '/catalogo' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Equipo', href: '#equipo' },
  { label: 'Contacto', href: '#contacto' },
];

const serviceLinks: FooterLink[] = [
  { label: 'Tasaciones', href: '/tasaciones' },
  { label: 'Marketing Inmobiliario', href: '/marketing' },
  { label: 'Asesoramiento', href: '/asesoramiento' },
  { label: 'Inversiones', href: '/inversiones' },
];

const legalLinks: FooterLink[] = [
  { label: 'Política de Privacidad', href: '/politica-privacidad' },
  { label: 'Términos y Condiciones', href: '/terminos' },
  { label: 'Defensa del Consumidor', href: '/defensa-consumidor' },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation({
    threshold: 0.15,
    once: true,
  });

  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation({
    threshold: 0.1,
    once: true,
  });

  const { ref: bottomRef, isVisible: bottomVisible } = useScrollAnimation({
    threshold: 0.1,
    once: true,
  });

  const handleNewsletterSubmit = async (e: Event) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setFeedback({ type: 'error', message: 'Ingresá un email válido' });
      return;
    }

    setIsSubmitting(true);
    // Simular envío
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);

    setFeedback({
      type: 'success',
      message: '¡Te suscribiste correctamente!',
    });
    setEmail('');

    setTimeout(() => {
      setFeedback({ type: null, message: '' });
    }, 5000);
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.footerWatermark} aria-hidden="true">
        BIENENHAUS
      </div>

      <div className="container">
        {/* Hero del Footer */}
        <div
          className={`${styles.footerHero} ${heroVisible ? styles.visible : ''}`}
          ref={heroRef}
        >
          <span className={styles.footerHeroLabel}>¿Listo para comenzar?</span>
          <h2 className={styles.footerHeroTitle}>
            <span className={styles.highlight}>Transformá</span> tu futuro
          </h2>
          <p className={styles.footerHeroDesc}>
            Contactanos hoy y descubrí cómo podemos ayudarte a encontrar
            la propiedad que estás buscando.
          </p>
          <div className={styles.footerHeroActions}>
            <a href="/contacto" className={styles.btnFooterPrimary}>
              Contactanos
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M9 3L13 8L9 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </a>
            <a href="/catalogo" className={styles.btnFooterSecondary}>
              Ver propiedades
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M9 3L13 8L9 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </a>
          </div>
        </div>

        <div className={styles.footerDivider} />

        {/* Grid */}
        <div
          className={`${styles.footerGrid} ${gridVisible ? styles.visible : ''}`}
          ref={gridRef}
        >
          {/* Columna 1 - Logo */}
          <div className={styles.footerColLogo}>
            <div className={styles.footerLogo}>
              <span className={styles.footerLogoMain}>BIENENHAUS</span>
              <span className={styles.footerLogoSub}>PROPIEDADES</span>
            </div>
            <p className={styles.footerDesc}>
              Selección premium de propiedades exclusivas en las mejores
              ubicaciones. Asesoramiento personalizado en cada paso.
            </p>
            <div className={styles.footerSocial}>
              <a href="#" className={styles.socialBtn} aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="1" y="1" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="9" cy="9" r="4" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="13.5" cy="4.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </a>
              <a href="#" className={styles.socialBtn} aria-label="Facebook">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M12 3H10.5C9.11929 3 8 4.11929 8 5.5V7.5H6V10.5H8V15.5H11V10.5H13L13.5 7.5H11V5.5C11 5.22386 11.2239 5 11.5 5H13.5V3H12Z" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </a>
              <a href="#" className={styles.socialBtn} aria-label="YouTube">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="1" y="4" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 7L11.5 9L8 11V7Z" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </a>
              <a href="#" className={styles.socialBtn} aria-label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M13 6.5C14.1935 6.5 15.3381 6.97411 16.182 7.81802C17.0259 8.66193 17.5 9.80653 17.5 11V17.5H13.5V11C13.5 10.6022 13.342 10.2206 13.0607 9.93934C12.7794 9.65804 12.3978 9.5 12 9.5C11.6022 9.5 11.2206 9.65804 10.9393 9.93934C10.658 10.2206 10.5 10.6022 10.5 11V17.5H6.5V11C6.5 9.80653 6.97411 8.66193 7.81802 7.81802C8.66193 6.97411 9.80653 6.5 11 6.5H13Z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M4.5 6.5H0.5V17.5H4.5V6.5Z" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="2.5" cy="2.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Columna 2 - Navegación */}
          <div className={styles.footerCol}>
            <h4>Navegación</h4>
            <ul>
              {navLinks.map(link => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 3 - Servicios */}
          <div className={styles.footerCol}>
            <h4>Servicios</h4>
            <ul>
              {serviceLinks.map(link => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 4 - Contacto */}
          <div className={styles.footerCol}>
            <h4>Contacto</h4>
            <div className={styles.footerContactItem}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4L8 8L14 4" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="1" y="2" width="14" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span>bienenhaus.propiedades@gmail.com</span>
            </div>
            <div className={styles.footerContactItem}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 2L5 4L4 6L6 8L8 10L9 9L11 10L13 12" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="1" y="1" width="14" height="14" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span>+54 9 3516 37-9651</span>
            </div>
            <div className={styles.footerContactItem}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 9.5C9.38071 9.5 10.5 8.38071 10.5 7C10.5 5.61929 9.38071 4.5 8 4.5C6.61929 4.5 5.5 5.61929 5.5 7C5.5 8.38071 6.61929 9.5 8 9.5Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 15C11 12.5 13.5 10 13.5 7C13.5 3.96243 11.0376 1.5 8 1.5C4.96243 1.5 2.5 3.96243 2.5 7C2.5 10 5 12.5 8 15Z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span>Córdoba, Argentina</span>
            </div>
          </div>

          {/* Columna 5 - Newsletter */}
          <div className={styles.footerCol}>
            <h4>Newsletter</h4>
            <p className={styles.footerNewsletterText}>
              Suscribite para recibir novedades y propiedades exclusivas.
            </p>
            <form className={styles.footerNewsletterForm} onSubmit={handleNewsletterSubmit}>
              <div className={styles.inputWrapper}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 4L8 8L14 4" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="1" y="2" width="14" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <input
                  type="email"
                  placeholder="Tu email"
                  value={email}
                  onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                  required
                />
              </div>
              <button
                type="submit"
                className={styles.btnNewsletter}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enviando...' : 'Suscribirme'}
              </button>

              {feedback.type && (
                <div className={`${styles.footerNewsletterFeedback} ${feedback.type === 'success' ? styles.isOk : styles.isError}`}>
                  {feedback.message}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div
          className={`${styles.footerBottom} ${bottomVisible ? styles.visible : ''}`}
          ref={bottomRef}
        >
          <div className={styles.footerBottomLeft}>
            © {new Date().getFullYear()} <span className={styles.highlight}>BIENENHAUS PROPIEDADES</span>. Todos los derechos reservados.
          </div>
          <div className={styles.footerBottomCenter}>
            {legalLinks.map(link => (
              <a key={link.href} href={link.href}>{link.label}</a>
            ))}
          </div>
          <div className={styles.footerBottomRight}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 2L7.5 4.5L10 5L8 7.5L8.5 10L6 8.5L3.5 10L4 7.5L2 5L4.5 4.5L6 2Z" fill="currentColor"/>
            </svg>
            Hecho con pasión
          </div>
        </div>
      </div>
    </footer>
  );
}