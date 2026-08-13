/**
 * FormField stories — Storybook CSF3 format.
 *
 * Stories are authored with a lightweight local meta shape so the file
 * type-checks without `@storybook/preact` installed. When Storybook is wired
 * into the workspace, replace `LocalMeta`/`LocalStory` with the canonical
 * `Meta`/`StoryObj` from `@storybook/preact` — the story bodies stay identical.
 */
import { FormField } from './FormField';

interface LocalStoryArgs {
    label?: string;
    htmlFor?: string;
    hint?: string;
    error?: string;
    required?: boolean;
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
    component: typeof FormField;
    parameters?: Record<string, unknown>;
    tags?: string[];
    argTypes?: Record<string, { control?: string; description?: string; options?: string[] }>;
}

const meta: LocalMeta = {
    title: 'Molecules/FormField',
    component: FormField,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component:
                    'Layout molecule that wraps any form control with a label, helper hint, and error message. Wires `htmlFor`, `aria-describedby`, `role="alert"`, and `aria-required` for screen-reader users. Error takes visual precedence over hint.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        label: {
            control: 'text',
            description: 'Visible label text rendered above the control',
        },
        htmlFor: {
            control: 'text',
            description: 'Explicit `for` attribute for the label',
        },
        hint: {
            control: 'text',
            description: 'Muted helper text under the control',
        },
        error: {
            control: 'text',
            description: 'Error text under the control (takes precedence over hint)',
        },
        required: {
            control: 'boolean',
            description: 'Renders `*` on the label and sets aria-required on the wrapper',
        },
    },
};

export default meta;

const inputStyle: preact.JSX.CSSProperties = {
    padding: '8px 12px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: '#12161b',
    color: '#f4f4f4',
    fontFamily: 'inherit',
    fontSize: '14px',
    width: '260px',
};

const Field = () => <input type="text" style={inputStyle} />;

export const Default: LocalStory = {
    args: {
        label: 'Full name',
        htmlFor: 'name',
    },
    render: (args) => (
        <FormField {...args}>
            <Field />
        </FormField>
    ),
};

export const WithHint: LocalStory = {
    args: {
        label: 'Email address',
        hint: 'We will never share your email with anyone.',
    },
    render: (args) => (
        <FormField {...args}>
            <Field />
        </FormField>
    ),
};

export const WithError: LocalStory = {
    args: {
        label: 'Email address',
        error: 'Please enter a valid email address.',
    },
    render: (args) => (
        <FormField {...args}>
            <Field />
        </FormField>
    ),
};

export const Required: LocalStory = {
    args: {
        label: 'Phone number',
        required: true,
        hint: 'Required so an agent can reach you.',
    },
    render: (args) => (
        <FormField {...args}>
            <Field />
        </FormField>
    ),
};

export const ComposedWithInput: LocalStory = {
    args: {
        label: 'Property title',
        htmlFor: 'title',
        hint: 'A short, catchy title for the listing.',
    },
    render: (args) => (
        <FormField {...args}>
            <input
                id="title"
                type="text"
                placeholder="Stunning apartment in Palermo"
                style={inputStyle}
            />
        </FormField>
    ),
};

export const ErrorOverridesHint: LocalStory = {
    args: {
        label: 'Username',
        hint: '3–20 characters, letters and numbers only.',
        error: 'That username is already taken.',
    },
    render: (args) => (
        <FormField {...args}>
            <Field />
        </FormField>
    ),
};

export const NoLabel: LocalStory = {
    args: {
        hint: 'Search by location, price, or property type.',
    },
    render: (args) => (
        <FormField {...args}>
            <Field />
        </FormField>
    ),
};

export const AllStates: LocalStory = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '300px' }}>
            <FormField label="Default" hint="Plain field">
                <Field />
            </FormField>
            <FormField label="Required" required hint="Must be filled">
                <Field />
            </FormField>
            <FormField label="With error" error="Something went wrong">
                <Field />
            </FormField>
            <FormField label="Error + hint" hint="Helper text" error="Error wins">
                <Field />
            </FormField>
            <FormField hint="No label, just hint">
                <Field />
            </FormField>
        </div>
    ),
};
