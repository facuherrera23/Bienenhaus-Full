import { fireEvent, render, screen } from '@testing-library/preact';
import { getPageItems, Pagination } from './Pagination';

describe('Pagination', () => {
    const defaultProps = {
        page: 1,
        totalPages: 5,
        onPageChange: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    /* ============================================================
     getPageItems — windowing logic unit tests
     ============================================================ */

    it('getPageItems returns all pages when total <= 7', () => {
        expect(getPageItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
        expect(getPageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it('getPageItems collapses middle with ellipsis for large total', () => {
        // page 6 of 12 → 1 … 5 6 7 … 12
        expect(getPageItems(6, 12)).toEqual([1, 'ellipsis', 5, 6, 7, 'ellipsis', 12]);
    });

    it('getPageItems omits left ellipsis when current near start', () => {
        // page 2 of 12 → 1 2 3 … 12
        expect(getPageItems(2, 12)).toEqual([1, 2, 3, 'ellipsis', 12]);
    });

    it('getPageItems omits right ellipsis when current near end', () => {
        // page 11 of 12 → 1 … 10 11 12
        expect(getPageItems(11, 12)).toEqual([1, 'ellipsis', 10, 11, 12]);
    });

    it('getPageItems never exceeds 7 slots', () => {
        const items = getPageItems(50, 100);
        expect(items.length).toBeLessThanOrEqual(7);
    });

    it('getPageItems clamps out-of-range page', () => {
        expect(getPageItems(0, 5)).toEqual([1, 2, 3, 4, 5]);
        expect(getPageItems(99, 5)).toEqual([1, 2, 3, 4, 5]);
    });

    /* ============================================================
     Rendering
     ============================================================ */

    it('renders a nav with default aria-label "Paginación"', () => {
        render(<Pagination {...defaultProps} />);
        expect(screen.getByRole('navigation', { name: 'Paginación' })).toBeInTheDocument();
    });

    it('renders all page numbers for a small total', () => {
        render(<Pagination {...defaultProps} totalPages={5} />);
        const buttons = screen.getAllByRole('button', { name: /Página \d+/ });
        // 5 page-number buttons (prev/next have non-numeric labels, excluded by \d+)
        expect(buttons.length).toBe(5);
        // Page numbers 1-5 all present
        for (let p = 1; p <= 5; p += 1) {
            expect(screen.getByRole('button', { name: `Página ${p}` })).toBeInTheDocument();
        }
    });

    it('renders ellipsis for a large total', () => {
        render(<Pagination page={6} totalPages={12} onPageChange={vi.fn()} />);
        // Ellipsis is a non-interactive span with "…"
        const ellipses = document.querySelectorAll('span');
        const ellipsisText = Array.from(ellipses).filter((el) => el.textContent === '…');
        expect(ellipsisText.length).toBe(2);
    });

    /* ============================================================
     Prev / Next
     ============================================================ */

    it('disables prev button on page 1', () => {
        render(<Pagination {...defaultProps} page={1} />);
        expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
    });

    it('disables next button on last page', () => {
        render(<Pagination {...defaultProps} page={5} totalPages={5} />);
        expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
    });

    it('enables prev and next on a middle page', () => {
        render(<Pagination {...defaultProps} page={3} totalPages={5} />);
        expect(screen.getByRole('button', { name: 'Página anterior' })).not.toBeDisabled();
        expect(screen.getByRole('button', { name: 'Página siguiente' })).not.toBeDisabled();
    });

    it('calls onPageChange with page-1 when prev clicked', () => {
        const onPageChange = vi.fn();
        render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />);
        fireEvent.click(screen.getByRole('button', { name: 'Página anterior' }));
        expect(onPageChange).toHaveBeenCalledTimes(1);
        expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('calls onPageChange with page+1 when next clicked', () => {
        const onPageChange = vi.fn();
        render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />);
        fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
        expect(onPageChange).toHaveBeenCalledTimes(1);
        expect(onPageChange).toHaveBeenCalledWith(4);
    });

    /* ============================================================
     Page number clicks
     ============================================================ */

    it('calls onPageChange with the clicked page number', () => {
        const onPageChange = vi.fn();
        render(<Pagination page={1} totalPages={5} onPageChange={onPageChange} />);
        fireEvent.click(screen.getByRole('button', { name: 'Página 3' }));
        expect(onPageChange).toHaveBeenCalledTimes(1);
        expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('does not call onPageChange when clicking the active page', () => {
        const onPageChange = vi.fn();
        render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />);
        fireEvent.click(screen.getByRole('button', { name: 'Página 3' }));
        expect(onPageChange).not.toHaveBeenCalled();
    });

    /* ============================================================
     Active page
     ============================================================ */

    it('marks the active page with aria-current="page"', () => {
        render(<Pagination page={3} totalPages={5} onPageChange={vi.fn()} />);
        const activeBtn = screen.getByRole('button', { name: 'Página 3' });
        expect(activeBtn).toHaveAttribute('aria-current', 'page');
    });

    it('does not mark inactive pages with aria-current', () => {
        render(<Pagination page={3} totalPages={5} onPageChange={vi.fn()} />);
        const inactiveBtn = screen.getByRole('button', { name: 'Página 1' });
        expect(inactiveBtn).not.toHaveAttribute('aria-current');
    });

    /* ============================================================
     Ellipsis semantics
     ============================================================ */

    it('renders ellipsis as a non-interactive span (not a button)', () => {
        render(<Pagination page={6} totalPages={12} onPageChange={vi.fn()} />);
        const ellipsisSpans = document.querySelectorAll('span');
        const ellipsis = Array.from(ellipsisSpans).filter((el) => el.textContent === '…');
        expect(ellipsis.length).toBeGreaterThan(0);
        ellipsis.forEach((el) => {
            expect(el.tagName).toBe('SPAN');
        });
    });

    /* ============================================================
     Page size selector
     ============================================================ */

    it('renders page size selector when pageSize + onPageSizeChange + options given', () => {
        render(
            <Pagination
                {...defaultProps}
                pageSizeOptions={[10, 20, 50]}
                pageSize={20}
                onPageSizeChange={vi.fn()}
            />,
        );
        expect(
            screen.getByRole('combobox', { name: 'Cantidad de filas por página' }),
        ).toBeInTheDocument();
        // Options present
        expect(screen.getByRole('option', { name: '10' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '20' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '50' })).toBeInTheDocument();
    });

    it('does not render page size selector when missing pageSize', () => {
        render(
            <Pagination
                {...defaultProps}
                pageSizeOptions={[10, 20, 50]}
                onPageSizeChange={vi.fn()}
            />,
        );
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('does not render page size selector when missing onPageSizeChange', () => {
        render(<Pagination {...defaultProps} pageSizeOptions={[10, 20, 50]} pageSize={20} />);
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('does not render page size selector when missing pageSizeOptions', () => {
        render(<Pagination {...defaultProps} pageSize={20} onPageSizeChange={vi.fn()} />);
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('fires onPageSizeChange with the new value when select changes', () => {
        const onPageSizeChange = vi.fn();
        render(
            <Pagination
                {...defaultProps}
                pageSizeOptions={[10, 20, 50]}
                pageSize={20}
                onPageSizeChange={onPageSizeChange}
            />,
        );
        const select = screen.getByRole('combobox', { name: 'Cantidad de filas por página' });
        fireEvent.change(select, { target: { value: '50' } });
        expect(onPageSizeChange).toHaveBeenCalledTimes(1);
        expect(onPageSizeChange).toHaveBeenCalledWith(50);
    });

    /* ============================================================
     Total items text
     ============================================================ */

    it('renders total items text when totalItems provided', () => {
        render(<Pagination {...defaultProps} totalItems={142} />);
        expect(screen.getByText('142 elementos')).toBeInTheDocument();
    });

    it('does not render total items text when totalItems omitted', () => {
        render(<Pagination {...defaultProps} />);
        expect(screen.queryByText(/elementos/)).not.toBeInTheDocument();
    });

    /* ============================================================
     First / last page windowing correctness
     ============================================================ */

    it('first page windowing: shows 1 2 3 … 12 (no left ellipsis)', () => {
        render(<Pagination page={1} totalPages={12} onPageChange={vi.fn()} />);
        expect(screen.getByRole('button', { name: 'Página 1' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Página 2' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Página 3' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Página 12' })).toBeInTheDocument();
        // Page 4 should NOT be present (collapsed)
        expect(screen.queryByRole('button', { name: 'Página 4' })).not.toBeInTheDocument();
        // Page 11 should NOT be present
        expect(screen.queryByRole('button', { name: 'Página 11' })).not.toBeInTheDocument();
    });

    it('last page windowing: shows 1 … 10 11 12 (no right ellipsis)', () => {
        render(<Pagination page={12} totalPages={12} onPageChange={vi.fn()} />);
        expect(screen.getByRole('button', { name: 'Página 1' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Página 10' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Página 11' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Página 12' })).toBeInTheDocument();
        // Page 9 should NOT be present (collapsed)
        expect(screen.queryByRole('button', { name: 'Página 9' })).not.toBeInTheDocument();
        // Page 2 should NOT be present
        expect(screen.queryByRole('button', { name: 'Página 2' })).not.toBeInTheDocument();
    });

    it('middle page windowing: shows 1 … 5 6 7 … 12', () => {
        render(<Pagination page={6} totalPages={12} onPageChange={vi.fn()} />);
        expect(screen.getByRole('button', { name: 'Página 1' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Página 5' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Página 6' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Página 7' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Página 12' })).toBeInTheDocument();
        // Page 4 should NOT be present
        expect(screen.queryByRole('button', { name: 'Página 4' })).not.toBeInTheDocument();
        // Page 8 should NOT be present
        expect(screen.queryByRole('button', { name: 'Página 8' })).not.toBeInTheDocument();
    });

    /* ============================================================
     Custom aria-label
     ============================================================ */

    it('accepts a custom aria-label', () => {
        render(<Pagination {...defaultProps} aria-label="Navegación de páginas" />);
        expect(
            screen.getByRole('navigation', { name: 'Navegación de páginas' }),
        ).toBeInTheDocument();
    });
});
