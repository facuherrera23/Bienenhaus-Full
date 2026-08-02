import { useReveal } from '../hooks/useReveal';
import { textOf, useSiteContent } from '../lib/content';
import { images } from '../lib/images';

const TEAM = [
  {
    name: 'María López',
    photo: images.team.maria,
    alt: 'María López',
    role: 'BROKER SENIOR',
    experience: '12 años de experiencia',
    bio: 'Especialista en propiedades premium y negociación de alto valor.',
  },
  {
    name: 'Juan Pérez',
    photo: images.team.juan,
    alt: 'Juan Pérez',
    role: 'ASESOR COMERCIAL',
    experience: '8 años de experiencia',
    bio: 'Asesoramiento estratégico en compra, venta e inversión inmobiliaria.',
  },
];

const SPECIALTIES = ['Venta Premium', 'Tasaciones', 'Inversiones'];

export function Team() {
  const rootRef = useReveal<HTMLElement>('.team-card', { threshold: 0.1 });
  const { content } = useSiteContent();

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
          {TEAM.map((member, i) => (
            <article className="team-card" data-delay={i * 120} key={member.name}>
              <div className="team-image-wrapper">
                <img src={member.photo} alt={member.alt} loading="lazy" />
                <div className="team-image-overlay"></div>
              </div>
              <div className="team-body">
                <h3 className="team-name">{member.name}</h3>
                <p className="team-role">{member.role}</p>
                <p className="team-experience">{member.experience}</p>
                <p className="team-bio">{member.bio}</p>
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
                  <button className="social-btn" aria-label="WhatsApp">
                    <i className="fab fa-whatsapp"></i>
                  </button>
                  <button className="social-btn" aria-label="Email">
                    <i className="fas fa-envelope"></i>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
