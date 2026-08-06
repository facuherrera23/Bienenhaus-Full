import { ArrowUpRight, Building2, Users, TrendingUp, DollarSign, Activity, Home, FileText, UserCheck } from 'lucide-preact';
import { Link } from 'wouter-preact';
import { QuickPropertyActions } from '../components/QuickPropertyActions';
import { RecentActivity } from '../components/RecentActivity';
import { DashboardCharts } from '../components/DashboardCharts';
import { useProperties } from '../lib/properties.api';
import { useLeads } from '../lib/leads.api';
import { useActionPlans } from '../lib/owners/api';
import { useOwners } from '../lib/owners/api';

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

  const totalLeads = leads?.length ?? 0;
  const newLeads = leads?.filter(l => l.status === 'nuevo').length ?? 0;
  const activeLeads = leads?.filter(l => ['nuevo', 'contactado', 'calificado', 'en_proceso'].includes(l.status)).length ?? 0;
  const wonLeads = leads?.filter(l => l.status === 'cerrado_ganado').length ?? 0;
  const lostLeads = leads?.filter(l => l.status === 'cerrado_perdido').length ?? 0;
  const closedLeads = wonLeads + lostLeads;
  const conversionRate = closedLeads > 0 ? ((wonLeads / closedLeads) * 100).toFixed(1) : '0';

  const totalProps = properties?.length ?? 0;
  const publishedProps = properties?.filter(p => p.status === 'publicada').length ?? 0;
  const featuredProps = properties?.filter(p => p.featured).length ?? 0;
  const pipelineValue = properties
    ?.filter(p => p.listing_type === 'venta' && p.currency === 'USD')
    ?.reduce((sum, p) => sum + (p.price ?? 0), 0) ?? 0;
  const pipelineValueARS = properties
    ?.filter(p => p.listing_type === 'venta' && p.currency === 'ARS')
    ?.reduce((sum, p) => sum + (p.price ?? 0), 0) ?? 0;

  const totalOwners = owners?.length ?? 0;
  const ownersWithProps = owners?.filter(o => o.property_count > 0).length ?? 0;

const now = new Date();
  const overdueTasks = actionPlans?.reduce((count, plan) => {
    const planTasks = plan.action_plan_tasks ?? [];
    return count + planTasks.filter((t: { due_date: string | null; status: string }) =>
      t.due_date && new Date(t.due_date) < now && t.status !== 'completed'
    ).length;
  }, 0) ?? 0;

  const pendingPlans = actionPlans?.filter(p => ['pending', 'in_progress'].includes(p.status)).length ?? 0;

  const kpis = [
    { label: 'Leads Totales', value: totalLeads, delta: `${newLeads} nuevos`, icon: Users, tone: 'info' },
    { label: 'Leads Activos', value: activeLeads, delta: `Conversión ${conversionRate}%`, icon: TrendingUp, tone: 'success' },
    { label: 'Propiedades Publicadas', value: publishedProps, delta: `${featuredProps} destacadas`, icon: Building2, tone: 'warning' },
    { label: 'Valor Pipeline (USD)', value: pipelineValue > 0 ? `$${pipelineValue.toLocaleString('es-AR')}` : '—', delta: `${totalProps} propiedades totales`, icon: DollarSign, tone: 'info' },
    { label: 'Valor Pipeline (ARS)', value: pipelineValueARS > 0 ? `$${pipelineValueARS.toLocaleString('es-AR')}` : '—', delta: `solo venta`, icon: DollarSign, tone: 'info' },
    { label: 'Propietarios Totales', value: totalOwners, delta: `${ownersWithProps} con propiedades`, icon: UserCheck, tone: 'info' },
    { label: 'Planes de Acción Pendientes', value: pendingPlans, delta: `${overdueTasks} tareas vencidas`, icon: FileText, tone: 'warning' },
  ];

  return (
    <div className="page dashboard-page">
      <div className="page-head">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Vista general de tu negocio inmobiliario en tiempo real.</p>
        </div>
        <Link href="/propiedades" className="btn btn--secondary">
          Ver propiedades <ArrowUpRight size={16} />
        </Link>
      </div>

      {loading && <div className="dashboard-loading">Cargando métricas…</div>}

      <section className="dashboard-section" aria-labelledby="kpi-title">
        <h3 id="kpi-title" className="section-title">Indicadores Clave</h3>
        <div className="kpi-grid">
          {kpis.map((kpi) => (
            <article
              key={kpi.label}
              className={`kpi-card kpi-card--${kpi.tone}`}
              role="region"
              aria-label={`KPI: ${kpi.label}`}
            >
              <span className="kpi-icon" aria-hidden="true">
                <kpi.icon size={20} strokeWidth={1.8} />
              </span>
              <div className="kpi-content">
                <p className="kpi-label">{kpi.label}</p>
                <p className="kpi-value">{loading ? '—' : kpi.value}</p>
                <p className="kpi-delta">{kpi.delta}</p>
              </div>
              <span className="kpi-accent" aria-hidden="true"></span>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-section charts-section" aria-labelledby="charts-title">
        <div className="section-header">
          <h3 id="charts-title" className="section-title">Análisis y Tendencias</h3>
          <Link href="/leads" className="section-link">Ver leads <Users size={14} /></Link>
        </div>
        <DashboardCharts />
      </section>

      <section className="dashboard-section" aria-labelledby="quick-title">
        <div className="section-header">
          <h3 id="quick-title" className="section-title">Acciones Rápidas</h3>
          <Link href="/propiedades" className="section-link">Ver todas <Home size={14} /></Link>
        </div>
        <QuickPropertyActions properties={properties} />
      </section>

      <section className="dashboard-section" aria-labelledby="activity-title">
        <div className="section-header">
          <h3 id="activity-title" className="section-title">Actividad Reciente</h3>
          <Link href="/leads" className="section-link">Ver todos <Activity size={14} /></Link>
        </div>
        <RecentActivity />
      </section>
    </div>
  );
}
