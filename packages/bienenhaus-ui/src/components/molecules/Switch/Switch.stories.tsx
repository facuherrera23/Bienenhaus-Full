/**
 * Switch stories — Storybook CSF3 format.
 *
 * Stories are authored with a lightweight local meta shape so the file
 * type-checks without `@storybook/preact` installed. When Storybook is wired
 * into the workspace, replace `LocalMeta`/`LocalStory` with the canonical
 * `Meta`/`StoryObj` from `@storybook/preact` — the story bodies stay identical.
 */
import { Switch } from './Switch';

interface LocalStoryArgs {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  label?: string;
  description?: string;
  size?: 'sm' | 'md';
  'aria-label'?: string;
}

interface LocalStory {
  args?: LocalStoryArgs;
  render?: (args: LocalStoryArgs) => preact.JSX.Element;
  decorators?: Array<(Story: () => preact.JSX.Element) => preact.JSX.Element>;
}

interface LocalMeta {
  title: string;
  component: typeof Switch;
  parameters?: Record<string, unknown>;
  tags?: string[];
  argTypes?: Record<string, { control?: string; description?: string; options?: string[] }>;
}

const meta: LocalMeta = {
  title: 'Molecules/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Accessible toggle switch built on a native checkbox (`role="switch"`). Supports controlled/uncontrolled usage, an optional clickable label, two sizes, and a disabled state.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'Switch size — `md` (default) or `sm`',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables interaction and dims the control',
    },
    checked: {
      control: 'boolean',
      description: 'Controlled checked state',
    },
    defaultChecked: {
      control: 'boolean',
      description: 'Initial checked state for uncontrolled usage',
    },
    label: {
      control: 'text',
      description: 'Optional visible label (clicking it toggles the switch)',
    },
    description: {
      control: 'text',
      description: 'Optional secondary text rendered under the label',
    },
  },
};

export default meta;

const Row = ({ children }: { children: preact.ComponentChildren }) => (
  <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>{children}</div>
);

export const Off: LocalStory = {
  args: {
    'aria-label': 'Toggle feature',
  },
  render: (args) => <Switch {...args} />,
};

export const On: LocalStory = {
  args: {
    'aria-label': 'Toggle feature',
    defaultChecked: true,
  },
  render: (args) => <Switch {...args} />,
};

export const WithLabel: LocalStory = {
  args: {
    label: 'Enable notifications',
    description: 'Receive email updates about new properties',
    defaultChecked: true,
  },
  render: (args) => <Switch {...args} />,
};

export const Disabled: LocalStory = {
  args: {
    'aria-label': 'Toggle feature',
    disabled: true,
  },
  render: (args) => (
    <Row>
      <Switch {...args} />
      <Switch {...args} defaultChecked />
    </Row>
  ),
};

export const Sizes: LocalStory = {
  render: () => (
    <Row>
      <Switch aria-label="small off" size="sm" />
      <Switch aria-label="small on" size="sm" defaultChecked />
      <Switch aria-label="medium off" size="md" />
      <Switch aria-label="medium on" size="md" defaultChecked />
    </Row>
  ),
};

export const WithLabelAndDescription: LocalStory = {
  args: {
    label: 'Auto-sync with Mercado Libre',
    description: 'Publishes and updates listings automatically every 5 minutes',
    defaultChecked: true,
  },
  render: (args) => <Switch {...args} />,
};

export const AllStates: LocalStory = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Row>
        <Switch aria-label="off" />
        <Switch aria-label="on" defaultChecked />
        <Switch aria-label="disabled off" disabled />
        <Switch aria-label="disabled on" disabled defaultChecked />
      </Row>
      <Row>
        <Switch aria-label="sm off" size="sm" />
        <Switch aria-label="sm on" size="sm" defaultChecked />
        <Switch aria-label="sm disabled" size="sm" disabled />
      </Row>
    </div>
  ),
};
