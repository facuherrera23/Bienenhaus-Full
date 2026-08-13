import type { Meta, StoryObj } from '@storybook/preact';
import { Breadcrumb } from './Breadcrumb';

const meta: Meta<typeof Breadcrumb> = {
    title: 'Molecules/Breadcrumb',
    component: Breadcrumb,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component:
                    'Hierarchical navigation trail. Renders a `<nav aria-label="breadcrumb">` with `<ol>`/`<li>` semantics. The last item is the current page (non-link, `aria-current="page"`). Never shows more than `maxItems` (default 4) levels; the middle collapses into a clickable ellipsis button.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        items: {
            control: false,
            description: 'Ordered list of breadcrumb items (root → current page).',
        },
        maxItems: {
            control: { type: 'number', min: 2, max: 12, step: 1 },
            description: 'Max visible levels before collapsing the middle. Default: 4.',
        },
        onExpand: {
            control: false,
            description: 'Click handler for the collapsed-middle ellipsis button.',
        },
    },
};

export default meta;
type Story = StoryObj<typeof Breadcrumb>;

/* ============================================================
   STORIES
   ============================================================ */

export const TwoLevels: Story = {
    args: {
        items: [{ label: 'Dashboard', href: '/admin' }, { label: 'Propiedades' }],
    },
};

export const FourLevels: Story = {
    args: {
        items: [
            { label: 'Dashboard', href: '/admin' },
            { label: 'Propiedades', href: '/admin/propiedades' },
            { label: 'Editar', href: '/admin/propiedades/123' },
            { label: 'Galería' },
        ],
    },
};

export const CollapsedMoreThanFour: Story = {
    args: {
        items: [
            { label: 'Dashboard', href: '/admin' },
            { label: 'Propiedades', href: '/admin/propiedades' },
            { label: 'Detalle', href: '/admin/propiedades/123' },
            { label: 'Editar', href: '/admin/propiedades/123/editar' },
            { label: 'Galería' },
        ],
        maxItems: 4,
        onExpand: () => {
            // Storybook action: wire to a real handler in the consumer.
        },
    },
};

export const SingleItem: Story = {
    args: {
        items: [{ label: 'Dashboard' }],
    },
};

export const WithLongLabels: Story = {
    args: {
        items: [
            { label: 'Dashboard', href: '/admin' },
            {
                label: 'Propiedad con un título extremadamente largo que se truncará',
                href: '/admin/propiedades/123',
            },
            { label: 'Editar' },
        ],
    },
};

export const WithTextOnlyMiddle: Story = {
    args: {
        items: [
            { label: 'Dashboard', href: '/admin' },
            { label: 'Sección sin enlace' },
            { label: 'Actual' },
        ],
    },
};
