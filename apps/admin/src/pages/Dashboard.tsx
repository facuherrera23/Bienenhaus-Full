// apps/admin/src/pages/Dashboard.tsx
import { useEffect, useRef, useState } from 'preact/hooks';
import {
    Activity,
    ArrowUpRight,
    Building2,
    DollarSign,
    FileText,
    Home,
    TrendingUp,
    UserCheck,
    Users,
} from 'lucide-preact';
import { Link } from 'wouter-preact';
import { QuickPropertyActions } from '../components/QuickPropertyActions';
import { RecentActivity } from '../components/RecentActivity';
import { DashboardCharts } from '../components/DashboardCharts';
import { useProperties } from '../lib/properties.api';
import { useLeads } from '../lib/leads.api';
import { useActionPlans } from '../lib/owners/api';
import { useOwners } from '../lib/owners/api';
import styles from '../styles/Dashboard.module.css';

// ============================================================
// HOOK: Count-up animado
// ============================================================
function useCountUp(target: number, duration: number = 1500, start: boolean = true) {
    const [value, setValue] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const startTimeRef = useRef<number | null>(null);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        if (!start) return;

        const animate = (timestamp: number) => {
            if (startTimeRef.current === null) {
                startTimeRef.current = timestamp;
            }

            const elapsed = timestamp - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);
            // EaseOutCubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentValue = target * eased;

            setValue(Math.round(currentValue));

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                setValue(target);
                setIsComplete(true);
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [target, duration, start]);

    return { value, isComplete };
}

// ============================================================
// HOOK: Scroll reveal (IntersectionObserver)
// ============================================================
function useScrollReveal(threshold: number = 0.1) {
    const ref = useRef<HTMLElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [threshold]);

    return { ref, isVisible };
}

export function Dashboard() {
    const { data: leadsResult, isPending: leadsPending } = useLeads({ pageSize: 1000 });
    const { data: propertiesResult, isPending: propsPending } = useProperties({ pageSize: 1000 });
    const { data: actionPlansResult, isPending: plansPending } = useActionPlans({ pageSize: 1000 });
    const { data: ownersResult, isPending: ownersPending } = useOwners({ pageSize: 1000 });

    const loading = leadsPending || propsPending || plansPending || ownersPending;

    const leads = leadsResult?.data ?? [];
    const properties = propertiesResult?.data ?? [];
    const actionPlans = actionPlansResult?.data ?? [];
    const owners = ownersResult?.data ?? [];

    // KPIs
    const totalLeads = leads?.length ?? 0;
    const newLeads = leads?.filter((l) => l.status === 'nuevo').length ?? 0;
    const activeLeads = leads?.filter((l) => ['nuevo', 'contactado', 'calificado', 'en_proceso'].includes(l.status)).length ?? 0;
    const wonLeads = leads?.filter((l) => l.status === 'cerrado_ganado').length ?? 0;
    const lostLeads = leads?.filter((l) => l.status === 'cerrado_perdido').length ?? 0;
    const closedLeads = wonLeads + lostLeads;
    const conversionRate = closedLeads > 0 ? ((wonLeads / closedLeads) * 100) : 0;

    const totalProps = properties?.length ?? 0;
    const publishedProps = properties?.filter((p) => p.status === 'publicada').length ?? 0;
    const featuredProps = properties?.filter((p) => p.featured).length ?? 0;
    const pipelineValue = properties?.filter((p) => p.listing_type === 'venta' && p.currency === 'USD')?.reduce((sum, p) => sum + (p.price ?? 0), 0) ?? 0;
    const pipelineValueARS = properties?.filter((p) => p.listing_type === 'venta' && p.currency === 'ARS')?.reduce((sum, p) => sum + (p.price ?? 0), 0) ?? 0;

    const totalOwners = owners?.length ?? 0;
    const ownersWithProps = owners?.filter((o) => o.property_count > 0).length ?? 0;

    const now = new Date();
    const overdueTasks = actionPlans?.reduce((count, plan) => {
        const planTasks = plan.action_plan_tasks ?? [];
        return count + planTasks.filter((t: { due_date: string | null; status: string }) => t.due_date && new Date(t.due_date) < now && t.status !== 'completed').length;
    }, 0) ?? 0;

    const pendingPlans = actionPlans?.filter((p) => ['pending', 'in_progress'].includes(p.status)).length ?? 0;

    // Scroll reveal para el dashboard
    const { ref: sectionRef, isVisible: sectionVisible } = useScrollReveal(0.05);

    // KPIs con count-up
    const totalLeadsCount = useCountUp(totalLeads, 1500, !loading && sectionVisible);
    const activeLeadsCount = useCountUp(activeLeads, 1500, !loading && sectionVisible);
    const publishedPropsCount = useCountUp(publishedProps, 1500, !loading && sectionVisible);
    const conversionRateCount = useCountUp(conversionRate, 1500, !loading && sectionVisible);
    const totalOwnersCount = useCountUp(totalOwners, 1500, !loading && sectionVisible);
    const pendingPlansCount = useCountUp(pendingPlans, 1500, !loading && sectionVisible);

    const kpis = [
        {
            label: 'Leads Totales',
            value: totalLeadsCount.value,
            delta: `${newLeads} nuevos`,
            icon: Users,
            tone: 'info',
            delay: 0,
        },
        {
            label: 'Leads Activos',
            value: activeLeadsCount.value,
            delta: `Conversión ${conversionRateCount.value}%`,
            icon: TrendingUp,
            tone: 'success',
            delay: 100,
        },
        {
            label: 'Propiedades Publicadas',
            value: publishedPropsCount.value,
            delta: `${featuredProps} destacadas`,
            icon: Building2,
            tone: 'warning',
            delay: 200,
        },
        {
            label: 'Valor Pipeline (USD)',
            value: pipelineValue > 0 ? `$${pipelineValue.toLocaleString('es-AR')}` : '—',
            delta: `${totalProps} propiedades totales`,
            icon: DollarSign,
            tone: 'info',
            delay: 300,
        },
        {
            label: 'Propietarios Totales',
            value: totalOwnersCount.value,
            delta: `${ownersWithProps} con propiedades`,
            icon: UserCheck,
            tone: 'info',
            delay: 400,
        },
        {
            label: 'Planes Pendientes',
            value: pendingPlansCount.value,
            delta: `${overdueTasks} tareas vencidas`,
            icon: FileText,
            tone: 'warning',
            delay: 500,
        },
    ];

    return (
        <div className={`page ${styles.dashboardPage}`} ref={sectionRef}>
            <div className="page-head">
                <div>
                    <h2 className="page-title animate-fade-up animate-duration-normal">
                        Dashboard
                    </h2>
                    <p className="page-subtitle animate-fade-up animate-delay-100">
                        Vista general de tu negocio inmobiliario en tiempo real.
                    </p>
                </div>
                <Link href="/propiedades" className="btn btn--secondary animate-fade-up animate-delay-200">
                    Ver propiedades <ArrowUpRight size={16} />
                </Link>
            </div>

            {loading && (
                <div className={styles.dashboardLoading}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
                        <path d="M12 2C17.5228 2 22 6.47715 22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Cargando métricas…
                </div>
            )}

            {!loading && (
                <>
                    <section className={styles.dashboardSection} aria-labelledby="kpi-title">
                        <h3 id="kpi-title" className={styles.sectionTitle}>
                            Indicadores Clave
                        </h3>
                        <div className={styles.kpiGrid}>
                            {kpis.map((kpi) => (
                                <article
                                    key={kpi.label}
                                    className={`${styles.kpiCard} ${styles[`kpiCard--${kpi.tone}`]}`}
                                    role="region"
                                    aria-label={`KPI: ${kpi.label}`}
                                    style={{ animationDelay: `${kpi.delay}ms` }}
                                >
                                    <span className={styles.kpiIcon} aria-hidden="true">
                                        <kpi.icon size={20} strokeWidth={1.8} />
                                    </span>
                                    <div className={styles.kpiContent}>
                                        <p className={styles.kpiLabel}>{kpi.label}</p>
                                        <p className={styles.kpiValue}>
                                            <span className={styles.countUp}>
                                                {kpi.value === '—' ? '—' : kpi.value}
                                            </span>
                                        </p>
                                        <p className={styles.kpiDelta}>{kpi.delta}</p>
                                    </div>
                                    <span className={styles.kpiAccent} aria-hidden="true" />
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className={`${styles.dashboardSection} charts-section`} aria-labelledby="charts-title">
                        <div className="section-header">
                            <h3 id="charts-title" className={styles.sectionTitle}>
                                Análisis y Tendencias
                            </h3>
                            <Link href="/leads" className={styles.sectionLink}>
                                Ver leads <Users size={14} />
                            </Link>
                        </div>
                        <DashboardCharts />
                    </section>

                    <section className={styles.dashboardSection} aria-labelledby="quick-title">
                        <div className="section-header">
                            <h3 id="quick-title" className={styles.sectionTitle}>
                                Acciones Rápidas
                            </h3>
                            <Link href="/propiedades" className={styles.sectionLink}>
                                Ver todas <Home size={14} />
                            </Link>
                        </div>
                        <QuickPropertyActions properties={properties} />
                    </section>

                    <section className={styles.dashboardSection} aria-labelledby="activity-title">
                        <div className="section-header">
                            <h3 id="activity-title" className={styles.sectionTitle}>
                                Actividad Reciente
                            </h3>
                            <Link href="/leads" className={styles.sectionLink}>
                                Ver todos <Activity size={14} />
                            </Link>
                        </div>
                        <RecentActivity />
                    </section>
                </>
            )}
        </div>
    );
}