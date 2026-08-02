import { useReveal } from '../hooks/useReveal';
import { faIcon, listOf, textOf, useSiteContent } from '../lib/content';

interface Service {
  icon: string;
  title: string;
  desc: string;
}

export function Services() {
  const rootRef = useReveal<HTMLElement>('.service-card', { threshold: 0.1 });
  const { content } = useSiteContent();

  const section = content.servicios ?? {};
  const label = textOf(section.label, 'text', 'Nuestros servicios');
  const title = textOf(section.title, 'text', 'Mucho más que una inmobiliaria.');
  const description = textOf(
    section.description,
    'text',
    'Ofrecemos un acompañamiento integral en cada etapa del proceso inmobiliario, con la excelencia y confianza que nos caracteriza.',
  );

  const services: Service[] = listOf(section.items).map((s) => ({
    icon: faIcon(textOf(s, 'icon')),
    title: textOf(s, 'title'),
    desc: textOf(s, 'description'),
  }));

  return (
    <section className="services" id="servicios" aria-label="Nuestros servicios premium" ref={rootRef}>
      <div className="container">
        <header className="services-header">
          <span className="services-label">{label}</span>
          <h2 className="services-title">{title}</h2>
          <p className="services-desc">{description}</p>
          <a href="#contacto" className="btn-outline">
            Hablar con un asesor <i className="fas fa-arrow-right"></i>
          </a>
        </header>
        <div className="services-grid" id="servicesGrid">
          {services.map((service, i) => (
            <article className="service-card" data-delay={i * 100} key={service.title}>
              <div className="service-icon" aria-hidden="true">
                <i className={service.icon}></i>
              </div>
              <h3>{service.title}</h3>
              <p>{service.desc}</p>
              <a href="#catalogo" className="service-link">
                VER MÁS <i className="fas fa-arrow-right"></i>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
