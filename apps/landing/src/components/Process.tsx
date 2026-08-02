import { useEffect, useRef } from 'preact/hooks';
import { faIcon, listOf, textOf, useSiteContent } from '../lib/content';

interface Step {
  icon: string;
  title: string;
  desc: string;
}

export function Process() {
  const rootRef = useRef<HTMLElement>(null);
  const { content } = useSiteContent();

  const section = content.proceso ?? {};
  const label = textOf(section.label, 'text', 'Como trabajamos');
  const title = textOf(section.title, 'text', 'Un proceso simple. Resultados extraordinarios.');
  const description = textOf(
    section.description,
    'text',
    'Acompanamos cada operacion con un metodo claro y personalizado para que vender, comprar o invertir sea una experiencia segura, transparente y eficiente.'
  );

  const steps: Step[] = listOf(section.steps).map((s) => ({
    icon: faIcon(textOf(s, 'icon')),
    title: textOf(s, 'title'),
    desc: textOf(s, 'description'),
  }));

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const first = root.querySelector('.step-card');
    if (!first) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => root.querySelector('.timeline-line-progress')?.classList.add('animated'), 300);

            root.querySelectorAll('.timeline-dot').forEach((dot, index) => {
              setTimeout(() => {
                dot.classList.add('visible');
                setTimeout(() => dot.classList.add('active'), 400);
              }, 400 + index * 150);
            });

            root.querySelectorAll('.step-card').forEach((card, index) => {
              const delay = parseInt(card.getAttribute('data-delay') ?? '0', 10) || index * 120;
              setTimeout(() => card.classList.add('visible'), 500 + delay);
            });

            setTimeout(() => root.querySelector('.commitment-bar')?.classList.add('visible'), 800);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -80px 0px' },
    );
    observer.observe(first);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="process" id="proceso" aria-label="Como trabajamos" ref={rootRef}>
      <div className="container">
        <header className="process-header">
          <div className="process-header-left">
            <span className="process-label">{label}</span>
            <h2 className="process-title">{title}</h2>
            <p className="process-desc">{description}</p>
            <a href="#contacto" className="btn-process">
              HABLAR CON UN ASESOR <i className="fas fa-arrow-right"></i>
            </a>
          </div>
          <div className="process-header-right"></div>
        </header>
        <div className="timeline">
          <div className="timeline-line">
            <div className="timeline-line-progress" id="timelineProgress"></div>
          </div>
          <div className="timeline-dots" id="timelineDots">
            {steps.map((_, i) => (
              <span className="timeline-dot" data-index={i} key={i}></span>
            ))}
          </div>
          <div className="steps-grid" id="stepsGrid">
            {steps.map((step, i) => (
              <article className="step-card" data-delay={i * 120} key={step.title}>
                <div className="step-number">{`0${i + 1}`}</div>
                <div className="step-icon" aria-hidden="true">
                  <i className={step.icon}></i>
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="commitment-bar" id="commitmentBar">
          <div className="commitment-icon">
            <i className="fas fa-award"></i>
            <span>Nuestro compromiso</span>
          </div>
          <div className="commitment-text">
            Transparencia, dedicacion y excelencia en cada etapa del proceso. Tu tranquilidad es
            nuestra prioridad, tu exito nuestro compromiso.
          </div>
          <div className="commitment-signature">Bienenhaus</div>
        </div>
      </div>
    </section>
  );
}