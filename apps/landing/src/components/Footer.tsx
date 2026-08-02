import { useRef, useState } from 'preact/hooks';
import { useReveal } from '../hooks/useReveal';
import { textOf, useSiteContent } from '../lib/content';
import { subscribeNewsletter } from '../lib/newsletter';
import { images } from '../lib/images';
import { useSiteSettings, getNextWhatsAppUrl } from '../lib/site-settings';

const NAV_LINKS = [
  ['#inicio', 'Inicio'],
  ['#catalogo', 'Venta'],
  ['#catalogo', 'Alquiler'],
  ['#', 'Tasaciones'],
  ['#servicios', 'Servicios'],
  ['#equipo', 'Equipo'],
  ['#contacto', 'Contacto'],
  ['#', 'Blog'],
  ['#', 'Preguntas frecuentes'],
];

const SERVICE_LINKS = [
  ['#', 'Comprar'],
  ['#', 'Vender'],
  ['#', 'Alquilar'],
  ['#', 'Tasaciones'],
  ['#', 'Inversiones'],
  ['#', 'Administración'],
  ['#', 'Desarrollos'],
  ['#', 'Asesoramiento Legal'],
];

export function Footer() {
  const rootRef = useReveal<HTMLElement>('.footer-hero, .footer-col, .footer-bottom', {
    threshold: 0.1,
    rootMargin: '0px',
  });
  const formRef = useRef<HTMLFormElement>(null);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const { content, settings } = useSiteContent();
  const { settings: siteSettings } = useSiteSettings();
  const whatsappUrl = getNextWhatsAppUrl(siteSettings);

  const section = content.footer ?? {};
  const siteName = textOf(settings.site_name, 'value', siteSettings.company.name || 'BIENENHAUS PROPIEDADES');
  const footerTitle = textOf(
    section.title,
    'text',
    'Encontrá el lugar donde comienza tu próxima historia.',
  );
  const newsletterText = textOf(
    section.newsletter,
    'text',
    'Suscribite para recibir las propiedades más exclusivas antes que nadie.',
  );
  const contactItems = [
    { icon: 'fas fa-map-marker-alt', text: textOf(settings.contact_address, 'value', siteSettings.contact.address || 'Córdoba, Argentina') },
    { icon: 'fas fa-phone', text: textOf(settings.contact_phone, 'value', siteSettings.contact.phone || '+54 387 400-0000') },
    { icon: 'fas fa-envelope', text: textOf(settings.contact_email, 'value', siteSettings.contact.email || 'info@bienenhaus.com') },
    { icon: 'fas fa-clock', text: `Lun a Vie ${textOf(settings.contact_hours, 'weekdays', siteSettings.contact.hours?.weekdays || '09:00 - 18:00')}` },
    { icon: 'fab fa-whatsapp', text: whatsappUrl },
  ];

  // Build social links from site settings
  const socialLinks = [
    { icon: 'fa-instagram', url: siteSettings.social.instagram },
    { icon: 'fa-facebook-f', url: siteSettings.social.facebook },
    { icon: 'fa-youtube', url: siteSettings.social.youtube },
    { icon: 'fa-tiktok', url: siteSettings.social.tiktok },
    { icon: 'fa-whatsapp', url: whatsappUrl },
    { icon: 'fa-linkedin-in', url: siteSettings.social.linkedin },
  ].filter(s => s.url && s.url !== '#');

  const handleNewsletter = async (e: Event) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form || sending) return;

    const email = ((form.querySelector('input[type="email"]') as HTMLInputElement)?.value ?? '').trim();
    const honeypot = ((form.querySelector('[data-hp]') as HTMLInputElement)?.value ?? '').trim();
    const accepted = (form.querySelector('#newsletterCheck') as HTMLInputElement)?.checked ?? false;
    if (!accepted) {
      setFeedback({ tone: 'error', text: 'Tenés que aceptar recibir novedades.' });
      return;
    }

    setSending(true);
    setFeedback(null);
    try {
      const created = await subscribeNewsletter(email, honeypot);
      setFeedback({
        tone: 'ok',
        text: created
          ? '¡Gracias! Te sumaste a nuestras novedades.'
          : 'Ya estabas suscripto a nuestras novedades.',
      });
      form.reset();
    } catch (err) {
      setFeedback({
        tone: 'error',
        text: err instanceof Error ? err.message : 'No se pudo completar la suscripción.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <footer className="footer" id="footer" role="contentinfo" ref={rootRef}>
      <div className="footer-watermark" aria-hidden="true">
        BIENENHAUS
      </div>

      <div className="container">
        <div className="footer-hero" id="footerHero">
          <span className="footer-hero-label">{siteName}</span>
          <h2 className="footer-hero-title">{footerTitle}</h2>
          <p className="footer-hero-desc">
            Creamos experiencias inmobiliarias que trascienden la compra y la venta de propiedades.
          </p>
          <div className="footer-hero-actions">
            <button className="btn-footer-primary">
              CONTACTAR UN ASESOR <i className="fas fa-arrow-right"></i>
            </button>
            <button className="btn-footer-secondary">
              VER PROPIEDADES <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>

        <div className="footer-divider"></div>

        <div className="footer-grid">
          <div className="footer-col footer-col-logo" data-delay="0">
            <div className="footer-logo">
              <img src={images.logo} alt={siteName} className="footer-logo-img" />
              <span className="footer-logo-main">BIENENHAUS</span>
              <span className="footer-logo-sub">PROPIEDADES</span>
            </div>            <p className="footer-desc">
              Especialistas en compra, venta, alquiler e inversiones inmobiliarias con una
              experiencia premium y personalizada.
            </p>
            <div className="footer-social">
              {socialLinks.map((s) => (
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="social-btn" key={s.icon} aria-label={s.icon}>
                  <i className={`fab ${s.icon}`}></i>
                </a>
              ))}
            </div>
          </div>

          <div className="footer-col" data-delay="100">
            <h4>Navegación</h4>
            <ul>
              {NAV_LINKS.map(([href, label]) => (
                <li key={label}>
                  <a href={href}>{label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col" data-delay="200">
            <h4>Servicios</h4>
            <ul>
              {SERVICE_LINKS.map(([href, label]) => (
                <li key={label}>
                  <a href={href}>{label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col" data-delay="300">
            <h4>Contacto</h4>
            {contactItems.map((item) => (
              <div className="footer-contact-item" key={item.text}>
                <i className={item.icon}></i>
                <span>{item.text}</span>
              </div>
            ))}
            <div className="footer-mini-map">
              <div className="map-placeholder">
                <i className="fas fa-map"></i>
                <span>Ubicación</span>
              </div>
              <div className="mini-pin"></div>
            </div>
          </div>

          <div className="footer-col" data-delay="400">
            <div className="footer-newsletter-title">Recibí nuevas oportunidades.</div>
            <p className="footer-newsletter-text">{newsletterText}</p>
            <form className="footer-newsletter-form" onSubmit={handleNewsletter} ref={formRef}>
              <div className="input-wrapper">
                <i className="fas fa-envelope"></i>
                <input type="email" placeholder="Tu correo electrónico" required />
              </div>
              <input
                type="text"
                className="hp-field"
                data-hp
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <button type="submit" className="btn-newsletter" disabled={sending}>
                {sending ? 'ENVIANDO…' : 'SUSCRIBIRME'} <i className="fas fa-arrow-right"></i>
              </button>
              <div className="footer-newsletter-checkbox">
                <input type="checkbox" id="newsletterCheck" />
                <label htmlFor="newsletterCheck">Acepto recibir novedades</label>
              </div>
              {feedback && (
                <p className={`footer-newsletter-feedback is-${feedback.tone}`} role="status">
                  {feedback.text}
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="footer-bottom" id="footerBottom">
          <div className="footer-bottom-left">
            &copy; {new Date().getFullYear()} <span className="highlight">{siteSettings.company.name || 'BIENENHAUS PROPIEDADES'}</span> — Todos los
            derechos reservados. {siteSettings.company.matricula && <span> | Matrícula: {siteSettings.company.matricula}</span>}
          </div>
          <div className="footer-bottom-center">
            <a href="#">Política de Privacidad</a>
            <a href="#">Términos y Condiciones</a>
            <a href="#">Cookies</a>
            <a href="#">Mapa del Sitio</a>
          </div>
          <div className="footer-bottom-right">
            <i className="fas fa-map-pin"></i> Diseñado con excelencia. Argentina.
          </div>
        </div>
      </div>
    </footer>
  );
}
