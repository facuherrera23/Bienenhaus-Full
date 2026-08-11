/**
 * Checkbox stories — Storybook CSF3 format.
 *
 * Stories are authored with a lightweight local meta shape so the file
 * type-checks without `@storybook/preact` installed. When Storybook is wired
 * into the workspace, replace `LocalMeta`/`LocalStory` with the canonical
 * `Meta`/`StoryObj` from `@storybook/preact` — the story bodies stay identical.
 */
import { Checkbox } from './Checkbox';

interface LocalStoryArgs {
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md';
  name?: string;
  value?: string;
  'aria-label'?: string;
}

interface LocalStory {
  args?: LocalStoryArgs;
  render?: (args: LocalStoryArgs) => preact.JSX.Element;
  decorators?: Array<(Story: () => preact.JSX.Element) => preact.JSX.Element>;
}

interface LocalMeta {
  title: string;
  component: typeof Checkbox;
  parameters?: Record<string, unknown>;
  tags?: string[];
  argTypes?: Record<string, { control?: string; description?: string; options?: string[] }>;
}

const meta: LocalMeta = {
  title: 'Molecules/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Accessible checkbox built on a native `<input type="checkbox">`. Supports controlled/uncontrolled usage, an indeterminate (dash) state, an optional clickable label, two sizes, and a disabled state.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'Checkbox size — `md` (default) or `sm`',
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
    indeterminate: {
      control: 'boolean',
      description: 'Visual indeterminate state — renders a dash',
    },
    label: {
      control: 'text',
      description: 'Optional visible label (clicking it toggles the checkbox)',
    },
  },
};

export default meta;

const Row = ({ children }: { children: preact.ComponentChild }) => (
  <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>{children}</div>
);

const Stack = ({ children }: { children: preact.ComponentChild }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>{children}</div>
);

export const Unchecked: LocalStory = {
  args: {
    'aria-label': 'Accept terms',
  },
  render: (args) => <Checkbox {...args} />,
};

export const Checked: LocalStory = {
  args: {
    'aria-label': 'Accept terms',
    defaultChecked: true,
  },
  render: (args) => <Checkbox {...args} />,
};

export const Indeterminate: LocalStory = {
  args: {
    'aria-label': 'Select all',
    indeterminate: true,
  },
  render: (args) => <Checkbox {...args} />,
};

export const WithLabel: LocalStory = {
  args: {
    label: 'I agree to the terms and conditions',
    defaultChecked: true,
  },
  render: (args) => <Checkbox {...args} />,
};

export const Disabled: LocalStory = {
  args: {
    'aria-label': 'Accept terms',
    disabled: true,
  },
  render: (args) => (
    <Row>
      <Checkbox {...args} />
      <Checkbox {...args} defaultChecked />
      <Checkbox {...args} indeterminate />
    </Row>
  ),
};

export const Sizes: LocalStory = {
  render: () => (
    <Row>
      <Checkbox aria-label="sm off" size="sm" />
      <Checkbox aria-label="sm on" size="sm" defaultChecked />
      <Checkbox aria-label="sm indeterminate" size="sm" indeterminate />
      <Checkbox aria-label="md off" size="md" />
      <Checkbox aria-label="md on" size="md" defaultChecked />
      <Checkbox aria-label="md indeterminate" size="md" indeterminate />
    </Row>
  ),
};

export const GroupExample: LocalStory = {
  render: () => (
    <Stack>
      <Checkbox label="Select all" indeterminate name="group" value="all" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '32px' }}>
        <Checkbox label="Option A" defaultChecked name="group" value="a" />
        <Checkbox label="Option B" name="group" value="b" />
        <Checkbox label="Option C" defaultChecked name="group" value="c" />
      </div>
    </Stack>
  ),
};

export const AllStates: LocalStory = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Row>
        <Checkbox aria-label="off" />
        <Checkbox aria-label="on" defaultChecked />
        <Checkbox aria-label="indeterminate" indeterminate />
        <Checkbox aria-label="disabled off" disabled />
        <Checkbox aria-label="disabled on" disabled defaultChecked />
        <Checkbox aria-label="disabled indeterminate" disabled indeterminate />
      </Row>
      <Row>
        <Checkbox aria-label="sm off" size="sm" />
        <Checkbox aria-label="sm on" size="sm" defaultChecked />
        <Checkbox aria-label="sm indeterminate" size="sm" indeterminate />
        <Checkbox aria-label="sm disabled" size="sm" disabled />
      </Row>
    </div>
  ),
};
