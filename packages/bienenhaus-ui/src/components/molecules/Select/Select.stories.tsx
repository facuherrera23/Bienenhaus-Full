/**
 * Select stories — Storybook CSF3 format.
 *
 * Stories are authored with a lightweight local meta shape so the file
 * type-checks without `@storybook/preact` installed. When Storybook is wired
 * into the workspace, replace `LocalMeta`/`LocalStory` with the canonical
 * `Meta`/`StoryObj` from `@storybook/preact` — the story bodies stay identical.
 */
import { Select, type SelectOption } from './Select';

const FRUITS: SelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date', disabled: true },
  { value: 'elderberry', label: 'Elderberry' },
];

const PROPERTIES: SelectOption[] = [
  { value: 'apartment', label: 'Departamento' },
  { value: 'house', label: 'Casa' },
  { value: 'land', label: 'Terreno' },
  { value: 'office', label: 'Oficina' },
  { value: 'warehouse', label: 'Galpón' },
];

const ICON_OPTIONS: SelectOption[] = [
  {
    value: 'home',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    value: 'user',
    label: 'User',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    value: 'settings',
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

interface LocalStoryArgs {
  options?: SelectOption[];
  value?: string | string[];
  defaultValue?: string | string[];
  multiple?: boolean;
  searchable?: boolean;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  size?: 'sm' | 'md' | 'lg';
  'aria-label'?: string;
}

interface LocalStory {
  args?: LocalStoryArgs;
  render?: (args: LocalStoryArgs) => preact.JSX.Element;
  decorators?: Array<(Story: () => preact.JSX.Element) => preact.JSX.Element>;
}

interface LocalMeta {
  title: string;
  component: typeof Select;
  parameters?: Record<string, unknown>;
  tags?: string[];
  argTypes?: Record<string, { control?: string; description?: string; options?: string[] }>;
}

const meta: LocalMeta = {
  title: 'Molecules/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Searchable + multi-select dropdown molecule. Custom dropdown (not native `<select>`) styled like the Input molecule, with full keyboard navigation, live search filtering, and removable chips for multi-select. Uses only --bh-* design tokens.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant — sm | md (default) | lg',
    },
    multiple: {
      control: 'boolean',
      description: 'Enables multiple selection (emits string[])',
    },
    searchable: {
      control: 'boolean',
      description: 'Shows a live search input inside the dropdown panel',
    },
    error: {
      control: 'text',
      description: 'Error message — adds aria-invalid + danger border + role=alert',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the whole control',
    },
    required: {
      control: 'boolean',
      description: 'Marks the field as required (aria-required on trigger)',
    },
  },
};

export default meta;

const Wrapper = ({ children }: { children: preact.ComponentChildren }) => (
  <div style={{ width: '320px' }}>{children}</div>
);

export const Basic: LocalStory = {
  args: {
    options: PROPERTIES,
    label: 'Tipo de propiedad',
  },
  render: (args) => <Select {...args} />,
  decorators: [(Story) => <Wrapper>{Story()}</Wrapper>],
};

export const WithPlaceholder: LocalStory = {
  args: {
    options: PROPERTIES,
    placeholder: 'Seleccionar tipo...',
    label: 'Tipo de propiedad',
  },
  render: (args) => <Select {...args} />,
  decorators: [(Story) => <Wrapper>{Story()}</Wrapper>],
};

export const Searchable: LocalStory = {
  args: {
    options: PROPERTIES,
    searchable: true,
    placeholder: 'Buscar tipo...',
    label: 'Buscar propiedad',
  },
  render: (args) => <Select {...args} />,
  decorators: [(Story) => <Wrapper>{Story()}</Wrapper>],
};

export const MultiSelect: LocalStory = {
  args: {
    options: FRUITS,
    multiple: true,
    placeholder: 'Seleccionar frutas...',
    label: 'Frutas',
    defaultValue: ['apple', 'cherry'],
  },
  render: (args) => <Select {...args} />,
  decorators: [(Story) => <Wrapper>{Story()}</Wrapper>],
};

export const WithIcons: LocalStory = {
  args: {
    options: ICON_OPTIONS,
    placeholder: 'Seleccionar...',
    label: 'Navegación',
  },
  render: (args) => <Select {...args} />,
  decorators: [(Story) => <Wrapper>{Story()}</Wrapper>],
};

export const Disabled: LocalStory = {
  args: {
    options: PROPERTIES,
    placeholder: 'Deshabilitado',
    label: 'No editable',
    disabled: true,
  },
  render: (args) => <Select {...args} />,
  decorators: [(Story) => <Wrapper>{Story()}</Wrapper>],
};

export const WithError: LocalStory = {
  args: {
    options: PROPERTIES,
    placeholder: 'Seleccionar...',
    label: 'Campo requerido',
    error: 'Debes seleccionar una opción',
    required: true,
  },
  render: (args) => <Select {...args} />,
  decorators: [(Story) => <Wrapper>{Story()}</Wrapper>],
};

export const Sizes: LocalStory = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '320px' }}>
      <Select options={PROPERTIES} size="sm" placeholder="Small" aria-label="sm" />
      <Select options={PROPERTIES} size="md" placeholder="Medium" aria-label="md" />
      <Select options={PROPERTIES} size="lg" placeholder="Large" aria-label="lg" />
    </div>
  ),
};

export const MultiSearchable: LocalStory = {
  args: {
    options: PROPERTIES,
    multiple: true,
    searchable: true,
    placeholder: 'Buscar y seleccionar...',
    label: 'Tipos (multi + búsqueda)',
  },
  render: (args) => <Select {...args} />,
  decorators: [(Story) => <Wrapper>{Story()}</Wrapper>],
};

export const AllStates: LocalStory = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '320px' }}>
      <Select options={PROPERTIES} placeholder="Single" aria-label="single" />
      <Select options={PROPERTIES} multiple placeholder="Multi" aria-label="multi" />
      <Select options={PROPERTIES} searchable placeholder="Searchable" aria-label="search" />
      <Select options={PROPERTIES} error="Error message" placeholder="Error" aria-label="error" />
      <Select options={PROPERTIES} disabled placeholder="Disabled" aria-label="disabled" />
    </div>
  ),
};
