// apps/landing/src/components/Team.tsx
import { useScrollAnimation, useTilt } from '@/lib/motion';
import styles from '../styles/modules/Team.module.css';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  experience: string;
  bio: string;
  specialties: string[];
  photo: string;
  social: {
    linkedin?: string;
    instagram?: string;
    email?: string;
  };
}

const teamData: TeamMember[] = [
  {
    id: 1,
    name: 'Facundo Herrera',
    role: 'CEO & Fundador',
    experience: '10+ años',
    bio: 'Apasionado por el mercado inmobiliario con más de una década de experiencia.',
    specialties: ['Propiedades Premium', 'Inversiones', 'Tasaciones'],
    photo: '/assets/images/team/facundo.jpg',
    social: {
      linkedin: 'https://linkedin.com/in/facundo-herrera',
      instagram: 'https://instagram.com/facundo.herrera',
      email: 'facundo@bienenhaus.com.ar',
    },
  },
  {
    id: 2,
    name: 'María González',
    role: 'Directora Comercial',
    experience: '8+ años',
    bio: 'Especialista en estrategias de marketing y ventas de propiedades exclusivas.',
    specialties: ['Marketing', 'Ventas', 'Negociación'],
    photo: '/assets/images/team/maria.jpg',
    social: {
      linkedin: 'https://linkedin.com/in/maria-gonzalez',
      instagram: 'https://instagram.com/maria.gonzalez',
      email: 'maria@bienenhaus.com.ar',
    },
  },
  {
    id: 3,
    name: 'Carlos Rodríguez',
    role: 'Asesor Senior',
    experience: '15+ años',
    bio: 'Amplia trayectoria en el sector inmobiliario con foco en propiedades de alta gama.',
    specialties: ['Propiedades de Lujo', 'Inversiones', 'Asesoramiento'],
    photo: '/assets/images/team/carlos.jpg',
    social: {
      linkedin: 'https://linkedin.com/in/carlos-rodriguez',
      instagram: 'https://instagram.com/carlos.rodriguez',
      email: 'carlos@bienenhaus.com.ar',
    },
  },
  {
    id: 4,
    name: 'Laura Fernández',
    role: 'Especialista en Tasaciones',
    experience: '6+ años',
    bio: 'Experta en valuaciones profesionales y análisis comparativo de mercado.',
    specialties: ['Tasaciones', 'Análisis de Mercado', 'Valuaciones'],
    photo: '/assets/images/team/laura.jpg',
    social: {
      linkedin: 'https://linkedin.com/in/laura-fernandez',
      instagram: 'https://instagram.com/laura.fernandez',
      email: 'laura@bienenhaus.com.ar',
    },
  },
];

export function Team() {
  // Scroll reveal para el header
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({
    threshold: 0.2,
    once: true,
  });

  // Scroll reveal para el grid
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation({
    threshold: 0.1,
    once: true,
  });

  return (
    <section className={styles.team}>
      <div className="container">
        {/* Header */}
        <div 
          className={`${styles.teamHeader} ${headerVisible ? styles.visible : ''}`}
          ref={headerRef}
        >
          <div className={styles.teamHeaderLeft}>
            <span className={styles.teamLabel}>Nuestro Equipo</span>
            <h2 className={styles.teamTitle}>
              <span className={styles.highlight}>Profesionales</span> a tu servicio
            </h2>
            <p className={styles.teamDesc}>
              Un equipo de expertos apasionados por el mercado inmobiliario,
              comprometidos con tu éxito en cada paso.
            </p>
          </div>
          <div className={styles.teamHeaderRight}>
            <button className={styles.btnTeam}>
              Ver todos
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M9 3L13 8L9 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Grid de miembros del equipo */}
        <div 
          className={`${styles.teamGrid} ${gridVisible ? styles.visible : ''}`}
          ref={gridRef}
        >
          {teamData.map((member, index) => (
            <TeamCard key={member.id} member={member} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Componente individual de Team Card con Tilt
function TeamCard({ member, index }: { member: TeamMember; index: number }) {
  const { ref, style: tiltStyle } = useTilt<HTMLElement>({
    maxAngle: 10,
    transitionSpeed: 300,
    glow: true,
    glowIntensity: 0.3,
  });

  // Scroll reveal individual con delay
  const { ref: cardRef, isVisible: cardVisible } = useScrollAnimation<HTMLElement>({
    threshold: 0.15,
    once: true,
    delay: index * 100,
  });

  return (
    <article 
      className={`${styles.teamCard} ${cardVisible ? styles.visible : ''}`}
      ref={(el) => {
        if (el) {
          ref.current = el;
          cardRef.current = el;
        }
      }}
      style={tiltStyle}
    >
      <div className={styles.teamCardInner}>
        {/* Imagen con overlay */}
        <div className={styles.teamImageWrapper}>
          <img 
            src={member.photo} 
            alt={member.name} 
            loading="lazy"
            className={styles.teamImage}
          />
          <div className={styles.teamImageOverlay} aria-hidden="true" />
        </div>

        {/* Contenido */}
        <div className={styles.teamBody}>
          <h3 className={styles.teamName}>{member.name}</h3>
          <p className={styles.teamRole}>{member.role}</p>
          <p className={styles.teamExperience}>{member.experience} de experiencia</p>
          <p className={styles.teamBio}>{member.bio}</p>

          {/* Especialidades */}
          <div className={styles.teamSpecialties}>
            {member.specialties.map((specialty) => (
              <span key={specialty} className={styles.teamPill}>
                {specialty}
              </span>
            ))}
          </div>

          {/* Redes sociales */}
          <div className={styles.teamSocial}>
            {member.social.linkedin && (
              <a 
                href={member.social.linkedin} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.socialBtn}
                aria-label={`LinkedIn de ${member.name}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M16 8C17.5913 8 19.1174 8.63214 20.2426 9.75736C21.3679 10.8826 22 12.4087 22 14V21H18V14C18 13.4696 17.7893 12.9609 17.4142 12.5858C17.0391 12.2107 16.5304 12 16 12C15.4696 12 14.9609 12.2107 14.5858 12.5858C14.2107 12.9609 14 13.4696 14 14V21H10V14C10 12.4087 10.6321 10.8826 11.7574 9.75736C12.8826 8.63214 14.4087 8 16 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 9H2V21H6V9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </a>
            )}
            {member.social.instagram && (
              <a 
                href={member.social.instagram} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.socialBtn}
                aria-label={`Instagram de ${member.name}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="17.5" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </a>
            )}
            {member.social.email && (
              <a 
                href={`mailto:${member.social.email}`} 
                className={styles.socialBtn}
                aria-label={`Email de ${member.name}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Efecto de glow que sigue al mouse */}
        <div 
          className={styles.cardGlow}
          style={{
            '--mouse-x': '50%',
            '--mouse-y': '50%',
          }}
          aria-hidden="true"
        />
      </div>
    </article>
  );
}