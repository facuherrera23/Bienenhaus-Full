import { useEffect, useRef } from 'preact/hooks';
import { faIcon, listOf, textOf, useSiteContent } from '../lib/content';
import { ArrowRight, Award, BarChart2, Handshake, Key, Megaphone, Users } from 'lucide-preact';
import styles from '../styles/modules/Process.module.css';

interface Step {
    icon: string;
    title: string;
    desc: string;
}

function getLucideIcon(name: string) {
    const iconMap: Record<string, any> = {
        'fa-users': Users,
        'fa-chart-bar': BarChart2,
        'fa-bullhorn': Megaphone,
        'fa-handshake': Handshake,
        'fa-key': Key,
    };
    return iconMap[name] || Users;
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
        'Acompanamos cada operacion con un metodo claro y personalizado para que vender, comprar o invertir sea una experiencia segura, transparente y eficiente.',
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
                        setTimeout(
                            () =>
                                root
                                    .querySelector('.timeline-line-progress')
                                    ?.classList.add('animated'),
                            300,
                        );

                        root.querySelectorAll('.timeline-dot').forEach((dot, index) => {
                            setTimeout(
                                () => {
                                    dot.classList.add('visible');
                                    setTimeout(() => dot.classList.add('active'), 400);
                                },
                                400 + index * 150,
                            );
                        });

                        root.querySelectorAll('.step-card').forEach((card, index) => {
                            const delay =
                                parseInt(card.getAttribute('data-delay') ?? '0', 10) || index * 120;
                            setTimeout(() => card.classList.add('visible'), 500 + delay);
                        });

                        setTimeout(
                            () => root.querySelector('.commitment-bar')?.classList.add('visible'),
                            800,
                        );
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
        <section className={styles.process} id="proceso" aria-label="Como trabajamos" ref={rootRef}>
            <div className="container">
                <header className={styles.processHeader}>
                    <div className={styles.processHeaderLeft}>
                        <span className={styles.processLabel}>{label}</span>
                        <h2 className={styles.processTitle}>{title}</h2>
                        <p className={styles.processDesc}>{description}</p>
                        <a href="#contacto" className={styles.btnProcess}>
                            HABLAR CON UN ASESOR{' '}
                            <ArrowRight className={styles.icon} aria-hidden="true" />
                        </a>
                    </div>
                    <div className={styles.processHeaderRight}></div>
                </header>
                <div className={styles.timeline}>
                    <div className={styles.timelineLine}>
                        <div className={styles.timelineLineProgress} id="timelineProgress"></div>
                    </div>
                    <div className={styles.timelineDots} id="timelineDots">
                        {steps.map((_, i) => (
                            <span className={styles.timelineDot} data-index={i} key={i}></span>
                        ))}
                    </div>
                    <div className={styles.stepsGrid} id="stepsGrid">
                        {steps.map((step, i) => {
                            const StepIcon = getLucideIcon(step.icon);
                            return (
                                <article
                                    className={`${styles.stepCard} ${styles.visible}`}
                                    data-delay={i * 120}
                                    key={step.title}
                                >
                                    <div className={styles.stepNumber}>{`0${i + 1}`}</div>
                                    <div className={styles.stepIcon} aria-hidden="true">
                                        <StepIcon className={styles.icon} aria-hidden="true" />
                                    </div>
                                    <h3 className={styles.stepTitle}>{step.title}</h3>
                                    <p className={styles.stepDesc}>{step.desc}</p>
                                </article>
                            );
                        })}
                    </div>
                </div>
                <div className={styles.commitmentBar} id="commitmentBar">
                    <div className={styles.commitmentIcon}>
                        <Award className={styles.icon} aria-hidden="true" />
                        <span>Nuestro compromiso</span>
                    </div>
                    <div className={styles.commitmentText}>
                        Transparencia, dedicacion y excelencia en cada etapa del proceso. Tu
                        tranquilidad es nuestra prioridad, tu exito nuestro compromiso.
                    </div>
                    <div className={styles.commitmentSignature}>Bienenhaus</div>
                </div>
            </div>
        </section>
    );
}
