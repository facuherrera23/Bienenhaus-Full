/**
 * Dropdown stories — Storybook CSF3 format.
 *
 * Stories use a lightweight local meta shape so the file type-checks without
 * `@storybook/preact` installed. When Storybook is wired into the workspace,
 * replace `LocalMeta`/`LocalStory` with the canonical `Meta`/`StoryObj` from
 * `@storybook/preact` — the story bodies stay identical.
 */
import { Dropdown, type DropdownItem } from './Dropdown';

interface LocalStoryArgs {
  trigger?: preact.ComponentChild;
  items?: DropdownItem[];
  children?: preact.ComponentChild;
  align?: 'start' | 'end';
  label?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  id?: string;
}

interface LocalStory {
  args?: LocalStoryArgs;
  render?: (args: LocalStoryArgs) => preact.JSX.Element;
  decorators?: Array<(Story: () => preact.JSX.Element) => preact.JSX.Element>;
}

interface LocalMeta {
  title: string;
  component: typeof Dropdown;
  parameters?: Record<string, unknown>;
  tags?: string[];
  argTypes?: Record<string, { control?: string; description?: string; options?: string[] }>;
}

const meta: LocalMeta = {
  title: 'Molecules/Dropdown',
  component: Dropdown,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Accessible floating menu with a trigger button, keyboard navigation (Arrow/Enter/Escape/Tab/Home/End), click-outside-to-close, controlled/uncontrolled open state, and a render-prop-free trigger. Items support icons, danger tone, disabled state, and divider separators.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    align: {
      control: 'select',
      options: ['start', 'end'],
      description: 'Menu alignment relative to the trigger — `start` (default) or `end`',
    },
    open: {
      control: 'boolean',
      description: 'Controlled open state',
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Initial open state for uncontrolled usage',
    },
  },
};

export default meta;

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const basicItems: DropdownItem[] = [
  { id: 'edit', label: 'Edit', onSelect: () => {} },
  { id: 'duplicate', label: 'Duplicate', onSelect: () => {} },
  { id: 'share', label: 'Share', onSelect: () => {} },
  { id: 'delete', label: 'Delete', danger: true, onSelect: () => {} },
];

export const Basic: LocalStory = {
  args: {
    trigger: 'Actions',
    items: basicItems,
    label: 'Actions menu',
  },
  render: (args) => <Dropdown {...args} />,
};

export const WithIcons: LocalStory = {
  args: {
    trigger: 'Options',
    label: 'Options menu',
    items: [
      { id: 'edit', label: 'Edit', icon: <PencilIcon />, onSelect: () => {} },
      { id: 'duplicate', label: 'Duplicate', icon: <CopyIcon />, onSelect: () => {} },
      { id: 'share', label: 'Share', onSelect: () => {} },
      { id: 'delete', label: 'Delete', icon: <TrashIcon />, danger: true, onSelect: () => {} },
    ],
  },
  render: (args) => <Dropdown {...args} />,
};

export const WithDivider: LocalStory = {
  args: {
    trigger: 'Options',
    label: 'Options with divider',
    items: [
      { id: 'edit', label: 'Edit', icon: <PencilIcon />, onSelect: () => {} },
      { id: 'duplicate', label: 'Duplicate', icon: <CopyIcon />, onSelect: () => {} },
      { id: 'sep1', label: '', divider: true },
      { id: 'share', label: 'Share', onSelect: () => {} },
      { id: 'move', label: 'Move to…', onSelect: () => {} },
      { id: 'sep2', label: '', divider: true },
      { id: 'delete', label: 'Delete', icon: <TrashIcon />, danger: true, onSelect: () => {} },
    ],
  },
  render: (args) => <Dropdown {...args} />,
};

export const DangerItem: LocalStory = {
  args: {
    trigger: 'Destructive actions',
    label: 'Danger menu',
    items: [
      { id: 'edit', label: 'Edit', onSelect: () => {} },
      { id: 'duplicate', label: 'Duplicate', onSelect: () => {} },
      { id: 'sep1', label: '', divider: true },
      { id: 'delete', label: 'Delete account', danger: true, icon: <TrashIcon />, onSelect: () => {} },
      { id: 'purge', label: 'Purge all data', danger: true, onSelect: () => {} },
    ],
  },
  render: (args) => <Dropdown {...args} />,
};

export const AlignStart: LocalStory = {
  args: {
    trigger: 'Left-aligned',
    label: 'Start-aligned menu',
    align: 'start',
    items: basicItems,
  },
  render: (args) => (
    <div style={{ display: 'flex', justifyContent: 'flex-start', width: '320px' }}>
      <Dropdown {...args} />
    </div>
  ),
};

export const AlignEnd: LocalStory = {
  args: {
    trigger: 'Right-aligned',
    label: 'End-aligned menu',
    align: 'end',
    items: basicItems,
  },
  render: (args) => (
    <div style={{ display: 'flex', justifyContent: 'flex-end', width: '320px' }}>
      <Dropdown {...args} />
    </div>
  ),
};

export const DisabledItem: LocalStory = {
  args: {
    trigger: 'Actions',
    label: 'Actions with disabled item',
    items: [
      { id: 'edit', label: 'Edit', onSelect: () => {} },
      { id: 'duplicate', label: 'Duplicate', onSelect: () => {} },
      { id: 'archive', label: 'Archive (disabled)', disabled: true, onSelect: () => {} },
      { id: 'delete', label: 'Delete', danger: true, onSelect: () => {} },
    ],
  },
  render: (args) => <Dropdown {...args} />,
};

export const CustomTrigger: LocalStory = {
  args: {
    label: 'Custom trigger menu',
    items: basicItems,
  },
  render: () => (
    <Dropdown
      trigger={
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '999px',
            border: '1px solid var(--bh-accent)',
            fontWeight: 600,
            fontSize: '13px',
            color: 'var(--bh-text-primary)',
          }}
        >
          ⋯ More
        </span>
      }
      label="Custom trigger menu"
      items={basicItems}
    />
  ),
};

export const LongListScrollable: LocalStory = {
  args: {
    trigger: 'Pick a country',
    label: 'Country selector',
  },
  render: (args) => {
    const countries: DropdownItem[] = [
      'Argentina', 'Bolivia', 'Brazil', 'Canada', 'Chile', 'Colombia',
      'Costa Rica', 'Cuba', 'Dominican Republic', 'Ecuador', 'El Salvador',
      'Guatemala', 'Honduras', 'Mexico', 'Nicaragua', 'Panama', 'Paraguay',
      'Peru', 'Spain', 'United States', 'Uruguay', 'Venezuela',
    ].map((name) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      label: name,
      onSelect: () => {},
    }));
    return <Dropdown {...args} items={countries} />;
  },
};

export const AllStates: LocalStory = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <Dropdown trigger="Basic" items={basicItems} label="Basic" />
      <Dropdown
        trigger="With icons"
        label="With icons"
        items={[
          { id: 'edit', label: 'Edit', icon: <PencilIcon />, onSelect: () => {} },
          { id: 'delete', label: 'Delete', icon: <TrashIcon />, danger: true, onSelect: () => {} },
        ]}
      />
      <Dropdown
        trigger="Start-aligned"
        align="start"
        label="Start-aligned"
        items={basicItems}
      />
      <Dropdown
        trigger="Disabled item"
        label="Disabled item"
        items={[
          { id: 'edit', label: 'Edit', onSelect: () => {} },
          { id: 'archive', label: 'Archive', disabled: true, onSelect: () => {} },
        ]}
      />
    </div>
  ),
};
