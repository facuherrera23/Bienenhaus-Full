import { useProperties } from '../lib/properties.api';
import { useLeads } from '../lib/leads.api';
import { useMemo } from 'preact/hooks';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Building2, DollarSign, TrendingUp, Users } from 'lucide-preact';
import styles from './DashboardCharts.module.css';

const STATUS_COLORS = {
    // Property status
    publicada: '#1FC8C3',
    borrador: '#6B7280',
    en_revision: '#F59E0B',
    pausada: '#F59E0B',
    vendida: '#3B82F6',
    alquilada: '#3B82F6',
    archivada: '#6B7280',
    // Lead status
    nuevo: '#3B82F6',
    contactado: '#F59E0B',
    calificado: '#8B5CF6',
    en_proceso: '#6B7280',
    cerrado_ganado: '#10B981',
    cerrado_perdido: '#EF4444',
};

const SOURCE_COLORS = {
    landing_form: '#1FC8C3',
    whatsapp: '#25D366',
    telefono: '#3B82F6',
    email: '#6366F1',
    referido: '#F59E0B',
    ml_contacto: '#FF6B00',
    manual: '#6B7280',
};

function formatMonth(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
}

export function DashboardCharts() {
    const { data: leadsResult, isPending: leadsPending } = useLeads({ pageSize: 1000 });
    const { data: propertiesResult, isPending: propsPending } = useProperties({ pageSize: 1000 });

    const leads = leadsResult?.data ?? [];
    const properties = propertiesResult?.data ?? [];

    const leadsByStatus = useMemo(() => {
        return (
            leads?.reduce(
                (acc, l) => {
                    acc[l.status] = (acc[l.status] || 0) + 1;
                    return acc;
                },
                {} as Record<string, number>,
            ) ?? {}
        );
    }, [leads]);

    const propsByStatus = useMemo(() => {
        return (
            properties?.reduce(
                (acc, p) => {
                    acc[p.status] = (acc[p.status] || 0) + 1;
                    return acc;
                },
                {} as Record<string, number>,
            ) ?? {}
        );
    }, [properties]);

    const leadsBySource = useMemo(() => {
        return (
            leads?.reduce(
                (acc, l) => {
                    acc[l.source] = (acc[l.source] || 0) + 1;
                    return acc;
                },
                {} as Record<string, number>,
            ) ?? {}
        );
    }, [leads]);

    const sixMonthsAgo = useMemo(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 6);
        return d.toISOString();
    }, []);

    const leadsByMonth = useMemo(() => {
        return (
            leads
                ?.filter((l) => l.created_at >= sixMonthsAgo)
                ?.reduce(
                    (acc, l) => {
                        const month = formatMonth(l.created_at);
                        acc[month] = (acc[month] || 0) + 1;
                        return acc;
                    },
                    {} as Record<string, number>,
                ) ?? {}
        );
    }, [leads, sixMonthsAgo]);

    const monthOrder = useMemo(() => {
        return Object.keys(leadsByMonth).sort((a, b) => {
            const [ma, ya] = a.split(' ');
            const [mb, yb] = b.split(' ');
            const monthNum = (m: string) =>
                [
                    'ene',
                    'feb',
                    'mar',
                    'abr',
                    'may',
                    'jun',
                    'jul',
                    'ago',
                    'sep',
                    'oct',
                    'nov',
                    'dic',
                ].indexOf(m.toLowerCase());
            const yearA = parseInt(ya, 10) + 2000;
            const yearB = parseInt(yb, 10) + 2000;
            return yearA - yearB || monthNum(ma) - monthNum(mb);
        });
    }, [leadsByMonth]);

    const leadsByMonthSorted = useMemo(() => {
        return monthOrder.map((m) => ({ month: m, count: leadsByMonth[m] }));
    }, [monthOrder, leadsByMonth]);

    if (leadsPending || propsPending) {
        return (
            <div className={styles['charts-grid']}>
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`${styles['chart-card']} placeholder-card`}>
                        Cargando gráficos…
                    </div>
                ))}
            </div>
        );
    }

    if ((leads?.length ?? 0) === 0 && (properties?.length ?? 0) === 0) {
        return (
            <div className={styles['charts-grid']}>
                <div className={`${styles['chart-card']} placeholder-card`}>
                    <p>Sin datos disponibles</p>
                    <p className="muted">Agrega propiedades y leads para ver los gráficos.</p>
                </div>
            </div>
        );
    }

    const totalLeads = leads?.length ?? 0;
    const totalProps = properties?.length ?? 0;
    const publishedProps = propsByStatus.publicada ?? 0;
    const wonLeads = leadsByStatus.cerrado_ganado ?? 0;
    const lostLeads = leadsByStatus.cerrado_perdido ?? 0;
    const closedLeads = wonLeads + lostLeads;
    const conversionRate = closedLeads > 0 ? ((wonLeads / closedLeads) * 100).toFixed(1) : '0';
    const pipelineValueUSD =
        properties
            ?.filter((p) => p.listing_type === 'venta' && p.currency === 'USD')
            ?.reduce((sum, p) => sum + (p.price ?? 0), 0) ?? 0;
    const pipelineValueARS =
        properties
            ?.filter((p) => p.listing_type === 'venta' && p.currency === 'ARS')
            ?.reduce((sum, p) => sum + (p.price ?? 0), 0) ?? 0;

    return (
        <div className="charts-section">
            <div className={`kpi-grid ${styles['charts-kpi']}`}>
                <div className="kpi-card" role="region" aria-label="KPI: Total Leads">
                    <span className="kpi-icon" aria-hidden="true">
                        <Users size={20} strokeWidth={1.8} />
                    </span>
                    <div>
                        <p className="kpi-label">Total Leads</p>
                        <p className="kpi-value">{totalLeads}</p>
                        <p className="kpi-delta">En el sistema</p>
                    </div>
                </div>
                <div className="kpi-card" role="region" aria-label="KPI: Propiedades Publicadas">
                    <span className="kpi-icon" aria-hidden="true">
                        <Building2 size={20} strokeWidth={1.8} />
                    </span>
                    <div>
                        <p className="kpi-label">Propiedades Publicadas</p>
                        <p className="kpi-value">{publishedProps}</p>
                        <p className="kpi-delta">De {totalProps} totales</p>
                    </div>
                </div>
                <div className="kpi-card" role="region" aria-label="KPI: Conversión (Ganados)">
                    <span className="kpi-icon" aria-hidden="true">
                        <TrendingUp size={20} strokeWidth={1.8} />
                    </span>
                    <div>
                        <p className="kpi-label">Conversión (Ganados)</p>
                        <p className="kpi-value">{conversionRate}%</p>
                        <p className="kpi-delta">{wonLeads} cerrados ganados</p>
                    </div>
                </div>
                <div className="kpi-card" role="region" aria-label="KPI: Valor Pipeline (USD)">
                    <span className="kpi-icon" aria-hidden="true">
                        <DollarSign size={20} strokeWidth={1.8} />
                    </span>
                    <div>
                        <p className="kpi-label">Valor Pipeline (USD)</p>
                        <p className="kpi-value">
                            {pipelineValueUSD > 0
                                ? `$${pipelineValueUSD.toLocaleString('es-AR')}`
                                : '—'}
                        </p>
                        <p className="kpi-delta">solo venta</p>
                    </div>
                </div>
                <div className="kpi-card" role="region" aria-label="KPI: Valor Pipeline (ARS)">
                    <span className="kpi-icon" aria-hidden="true">
                        <DollarSign size={20} strokeWidth={1.8} />
                    </span>
                    <div>
                        <p className="kpi-label">Valor Pipeline (ARS)</p>
                        <p className="kpi-value">
                            {pipelineValueARS > 0
                                ? `$${pipelineValueARS.toLocaleString('es-AR')}`
                                : '—'}
                        </p>
                        <p className="kpi-delta">solo venta</p>
                    </div>
                </div>
            </div>

            <div className={styles['charts-grid']}>
                <div className={styles['chart-card']}>
                    <div className={styles['chart-header']}>
                        <h3>Leads por Estado</h3>
                        <p className={styles['chart-subtitle']}>Distribución actual del pipeline</p>
                    </div>
                    <div className={styles['chart-wrapper']}>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart
                                data={Object.entries(leadsByStatus).map(([status, count]) => ({
                                    status: status
                                        .replace(/_/g, ' ')
                                        .replace(/\b\w/g, (c) => c.toUpperCase()),
                                    count,
                                    fill:
                                        STATUS_COLORS[status as keyof typeof STATUS_COLORS] ||
                                        '#888',
                                }))}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a2e35" />
                                <XAxis dataKey="status" stroke="#6b7280" fontSize={12} />
                                <YAxis stroke="#6b7280" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bh-bg-card)',
                                        border: '1px solid var(--bh-border)',
                                        borderRadius: '8px',
                                    }}
                                    labelStyle={{ color: 'var(--bh-text-primary)' }}
                                />
                                <Legend />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={styles['chart-card']}>
                    <div className={styles['chart-header']}>
                        <h3>Propiedades por Estado</h3>
                        <p className={styles['chart-subtitle']}>Estado del catálogo</p>
                    </div>
                    <div className={styles['chart-wrapper']}>
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={Object.entries(propsByStatus).map(([status, count]) => ({
                                        name: status
                                            .replace(/_/g, ' ')
                                            .replace(/\b\w/g, (c) => c.toUpperCase()),
                                        value: count,
                                        fill:
                                            STATUS_COLORS[status as keyof typeof STATUS_COLORS] ||
                                            '#888',
                                    }))}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ name, percent }: { name: string; percent: number }) =>
                                        `${name} ${(percent * 100).toFixed(0)}%`
                                    }
                                    labelLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bh-bg-card)',
                                        border: '1px solid var(--bh-border)',
                                        borderRadius: '8px',
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={styles['chart-card']}>
                    <div className={styles['chart-header']}>
                        <h3>Leads por Origen</h3>
                        <p className={styles['chart-subtitle']}>De dónde vienen los contactos</p>
                    </div>
                    <div className={styles['chart-wrapper']}>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart
                                data={Object.entries(leadsBySource).map(([source, count]) => ({
                                    source: source
                                        .replace(/_/g, ' ')
                                        .replace(/\b\w/g, (c) => c.toUpperCase()),
                                    count,
                                    fill:
                                        SOURCE_COLORS[source as keyof typeof SOURCE_COLORS] ||
                                        '#888',
                                }))}
                                layout="vertical"
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a2e35" />
                                <XAxis type="number" stroke="#6b7280" fontSize={12} />
                                <YAxis
                                    dataKey="source"
                                    type="category"
                                    stroke="#6b7280"
                                    fontSize={12}
                                    width={100}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bh-bg-card)',
                                        border: '1px solid var(--bh-border)',
                                        borderRadius: '8px',
                                    }}
                                />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={styles['chart-card']}>
                    <div className={styles['chart-header']}>
                        <h3>Leads por Mes</h3>
                        <p className={styles['chart-subtitle']}>
                            Evolución temporal (últimos 6 meses)
                        </p>
                    </div>
                    <div className={styles['chart-wrapper']}>
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={leadsByMonthSorted}>
                                <defs>
                                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1FC8C3" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#1FC8C3" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a2e35" />
                                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                                <YAxis stroke="#6b7280" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bh-bg-card)',
                                        border: '1px solid var(--bh-border)',
                                        borderRadius: '8px',
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#1FC8C3"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorLeads)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
