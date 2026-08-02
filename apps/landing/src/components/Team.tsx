import { useReveal } from '../hooks/useReveal';
import { textOf, useSiteContent } from '../lib/content';
import { useAgents } from '../lib/supabase-data';
import { useSiteSettings, getNextWhatsAppUrl } from '../lib/site-settings';

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
      <section className="team" id="equipo" aria-label="Nuestro equipo de expertos" ref={rootRef}>
        <div className="container">
          <header className="team-header">
            <div className="team-header-left">
              <span className="team-label">{label}</span>
              <h2 className="team-title">{title}</h2>
              <p className="team-desc">{description}</p>
            </div>
          </header>
          <div className="team-loading">
            <div className="spinner-large"></div>
            <p>Cargando agentes...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="team" id="equipo" aria-label="Nuestro equipo de expertos" ref={rootRef}>
        <div className="container">
          <header className="team-header">
            <div className="team-header-left">
              <span className="team-label">{label}</span>
              <h2 className="team-title">{title}</h2>
              <p className="team-desc">{description}</p>
            </div>
          </header>
          <div className="team-error">
            <i className="fas fa-exclamation-triangle"></i>
            <p>Error cargando agentes: {error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="team" id="equipo" aria-label="Nuestro equipo de expertos" ref={rootRef}>
      <div className="container">
        <header className="team-header">
          <div className="team-header-left">
            <span className="team-label">{label}</span>
            <h2 className="team-title">{title}</h2>
            <p className="team-desc">{description}</p>
          </div>
          <div className="team-header-right">
            <button className="btn-team">
              CONTACTAR UN ASESOR <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </header>
        <div className="team-grid" id="teamGrid">
          {agents.length > 0 ? (
            agents.map((member, i) => (
              <article className="team-card" data-delay={i * 120} key={member.name}>
                <div className="team-image-wrapper">
                  <img src={member.photo} alt={member.alt} loading="lazy" />
                  <div className="team-image-overlay"></div>
                </div>
                <div className="team-body">
                  <h3 className="team-name">{member.name}</h3>
                  <p className="team-role">{member.role}</p>
                  {member.experience && <p className="team-experience">{member.experience}</p>}
                  <p className="team-bio">{member.bio || 'Asesor inmobiliario con experiencia en el mercado local.'}</p>
                  <div className="team-specialties">
                    {SPECIALTIES.map((pill) => (
                      <span className="team-pill" key={pill}>
                        {pill}
                      </span>
                    ))}
                  </div>
                  <div className="team-social">
                    <button className="social-btn" aria-label="LinkedIn">
                      <i className="fab fa-linkedin-in"></i>
                    </button>
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="social-btn" aria-label="WhatsApp">
                      <i className="fab fa-whatsapp"></i>
                    </a>
                    <button className="social-btn" aria-label="Email">
                      <i className="fas fa-envelope"></i>
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="team-empty">
              <i className="fas fa-users"></i>
              <p>No hay agentes disponibles.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}