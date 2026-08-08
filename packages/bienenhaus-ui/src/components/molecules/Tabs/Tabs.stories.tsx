/**
 * Tabs stories — Storybook CSF3 format.
 *
 * Stories are authored with a lightweight local meta shape so the file
 * type-checks without `@storybook/preact` installed. When Storybook is wired
 * into the workspace, replace `LocalMeta`/`LocalStory` with the canonical
 * `Meta`/`StoryObj` from `@storybook/preact` — the story bodies stay identical.
 */
import { useState } from 'preact/hooks';
import { Tabs, type TabItem, type TabsVariant } from './Tabs';

interface LocalStoryArgs {
  variant?: TabsVariant;
  defaultActiveId?: string;
  activeId?: string;
  onChange?: (id: string) => void;
  className?: string;
}

interface LocalStory {
  args?: LocalStoryArgs;
  render?: (args: LocalStoryArgs) => preact.JSX.Element;
  decorators?: Array<(Story: () => preact.JSX.Element) => preact.JSX.Element>;
}

interface LocalMeta {
  title: string;
  component: typeof Tabs;
  parameters?: Record<string, unknown>;
  tags?: string[];
  argTypes?: Record<string, { control?: string; description?: string; options?: string[] }>;
}

const meta: LocalMeta = {
  title: 'Molecules/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Accessible tablist built following WAI-ARIA Authoring Practices. Supports controlled/uncontrolled usage, roving tabindex keyboard navigation, two visual variants (underline / pills), disabled tabs, and optional leading icons. Inactive panels stay mounted but hidden to preserve their internal state.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['underline', 'pills'],
      description: 'Visual style — `underline` (default) or `pills`',
    },
    defaultActiveId: {
      control: 'text',
      description: 'Initial active tab id for uncontrolled usage',
    },
    activeId: {
      control: 'text',
      description: 'Controlled active tab id',
    },
  },
};

export default meta;

const basicTabs: TabItem[] = [
  { id: 'overview', label: 'Overview', content: 'Overview panel — high-level summary of the property.' },
  { id: 'details', label: 'Details', content: 'Details panel — full specs, amenities, and floor plan.' },
  { id: 'reviews', label: 'Reviews', content: 'Reviews panel — agent and visitor feedback.' },
];

const Panel = ({ children }: { children: preact.ComponentChildren }) => (
  <div style={{ maxWidth: '480px', lineHeight: '1.6' }}>{children}</div>
);

export const Basic: LocalStory = {
  args: {},
  render: () => (
    <Tabs tabs={basicTabs} />
  ),
};

export const Controlled: LocalStory = {
  render: () => {
    const ControlledDemo = () => {
      const [active, setActive] = useState<string>('overview');
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Tabs tabs={basicTabs} activeId={active} onChange={setActive} />
          <p style={{ fontSize: '13px', color: '#8a949c' }}>
            External state: <code>{active}</code>
          </p>
        </div>
      );
    };
    return <ControlledDemo />;
  },
};

const IconHome = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconInfo = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);
const IconStar = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const WithIcons: LocalStory = {
  render: () => (
    <Tabs
      tabs={[
        { id: 'home', label: 'Home', icon: <IconHome />, content: <Panel>Home panel with a leading icon.</Panel> },
        { id: 'info', label: 'Info', icon: <IconInfo />, content: <Panel>Info panel with a leading icon.</Panel> },
        { id: 'ratings', label: 'Ratings', icon: <IconStar />, content: <Panel>Ratings panel with a leading icon.</Panel> },
      ]}
    />
  ),
};

export const DisabledTab: LocalStory = {
  render: () => (
    <Tabs
      tabs={[
        { id: 'active', label: 'Active', content: <Panel>This tab is active and clickable.</Panel> },
        { id: 'locked', label: 'Locked', disabled: true, content: <Panel>This panel is unreachable while the tab is disabled.</Panel> },
        { id: 'available', label: 'Available', content: <Panel>This tab is also clickable.</Panel> },
      ]}
    />
  ),
};

export const PillsVariant: LocalStory = {
  render: () => (
    <Tabs variant="pills" tabs={basicTabs} />
  ),
};

export const ScrollableManyTabs: LocalStory = {
  render: () => {
    const manyTabs: TabItem[] = Array.from({ length: 12 }, (_, i) => ({
      id: `tab-${i + 1}`,
      label: `Section ${i + 1}`,
      content: <Panel>Content for section {i + 1}. The tablist scrolls horizontally when it overflows.</Panel>,
    }));
    return (
      <div style={{ width: '420px', maxWidth: '100%' }}>
        <Tabs tabs={manyTabs} />
      </div>
    );
  },
};

export const AllVariants: LocalStory = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '520px', maxWidth: '100%' }}>
      <div>
        <h3 style={{ fontSize: '14px', marginBottom: '8px', color: '#bfc6cc' }}>Underline</h3>
        <Tabs variant="underline" tabs={basicTabs} />
      </div>
      <div>
        <h3 style={{ fontSize: '14px', marginBottom: '8px', color: '#bfc6cc' }}>Pills</h3>
        <Tabs variant="pills" tabs={basicTabs} />
      </div>
    </div>
  ),
};
