/**
 * RadioGroup stories — Storybook CSF3 format.
 *
 * Stories are authored with a lightweight local meta shape so the file
 * type-checks without `@storybook/preact` installed. When Storybook is wired
 * into the workspace, replace `LocalMeta`/`LocalStory` with the canonical
 * `Meta`/`StoryObj` from `@storybook/preact` — the story bodies stay identical.
 */
import { RadioGroup, type RadioOption } from './RadioGroup';

interface LocalStoryArgs {
    options: RadioOption[];
    value?: string;
    defaultValue?: string;
    disabled?: boolean;
    legend?: string;
    layout?: 'stacked' | 'inline';
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
    component: typeof RadioGroup;
    parameters?: Record<string, unknown>;
    tags?: string[];
    argTypes?: Record<string, { control?: string; description?: string; options?: string[] }>;
}

const meta: LocalMeta = {
    title: 'Molecules/RadioGroup',
    component: RadioGroup,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component:
                    'Accessible single-choice list built on native `<input type="radio">` inside a `<fieldset role="radiogroup">`. Supports controlled/uncontrolled usage, an optional legend, stacked/inline layouts, two sizes, per-option hints, and disabled states (per-option or whole group).',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        layout: {
            control: 'select',
            options: ['stacked', 'inline'],
            description: 'Layout direction — `stacked` (default) or `inline`',
        },
        size: {
            control: 'select',
            options: ['sm', 'md'],
            description: 'Radio circle + label size — `md` (default) or `sm`',
        },
        disabled: {
            control: 'boolean',
            description: 'Disables the entire group',
        },
        legend: {
            control: 'text',
            description: 'Visible legend rendered inside the `<fieldset>`',
        },
    },
};

export default meta;

const fruitOptions: RadioOption[] = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
];

export const Default: LocalStory = {
    args: {
        'aria-label': 'Favorite fruit',
        options: fruitOptions,
    },
    render: (args) => <RadioGroup {...args} />,
};

export const WithLegend: LocalStory = {
    args: {
        legend: 'Pick your favorite fruit',
        options: fruitOptions,
        defaultValue: 'banana',
    },
    render: (args) => <RadioGroup {...args} />,
};

export const InlineLayout: LocalStory = {
    args: {
        legend: 'Contact preference',
        options: [
            { value: 'email', label: 'Email' },
            { value: 'phone', label: 'Phone' },
            { value: 'whatsapp', label: 'WhatsApp' },
        ],
        layout: 'inline',
        defaultValue: 'email',
    },
    render: (args) => <RadioGroup {...args} />,
};

export const DisabledOption: LocalStory = {
    args: {
        legend: 'Delivery method',
        options: [
            { value: 'pickup', label: 'Pickup', hint: 'Collect at our office' },
            { value: 'courier', label: 'Courier', disabled: true, hint: 'Currently unavailable' },
            { value: 'mail', label: 'Mail', hint: '3-5 business days' },
        ],
        defaultValue: 'pickup',
    },
    render: (args) => <RadioGroup {...args} />,
};

export const DisabledGroup: LocalStory = {
    args: {
        legend: 'Locked preference',
        options: fruitOptions,
        disabled: true,
        defaultValue: 'apple',
    },
    render: (args) => <RadioGroup {...args} />,
};

export const WithHints: LocalStory = {
    args: {
        legend: 'Property type',
        options: [
            { value: 'house', label: 'House', hint: 'Standalone property with land' },
            { value: 'apartment', label: 'Apartment', hint: 'Unit inside a building' },
            { value: 'land', label: 'Land', hint: 'Empty plot for development' },
        ],
        defaultValue: 'house',
    },
    render: (args) => <RadioGroup {...args} />,
};

export const Sizes: LocalStory = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <RadioGroup legend="Small" options={fruitOptions} size="sm" defaultValue="apple" />
            <RadioGroup legend="Medium" options={fruitOptions} size="md" defaultValue="banana" />
        </div>
    ),
};

export const AllStates: LocalStory = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <RadioGroup
                legend="Stacked + hints + disabled option"
                options={[
                    { value: 'apple', label: 'Apple', hint: 'Keeps the doctor away' },
                    { value: 'banana', label: 'Banana', disabled: true, hint: 'Out of stock' },
                    { value: 'cherry', label: 'Cherry', hint: 'Seasonal' },
                ]}
                defaultValue="apple"
            />
            <RadioGroup
                legend="Inline + disabled group"
                options={fruitOptions}
                layout="inline"
                disabled
                defaultValue="cherry"
            />
        </div>
    ),
};
