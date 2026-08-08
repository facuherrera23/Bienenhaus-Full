import { useReveal } from '../hooks/useReveal';
import { textOf, useSiteContent } from '../lib/content';
import { useAgents } from '../lib/supabase-data';
import { getNextWhatsAppUrl, useSiteSettings } from '../lib/site-settings';
import { AlertTriangle, ArrowRight, Mail, Users } from 'lucide-preact';
import { LinkedinIcon, WhatsappIcon } from '../lib/brand-icons';
import styles from '../styles/modules/Team.module.css';

const SPECIALTIES = ['Venta Premium', 'Tasaciones', 'Inversiones'];

export function Team() {
    const rootRef = useReveal<HTMLElement>('.team-card', { threshold: 0.1 });
    const { content } = useSiteContent();
    const { settings: siteSettings } = useSiteSettings();
    const whatsappUrl = getNextWhatsAppUrl(siteSettings);

    const { data: agents, loading, error } = useAgents();

    const section = content.equipo ?? {};
    const label = textOf(section.label, 'text', 'Conocé al equipo');
    const title = textOf(
        section.title,
        'text',
        'Expertos que convierten propiedades en oportunidades.',
    );
    const description = textOf(
        section.description,
        'text',
        'Cada operación comienza con una conversación. Nuestro equipo combina experiencia, cercanía y conocimiento del mercado para acompañarte en cada decisión con transparencia y compromiso.',
    );

    if (loading) {
        return (
            <section
                className={styles.team}
                id="equipo"
                aria-label="Nuestro equipo de expertos"
                ref={rootRef}
            >
                <div className="container">
                    <header className={styles.teamHeader}>
                        <div className={styles.teamHeaderLeft}>
                            <span className={styles.teamLabel}>{label}</span>
                            <h2 className={styles.teamTitle}>{title}</h2>
                            <p className={styles.teamDesc}>{description}</p>
                        </div>
                    </header>
                    <div className={styles.teamLoading}>
                        <div className="spinner-large"></div>
                        <p>Cargando agentes...</p>
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section
                className={styles.team}
                id="equipo"
                aria-label="Nuestro equipo de expertos"
                ref={rootRef}
            >
                <div className="container">
                    <header className={styles.teamHeader}>
                        <div className={styles.teamHeaderLeft}>
                            <span className={styles.teamLabel}>{label}</span>
                            <h2 className={styles.teamTitle}>{title}</h2>
                            <p className={styles.teamDesc}>{description}</p>
                        </div>
                    </header>
                    <div className={styles.teamError}>
                        <AlertTriangle className={styles.icon} aria-hidden="true" />
                        <p>Error cargando agentes: {error}</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section
            className={styles.team}
            id="equipo"
            aria-label="Nuestro equipo de expertos"
            ref={rootRef}
        >
            <div className="container">
                <header className={styles.teamHeader}>
                    <div className={styles.teamHeaderLeft}>
                        <span className={styles.teamLabel}>{label}</span>
                        <h2 className={styles.teamTitle}>{title}</h2>
                        <p className={styles.teamDesc}>{description}</p>
                    </div>
                    <div className={styles.teamHeaderRight}>
                        <button className={styles.btnTeam}>
                            CONTACTAR UN ASESOR{' '}
                            <ArrowRight className={styles.icon} aria-hidden="true" />
                        </button>
                    </div>
                </header>
                <div className={styles.teamGrid} id="teamGrid">
                    {agents.length > 0 ? (
                        agents.map((member, i) => (
                            <article
                                className={`${styles.teamCard} ${styles.visible}`}
                                data-delay={i * 120}
                                key={member.name}
                            >
                                <div className={styles.teamImageWrapper}>
                                    <img src={member.photo} alt={member.alt} loading="lazy" />
                                    <div className={styles.teamImageOverlay}></div>
                                </div>
                                <div className={styles.teamBody}>
                                    <h3 className={styles.teamName}>{member.name}</h3>
                                    <p className={styles.teamRole}>{member.role}</p>
                                    {member.experience && (
                                        <p className={styles.teamExperience}>{member.experience}</p>
                                    )}
                                    <p className={styles.teamBio}>
                                        {member.bio ||
                                            'Asesor inmobiliario con experiencia en el mercado local.'}
                                    </p>
                                    <div className={styles.teamSpecialties}>
                                        {SPECIALTIES.map((pill) => (
                                            <span className={styles.teamPill} key={pill}>
                                                {pill}
                                            </span>
                                        ))}
                                    </div>
                                    <div className={styles.teamSocial}>
                                        <button className={styles.socialBtn} aria-label="LinkedIn">
                                            <LinkedinIcon
                                                className={styles.icon}
                                                aria-hidden={true}
                                            />
                                        </button>
                                        <a
                                            href={whatsappUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.socialBtn}
                                            aria-label="WhatsApp"
                                        >
                                            <WhatsappIcon
                                                className={styles.icon}
                                                aria-hidden={true}
                                            />
                                        </a>
                                        <button className={styles.socialBtn} aria-label="Email">
                                            <Mail className={styles.icon} aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))
                    ) : (
                        <div className={styles.teamEmpty}>
                            <Users className={styles.icon} aria-hidden="true" />
                            <p>No hay agentes disponibles.</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
