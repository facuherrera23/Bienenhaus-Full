import type { Meta, StoryObj } from '@storybook/preact';
import { Pagination } from './Pagination';

const meta: Meta<typeof Pagination> = {
    title: 'Molecules/Pagination',
    component: Pagination,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component:
                    'Page navigation molecule with windowed page numbers (max 7 slots, single ellipsis per side), prev/next IconButton atoms, optional page-size selector, and optional total-items count text.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        page: {
            control: 'number',
            description: 'Current page number (1-based).',
        },
        totalPages: {
            control: 'number',
            description: 'Total number of pages.',
        },
        onPageChange: {
            action: 'pageChange',
            description:
                'Called with the new page number when a page button or prev/next is clicked.',
        },
        pageSizeOptions: {
            control: 'object',
            description:
                'Available page-size options. Renders the <select> only when pageSize + onPageSizeChange are also given.',
        },
        pageSize: {
            control: 'number',
            description: 'Currently selected page size.',
        },
        onPageSizeChange: {
            action: 'pageSizeChange',
            description: 'Called with the new page size when the selector changes.',
        },
        totalItems: {
            control: 'number',
            description: 'Total item count. When provided, renders a muted "X elementos" text.',
        },
        'aria-label': {
            control: 'text',
            description: 'Accessible label for the <nav>. Default: "Paginación".',
        },
    },
};

export default meta;
type Story = StoryObj<typeof Pagination>;

/* ============================================================
   STORY: Few pages — no ellipsis, all numbers visible
   ============================================================ */
export const FewPages: Story = {
    args: {
        page: 3,
        totalPages: 5,
        onPageChange: () => {},
    },
};

/* ============================================================
   STORY: Many pages — windowed with ellipsis on both sides
   ============================================================ */
export const ManyPages: Story = {
    args: {
        page: 6,
        totalPages: 12,
        onPageChange: () => {},
    },
};

/* ============================================================
   STORY: First page — prev disabled, no left ellipsis
   ============================================================ */
export const FirstPage: Story = {
    args: {
        page: 1,
        totalPages: 12,
        onPageChange: () => {},
    },
};

/* ============================================================
   STORY: Last page — next disabled, no right ellipsis
   ============================================================ */
export const LastPage: Story = {
    args: {
        page: 12,
        totalPages: 12,
        onPageChange: () => {},
    },
};

/* ============================================================
   STORY: With page size selector + total items count
   ============================================================ */
export const WithPageSizeSelector: Story = {
    args: {
        page: 4,
        totalPages: 20,
        onPageChange: () => {},
        pageSizeOptions: [10, 20, 50],
        pageSize: 20,
        onPageSizeChange: () => {},
        totalItems: 387,
    },
};
