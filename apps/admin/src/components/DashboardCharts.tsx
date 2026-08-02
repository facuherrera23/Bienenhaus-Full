import { useQuery } from '../lib/query/hooks';
import { fetchLeads } from '../lib/leads';
import { fetchProperties } from '../lib/properties';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { Building2, Users, TrendingUp, DollarSign } from 'lucide-preact';

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
  const { data: leads, isPending: leadsPending } = useQuery({
    queryKey: ['leads'],
    queryFn: fetchLeads,
  });

  const { data: properties, isPending: propsPending } = useQuery({
    queryKey: ['properties'],
    queryFn: fetchProperties,
  });

  // Leads by status
  const leadsByStatus = leads?.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) ?? {};

  // Properties by status
  const propsByStatus = properties?.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) ?? {};

  // Leads by source
  const leadsBySource = leads?.reduce((acc, l) => {
    acc[l.source] = (acc[l.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) ?? {};

  // Leads by month (last 6 months)
  const leadsByMonth = leads?.reduce((acc, l) => {
    const month = formatMonth(l.created_at);
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) ?? {};

  const monthOrder = Object.keys(leadsByMonth).sort((a, b) => {
    const [ma, ya] = a.split(' ');
    const [mb, yb] = b.split(' ');
    const monthNum = (m: string) => ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'].indexOf(m.toLowerCase());
    return monthNum(ma) - monthNum(mb) || parseInt(ya) - parseInt(yb);
  });
  const leadsByMonthSorted = monthOrder.map(m => ({ month: m, count: leadsByMonth[m] }));

  if (leadsPending || propsPending) {
    return (
      <div className="charts-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="chart-card placeholder-card">Cargando gráficos…</div>
        ))}
      </div>
    );
  }

  const totalLeads = leads?.length ?? 0;
  const totalProps = properties?.length ?? 0;
  const publishedProps = propsByStatus.publicada ?? 0;
  const wonLeads = leadsByStatus.cerrado_ganado ?? 0;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0';

  return (
    <div className="charts-section">
      <div className="kpi-grid charts-kpi">
        <div className="kpi-card">
          <span className="kpi-icon"><Users size={20} strokeWidth={1.8} /></span>
          <div>
            <p className="kpi-label">Total Leads</p>
            <p className="kpi-value">{totalLeads}</p>
            <p className="kpi-delta">En el sistema</p>
          </div>
        </div>
        <div className="kpi-card">
          <span className="kpi-icon"><Building2 size={20} strokeWidth={1.8} /></span>
          <div>
            <p className="kpi-label">Propiedades Publicadas</p>
            <p className="kpi-value">{publishedProps}</p>
            <p className="kpi-delta">De {totalProps} totales</p>
          </div>
        </div>
        <div className="kpi-card">
          <span className="kpi-icon"><TrendingUp size={20} strokeWidth={1.8} /></span>
          <div>
            <p className="kpi-label">Conversión (Ganados)</p>
            <p className="kpi-value">{conversionRate}%</p>
            <p className="kpi-delta">{wonLeads} cerrados ganados</p>
          </div>
        </div>
        <div className="kpi-card">
          <span className="kpi-icon"><DollarSign size={20} strokeWidth={1.8} /></span>
          <div>
            <p className="kpi-label">Valor Pipeline</p>
            <p className="kpi-value">{properties?.reduce((sum, p) => sum + (p.price ?? 0), 0).toLocaleString('es-AR')}</p>
            <p className="kpi-delta">USD estimado</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Leads por Estado</h3>
            <p className="chart-subtitle">Distribución actual del pipeline</p>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={Object.entries(leadsByStatus).map(([status, count]) => ({
                status: status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                count,
                color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#888',
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2e35" />
                <XAxis dataKey="status" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: '#1a1e23',
                    border: '1px solid #2a2e35',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#f4f4f4' }}
                />
                <Legend />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {Object.entries(leadsByStatus).map(([status]) => (
                    <Cell key={status} fill={STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#888'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Propiedades por Estado</h3>
            <p className="chart-subtitle">Estado del catálogo</p>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={Object.entries(propsByStatus).map(([status, count]) => ({
                    name: status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                    value: count,
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {Object.entries(propsByStatus).map(([status]) => (
                    <Cell key={status} fill={STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#888'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1a1e23',
                    border: '1px solid #2a2e35',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Leads por Origen</h3>
            <p className="chart-subtitle">De dónde vienen los contactos</p>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={Object.entries(leadsBySource).map(([source, count]) => ({
                  source: source.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                  count,
                  color: SOURCE_COLORS[source as keyof typeof SOURCE_COLORS] || '#888',
                }))}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2e35" />
                <XAxis type="number" stroke="#6b7280" fontSize={12} />
                <YAxis dataKey="source" type="category" stroke="#6b7280" fontSize={12} width={100} />
                <Tooltip
                  contentStyle={{
                    background: '#1a1e23',
                    border: '1px solid #2a2e35',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {Object.entries(leadsBySource).map(([source]) => (
                    <Cell key={source} fill={SOURCE_COLORS[source as keyof typeof SOURCE_COLORS] || '#888'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Leads por Mes</h3>
            <p className="chart-subtitle">Evolución temporal (últimos 6 meses)</p>
          </div>
          <div className="chart-wrapper">
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
                    background: '#1a1e23',
                    border: '1px solid #2a2e35',
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