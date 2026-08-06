import { useReveal } from '../hooks/useReveal';
import { faIcon, listOf, textOf, useSiteContent } from '../lib/content';
import { ArrowRight, Home, DollarSign, Scale } from 'lucide-preact';
import styles from '../styles/modules/Services.module.css';

interface Service {
  icon: string;
  title: string;
  desc: string;
}

function getLucideIcon(name: string) {
  const iconMap: Record<string, any> = {
    'fa-home': Home,
    'fa-hand-holding-usd': DollarSign,
    'fa-gavel': Scale,
  };
  return iconMap[name] || Home;
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
    <section className={styles.services} id="servicios" aria-label="Nuestros servicios premium" ref={rootRef}>
      <div className="container">
        <header className={styles.servicesHeader}>
          <span className={styles.servicesLabel}>{label}</span>
          <h2 className={styles.servicesTitle}>{title}</h2>
          <p className={styles.servicesDesc}>{description}</p>
          <a href="#contacto" className={styles.btnOutline}>
            Hablar con un asesor <ArrowRight className={styles.icon} aria-hidden="true" />
          </a>
        </header>
        <div className={styles.servicesGrid} id="servicesGrid">
          {services.map((service, i) => {
            const ServiceIcon = getLucideIcon(service.icon);
            return (
              <article className={`${styles.serviceCard} ${styles.visible}`} data-delay={i * 100} key={service.title}>
                <div className={styles.serviceIcon} aria-hidden="true">
                  <ServiceIcon className={styles.icon} aria-hidden="true" />
                </div>
                <h3>{service.title}</h3>
                <p>{service.desc}</p>
                <a href="#catalogo" className={styles.serviceLink}>
                  VER MÁS <ArrowRight className={styles.icon} aria-hidden="true" />
                </a>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}