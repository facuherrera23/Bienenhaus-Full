/**
 * EmptyState stories — Storybook CSF3 format.
 *
 * Stories are authored with a lightweight local meta shape so the file
 * type-checks without `@storybook/preact` installed (mirrors the Metric
 * stories pattern). When Storybook is wired into the workspace, replace
 * `LocalMeta`/`LocalStory` with the canonical `Meta`/`StoryObj` from
 * `@storybook/preact` — the story bodies stay identical.
 */
import { EmptyState } from './EmptyState';
import type { EmptyStateProps, EmptyStateSize } from './EmptyState';
import { Button } from '../../atoms/Button/Button';

/* Inline icon helpers (no icon dependency — mirrors Metric approach). */
const InboxIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

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

interface LocalStoryArgs extends EmptyStateProps {
  /** Story-only flag to render a Button atom in the action slot. */
  actionLabel?: string;
}

interface LocalStory {
  args?: LocalStoryArgs;
  render?: (args: LocalStoryArgs) => preact.JSX.Element;
  decorators?: Array<(Story: () => preact.JSX.Element) => preact.JSX.Element>;
}

interface LocalMeta {
  title: string;
  component: typeof EmptyState;
  parameters?: Record<string, unknown>;
  tags?: string[];
  argTypes?: Record<
    string,
    { control?: string | false; description?: string; options?: string[] }
  >;
  args?: Record<string, unknown>;
}

const meta: LocalMeta = {
  title: 'Molecules/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Friendly empty-state block for lists/panels. Renders a title, ' +
          'optional description, an optional decorative icon in a muted circle ' +
          '(accent-tinted via color-mix), and an optional action slot (parent ' +
          'supplies the Button atom or whatever trigger it wants). The root ' +
          'carries `role="status"` so AT announces it when it appears. Sizes: ' +
          '`sm` (compact, inline table empties) and `md` (default).',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text', description: 'Primary heading (required)' },
    description: {
      control: 'text',
      description: 'Optional supporting copy (max ~320px, centered)',
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'Density / scale (default md)',
    },
    centered: {
      control: 'boolean',
      description: 'Center the block both axes (default true)',
    },
    icon: { control: false, description: 'Decorative icon node' },
    action: { control: false, description: 'Action slot (Button, link, …)' },
  },
  args: {
    title: 'No hay propiedades',
    description:
      'Aún no cargaste ninguna propiedad en el catálogo. Creá la primera para verla acá.',
    size: 'md',
    centered: true,
  },
  // Dark surface so the tokens render correctly.
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

/* ============================================================
   DEFAULT — title + description only
   ============================================================ */
export const Default: LocalStory = {
  render: (args) => <EmptyState {...args} />,
};

/* ============================================================
   WITH ICON — decorative icon in a muted circle
   ============================================================ */
export const WithIcon: LocalStory = {
  args: {
    title: 'Sin resultados',
    description: 'No encontramos propiedades que coincidan con tu búsqueda.',
    icon: <SearchIcon />,
  },
  render: (args) => (
    <EmptyState
      title={args.title}
      description={args.description}
      icon={args.icon}
    />
  ),
};

/* ============================================================
   WITH ACTION — parent supplies the Button atom
   ============================================================ */
export const WithAction: LocalStory = {
  args: {
    title: 'No hay propiedades',
    description: 'Aún no cargaste ninguna propiedad en el catálogo.',
    actionLabel: 'Crear propiedad',
  },
  render: (args) => (
    <EmptyState
      title={args.title}
      description={args.description}
      action={<Button variant="primary">{args.actionLabel}</Button>}
    />
  ),
};

/* ============================================================
   COMPACT — sm size, for inline table/panel empties
   ============================================================ */
export const Compact: LocalStory = {
  args: {
    title: 'Sin filas',
    description: 'No hay registros para mostrar en esta tabla.',
    size: 'sm',
    icon: <InboxIcon />,
  },
  render: (args) => (
    <EmptyState
      title={args.title}
      description={args.description}
      size={args.size}
      icon={args.icon}
    />
  ),
};

/* ============================================================
   FULL WIDTH — centered=false, left-aligned, fills its container
   ============================================================ */
export const FullWidth: LocalStory = {
  args: {
    title: 'Bienvenido a Bienenhaus',
    description:
      'Todavía no cargaste ninguna propiedad. Creá la primera publicación para empezar a gestionar tu catálogo.',
    centered: false,
    icon: <HomeIcon />,
    actionLabel: 'Cargar primera propiedad',
  },
  render: (args) => (
    <EmptyState
      title={args.title}
      description={args.description}
      centered={args.centered}
      icon={args.icon}
      action={<Button variant="primary">{args.actionLabel}</Button>}
    />
  ),
};

/* ============================================================
   ALL SIZES — sm vs md comparison
   ============================================================ */
export const AllSizes: LocalStory = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: 'var(--bh-space-4)',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      {(['sm', 'md'] as EmptyStateSize[]).map((s) => (
        <div
          key={s}
          style={{
            background: 'var(--bh-bg-card)',
            border: '1px solid var(--bh-border)',
            borderRadius: 'var(--bh-radius-lg)',
            padding: 'var(--bh-space-4)',
            flex: '1 1 280px',
            maxWidth: '360px',
          }}
        >
          <EmptyState
            title={`Size ${s}`}
            description={`EmptyState en tamaño ${s}.`}
            size={s}
            icon={<InboxIcon />}
          />
        </div>
      ))}
    </div>
  ),
};
