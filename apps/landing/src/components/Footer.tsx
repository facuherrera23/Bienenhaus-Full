import { useRef, useState } from 'preact/hooks';
import { useReveal } from '../hooks/useReveal';
import { textOf, useSiteContent } from '../lib/content';
import { subscribeNewsletter } from '../lib/newsletter';
import { images } from '../lib/images';
import { getNextWhatsAppUrl, useSiteSettings } from '../lib/site-settings';
import { ArrowRight, Mail, MapPin } from 'lucide-preact';
import {
    FacebookIcon,
    InstagramIcon,
    LinkedinIcon,
    TiktokIcon,
    WhatsappIcon,
    YoutubeIcon,
} from '../lib/brand-icons';
import styles from '../styles/modules/Footer.module.css';

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

function getSocialIcon(name: string) {
    const iconMap: Record<string, any> = {
        'fa-instagram': InstagramIcon,
        'fa-facebook-f': FacebookIcon,
        'fa-youtube': YoutubeIcon,
        'fa-tiktok': TiktokIcon,
        'fa-whatsapp': WhatsappIcon,
        'fa-linkedin-in': LinkedinIcon,
    };
    return iconMap[name] || InstagramIcon;
}

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
    const siteName = textOf(
        settings.site_name,
        'value',
        siteSettings.company.name || 'BIENENHAUS PROPIEDADES',
    );
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

    // Build social links from site settings
    const socialLinks = [
        { icon: 'fa-instagram', url: siteSettings.social.instagram },
        { icon: 'fa-facebook-f', url: siteSettings.social.facebook },
        { icon: 'fa-youtube', url: siteSettings.social.youtube },
        { icon: 'fa-tiktok', url: siteSettings.social.tiktok },
        { icon: 'fa-whatsapp', url: whatsappUrl },
        { icon: 'fa-linkedin-in', url: siteSettings.social.linkedin },
    ].filter((s) => s.url && s.url !== '#');

    const handleNewsletter = async (e: Event) => {
        e.preventDefault();
        const form = formRef.current;
        if (!form || sending) return;

        const email = (
            (form.querySelector('input[type="email"]') as HTMLInputElement)?.value ?? ''
        ).trim();
        const honeypot = (
            (form.querySelector('[data-hp]') as HTMLInputElement)?.value ?? ''
        ).trim();
        const accepted =
            (form.querySelector('#newsletterCheck') as HTMLInputElement)?.checked ?? false;
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
        <footer className={styles.footer} id="footer" role="contentinfo" ref={rootRef}>
            <div className={styles.footerWatermark} aria-hidden="true">
                BIENENHAUS
            </div>

            <div className="container">
                <div className={`${styles.footerHero} ${styles.visible}`} id="footerHero">
                    <span className={styles.footerHeroLabel}>{siteName}</span>
                    <h2 className={styles.footerHeroTitle}>{footerTitle}</h2>
                    <p className={styles.footerHeroDesc}>
                        Creamos experiencias inmobiliarias que trascienden la compra y la venta de
                        propiedades.
                    </p>
                    <div className={styles.footerHeroActions}>
                        <button className={styles.btnFooterPrimary}>
                            CONTACTAR UN ASESOR{' '}
                            <ArrowRight className={styles.icon} aria-hidden="true" />
                        </button>
                        <button className={styles.btnFooterSecondary}>
                            VER PROPIEDADES{' '}
                            <ArrowRight className={styles.icon} aria-hidden="true" />
                        </button>
                    </div>
                </div>

                <div className={styles.footerDivider}></div>

                <div className={styles.footerGrid}>
                    <div className={`${styles.footerCol} ${styles.footerColLogo} ${styles.visible}`} data-delay="0">
                        <div className={styles.footerLogo}>
                            <img
                                src={images.logo}
                                alt={siteName}
                                className={styles.footerLogoImg}
                            />
                            <span className={styles.footerLogoMain}>BIENENHAUS</span>
                            <span className={styles.footerLogoSub}>PROPIEDADES</span>
                        </div>
                        <p className={styles.footerDesc}>
                            Especialistas en compra, venta, alquiler e inversiones inmobiliarias con
                            una experiencia premium y personalizada.
                        </p>
                        <div className={styles.footerSocial}>
                            {socialLinks.map((s) => {
                                const SocialIcon = getSocialIcon(s.icon);
                                return (
                                    <a
                                        href={s.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.socialBtn}
                                        key={s.icon}
                                        aria-label={s.icon}
                                    >
                                        <SocialIcon className={styles.icon} aria-hidden="true" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    <div className={`${styles.footerCol} ${styles.visible}`} data-delay="100">
                        <h4>Navegación</h4>
                        <ul>
                            {NAV_LINKS.map(([href, label]) => (
                                <li key={label}>
                                    <a href={href} aria-label={label}>
                                        {label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className={`${styles.footerCol} ${styles.visible}`} data-delay="200">
                        <h4>Servicios</h4>
                        <ul>
                            {SERVICE_LINKS.map(([href, label]) => (
                                <li key={label}>
                                    <a href={href} aria-label={label}>
                                        {label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className={`${styles.footerCol} ${styles.visible}`} data-delay="400">
                        <div className={styles.footerNewsletterTitle}>
                            Recibí nuevas oportunidades.
                        </div>
                        <p className={styles.footerNewsletterText}>{newsletterText}</p>
                        <form
                            className={styles.footerNewsletterForm}
                            onSubmit={handleNewsletter}
                            ref={formRef}
                        >
                            <div className={styles.inputWrapper}>
                                <Mail className={styles.icon} aria-hidden="true" />
                                <label htmlFor="footer-email" className="visually-hidden">
                                    Tu correo electrónico
                                </label>
                                <input
                                    id="footer-email"
                                    type="email"
                                    placeholder="Tu correo electrónico"
                                    required
                                />
                            </div>
                            <input
                                type="text"
                                className={styles.hpField}
                                data-hp
                                tabIndex={-1}
                                autoComplete="off"
                                aria-hidden="true"
                            />
                            <button
                                type="submit"
                                className={styles.btnNewsletter}
                                disabled={sending}
                            >
                                {sending ? 'ENVIANDO…' : 'SUSCRIBIRME'}{' '}
                                <ArrowRight className={styles.icon} aria-hidden="true" />
                            </button>
                            <div className={styles.footerNewsletterCheckbox}>
                                <input type="checkbox" id="newsletterCheck" />
                                <label htmlFor="newsletterCheck">Acepto recibir novedades</label>
                            </div>
                            {feedback && (
                                <p
                                    className={`${styles.footerNewsletterFeedback} is-${feedback.tone}`}
                                    role="status"
                                >
                                    {feedback.text}
                                </p>
                            )}
                        </form>
                    </div>
                </div>

                <div className={`${styles.footerBottom} ${styles.visible}`} id="footerBottom">
                    <div className={styles.footerBottomLeft}>
                        &copy; {new Date().getFullYear()}{' '}
                        <span className="highlight">
                            {siteSettings.company.name || 'BIENENHAUS PROPIEDADES'}
                        </span>{' '}
                        — Todos los derechos reservados.{' '}
                        {siteSettings.company.matricula && (
                            <span> | Matrícula: {siteSettings.company.matricula}</span>
                        )}
                    </div>
                    <div className={styles.footerBottomCenter}>
                        <a href="#" aria-label="Política de Privacidad">
                            Política de Privacidad
                        </a>
                        <a href="#" aria-label="Términos y Condiciones">
                            Términos y Condiciones
                        </a>
                        <a href="#" aria-label="Cookies">
                            Cookies
                        </a>
                        <a href="#" aria-label="Mapa del Sitio">
                            Mapa del Sitio
                        </a>
                    </div>
                    <div className={styles.footerBottomRight}>
                        <MapPin className={styles.icon} aria-hidden="true" /> Diseñado con
                        excelencia. Argentina.
                    </div>
                </div>
            </div>
        </footer>
    );
}
