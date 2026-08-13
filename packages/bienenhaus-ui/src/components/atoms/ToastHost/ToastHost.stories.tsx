import type { Meta, StoryObj } from '@storybook/preact';
import { pushToast, ToastHost, type ToastItem } from './ToastHost';

const meta: Meta<typeof ToastHost> = {
    title: 'Atoms/ToastHost',
    component: ToastHost,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'Fixed-position toast notification stack. Presentational atom — the parent owns the ' +
                    'toast array and dismissal lifecycle (timeouts, removal). Use `pushToast` to generate ' +
                    'unique ids. Four variants: success, error, info, warning. Icons are inline SVGs (20×20, ' +
                    'stroke=currentColor). Positioned bottom-right at 320px width with a semantic left border.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        toasts: {
            control: false,
            description: 'Array of ToastItem to render. Parent owns the array + dismissal.',
        },
        onDismiss: {
            control: false,
            description: 'Called with the toast id when a toast is clicked.',
        },
    },
};

export default meta;
type Story = StoryObj<typeof ToastHost>;

/* ============================================================
   BASIC — single success toast
   ============================================================ */
export const Basic: Story = {
    args: {
        toasts: [{ id: 1, type: 'success', title: 'Propiedad guardada' }],
    },
};

/* ============================================================
   ALL TYPES — one of each variant
   ============================================================ */
export const AllTypes: Story = {
    render: () => {
        const toasts: ToastItem[] = [
            { id: 1, type: 'success', title: 'Operación exitosa' },
            { id: 2, type: 'error', title: 'Error al guardar' },
            { id: 3, type: 'info', title: 'Nueva notificación' },
            { id: 4, type: 'warning', title: 'Conexión inestable' },
        ];
        return <ToastHost toasts={toasts} />;
    },
};

/* ============================================================
   WITH DESCRIPTION — toast including a description line
   ============================================================ */
export const WithDescription: Story = {
    args: {
        toasts: [
            {
                id: 1,
                type: 'info',
                title: 'Lead asignado',
                description: 'Juan Pérez fue asignado a tu agenda.',
            },
        ],
    },
};

/* ============================================================
   AUTO-DISMISS — demonstrates parent-managed dismissal via pushToast
   ============================================================
   The component itself never sets a timeout. The parent schedules
   removal. This story shows the pattern: build with pushToast, then
   the parent removes after a delay.
   ============================================================ */
export const AutoDismiss: Story = {
    render: () => {
        const toasts: ToastItem[] = [
            pushToast({ type: 'success', title: 'Guardado automáticamente' }),
        ];
        return <ToastHost toasts={toasts} />;
    },
    parameters: {
        docs: {
            description: {
                story:
                    'The parent builds the toast with `pushToast` (which generates the id) and is ' +
                    'responsible for scheduling removal via `setTimeout`. ToastHost renders only what ' +
                    'it is given — it never auto-dismisses.',
            },
        },
    },
};

/* ============================================================
   STACKED — multiple toasts with descriptions
   ============================================================ */
export const Stacked: Story = {
    render: () => {
        const toasts: ToastItem[] = [
            {
                id: 1,
                type: 'success',
                title: 'Publicado en ML',
                description: 'La propiedad ya está visible.',
            },
            {
                id: 2,
                type: 'warning',
                title: 'Sincronización pendiente',
                description: '3 propiedades en cola.',
            },
            {
                id: 3,
                type: 'error',
                title: 'Fallo de conexión',
                description: 'Reintentando en 5s.',
            },
        ];
        return <ToastHost toasts={toasts} />;
    },
};
