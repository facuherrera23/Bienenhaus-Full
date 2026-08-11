import type { Meta, StoryObj } from '@storybook/preact';
import { StatCard, type StatCardSize } from './StatCard';

/* Inline icon helpers (no icon dependency — mirrors IconButton approach). */
const HomeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M3 9.5L12 3l9 6.5" />
    <path d="M5 10v10h14V10" />
    <path d="M9 20v-6h6v6" />
  </svg>
);

const UsersIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const DollarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const meta: Meta<typeof StatCard> = {
  title: 'Molecules/StatCard',
  component: StatCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'KPI card molecule. Surfaces a single metric with an optional ' +
          'leading icon, trend delta (semantic green/red + arrow), inline ' +
          'SVG sparkline, and a trailing quick-action icon-button. When ' +
          '`loading` is true the value is replaced by the Spinner atom.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text', description: 'KPI label' },
    value: { control: 'text', description: 'Prominent metric value' },
    loading: {
      control: 'boolean',
      description: 'Replaces value with a Spinner atom',
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'Card density',
    },
    icon: { control: false, description: 'Leading icon node' },
    trend: { control: false, description: 'Delta vs previous period' },
    sparkline: { control: false, description: 'Sparkline data points' },
    action: { control: false, description: 'Trailing quick-action' },
  },
  args: {
    label: 'Propiedades publicadas',
    value: 128,
    size: 'md',
    loading: false,
  },
  // Dark surface so the card + tokens render correctly.
  decorators: [
    (Story) => (
      <div
        style={{
          background: 'var(--bh-bg-primary)',
          padding: 'var(--bh-space-6)',
          borderRadius: 'var(--bh-radius-lg)',
          minHeight: '160px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StatCard>;

/* ============================================================
   DEFAULT — label + value only
   ============================================================ */
export const Default: Story = {};

/* ============================================================
   WITH ICON — leading icon in a tinted rounded square
   ============================================================ */
export const WithIcon: Story = {
  args: {
    label: 'Propiedades publicadas',
    value: 128,
    icon: <HomeIcon />,
  },
};

/* ============================================================
   POSITIVE TREND — green delta + up arrow
   ============================================================ */
export const PositiveTrend: Story = {
  args: {
    label: 'Leads este mes',
    value: 342,
    icon: <UsersIcon />,
    trend: { value: '+12%', direction: 'up', positive: true },
  },
};

/* ============================================================
   NEGATIVE TREND — red delta + down arrow
   ============================================================ */
export const NegativeTrend: Story = {
  args: {
    label: 'Tasa de conversión',
    value: '3.2%',
    icon: <TrendingUpIcon />,
    trend: { value: '-3%', direction: 'down', positive: false },
  },
};

/* ============================================================
   COST UP IS BAD — direction=up but positive=false (danger color)
   ============================================================ */
export const CostUpIsBad: Story = {
  args: {
    label: 'Costo por lead',
    value: '$1.450',
    icon: <DollarIcon />,
    trend: { value: '+15%', direction: 'up', positive: false },
  },
};

/* ============================================================
   WITH SPARKLINE — inline SVG polyline
   ============================================================ */
export const WithSparkline: Story = {
  args: {
    label: 'Visitas agendadas',
    value: 87,
    icon: <TrendingUpIcon />,
    trend: { value: '+8%', direction: 'up' },
    sparkline: [12, 18, 14, 22, 19, 28, 24, 34, 30, 42, 38, 52],
  },
};

/* ============================================================
   WITH ACTION — trailing icon-button
   ============================================================ */
export const WithAction: Story = {
  args: {
    label: 'Propiedades publicadas',
    value: 128,
    icon: <HomeIcon />,
    trend: { value: '+12%', direction: 'up' },
    action: {
      label: 'Ver detalle de propiedades',
      onClick: () => console.warn('Navegar al listado'),
    },
  },
};

/* ============================================================
   LOADING — value replaced by Spinner atom
   ============================================================ */
export const Loading: Story = {
  args: {
    label: 'Propiedades publicadas',
    value: 128,
    icon: <HomeIcon />,
    loading: true,
  },
};

/* ============================================================
   ACTION + LOADING — action stays, value is a spinner
   ============================================================ */
export const ActionAndLoading: Story = {
  args: {
    label: 'Leads este mes',
    value: 342,
    icon: <UsersIcon />,
    action: {
      label: 'Configurar',
      onClick: () => console.warn('Abrir configuración'),
    },
    loading: true,
  },
};

/* ============================================================
   SMALL SIZE — denser card
   ============================================================ */
export const Small: Story = {
  args: {
    label: 'Leads',
    value: 42,
    icon: <UsersIcon />,
    trend: { value: '+5%', direction: 'up' },
    size: 'sm',
  },
};

/* ============================================================
   FULL FEATURED — icon + trend + sparkline + action
   ============================================================ */
export const FullFeatured: Story = {
  args: {
    label: 'Ingresos del mes',
    value: '$4.820.000',
    icon: <DollarIcon />,
    trend: { value: '+18%', direction: 'up', positive: true },
    sparkline: [20, 24, 22, 30, 28, 36, 34, 44, 42, 56, 60, 72],
    action: {
      label: 'Ver reporte completo',
      onClick: () => console.warn('Abrir reporte'),
    },
  },
};

/* ============================================================
   GRID — multiple cards side by side
   ============================================================ */
export const Grid: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 220px)',
        gap: 'var(--bh-space-4)',
      }}
    >
      <StatCard
        label="Propiedades"
        value={128}
        icon={<HomeIcon />}
        trend={{ value: '+12%', direction: 'up' }}
      />
      <StatCard
        label="Leads"
        value={342}
        icon={<UsersIcon />}
        trend={{ value: '-3%', direction: 'down' }}
      />
      <StatCard
        label="Conversión"
        value="3.2%"
        icon={<TrendingUpIcon />}
        trend={{ value: '+0.4%', direction: 'up' }}
        sparkline={[10, 14, 12, 18, 16, 22, 20, 28]}
      />
    </div>
  ),
};

/* ============================================================
   ALL SIZES — sm vs md comparison
   ============================================================ */
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--bh-space-4)', alignItems: 'center' }}>
      {(['sm', 'md'] as StatCardSize[]).map((s) => (
        <StatCard
          key={s}
          label={`Size ${s}`}
          value={s === 'sm' ? 42 : 128}
          icon={<HomeIcon />}
          trend={{ value: '+5%', direction: 'up' }}
          size={s}
        />
      ))}
    </div>
  ),
};
