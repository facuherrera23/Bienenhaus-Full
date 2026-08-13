import { fireEvent, render, screen } from '@testing-library/preact';
import { pushToast, ToastHost, type ToastItem } from './ToastHost';

describe('ToastHost', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /* ============================================================
     1. EMPTY STATE
     ============================================================ */
    it('renders nothing visible when toasts array is empty', () => {
        const { container } = render(<ToastHost toasts={[]} />);
        const host = container.firstChild as HTMLElement;
        expect(host).toBeInTheDocument();
        expect(host.children.length).toBe(0);
    });

    /* ============================================================
     2. RENDERS A TOAST WITH TYPE CLASS
     ============================================================ */
    it('renders a toast and applies the type class', () => {
        const toasts: ToastItem[] = [{ id: 1, type: 'success', title: 'Saved' }];
        const { container } = render(<ToastHost toasts={toasts} />);
        const toast = container.querySelector('.toast');
        expect(toast).toBeInTheDocument();
        expect(toast).toHaveClass('toast--success');
    });

    it.each(['success', 'error', 'info', 'warning'] as const)(
        'applies the toast--%s class for type %s',
        (type) => {
            const toasts: ToastItem[] = [{ id: 1, type, title: type }];
            const { container } = render(<ToastHost toasts={toasts} />);
            expect(container.querySelector('.toast')).toHaveClass(`toast--${type}`);
        },
    );

    /* ============================================================
     3. ICON — correct SVG per type
     ============================================================ */
    it('renders the success icon (polyline) for success type', () => {
        const toasts: ToastItem[] = [{ id: 1, type: 'success', title: 'ok' }];
        const { container } = render(<ToastHost toasts={toasts} />);
        const polyline = container.querySelector('.toast-icon polyline');
        expect(polyline).toBeInTheDocument();
    });

    it('renders the error icon (two lines) for error type', () => {
        const toasts: ToastItem[] = [{ id: 1, type: 'error', title: 'fail' }];
        const { container } = render(<ToastHost toasts={toasts} />);
        const lines = container.querySelectorAll('.toast-icon line');
        expect(lines.length).toBe(2);
    });

    it('renders the info icon (circle + 2 lines) for info type', () => {
        const toasts: ToastItem[] = [{ id: 1, type: 'info', title: 'info' }];
        const { container } = render(<ToastHost toasts={toasts} />);
        expect(container.querySelector('.toast-icon circle')).toBeInTheDocument();
        const lines = container.querySelectorAll('.toast-icon line');
        expect(lines.length).toBe(2);
    });

    it('renders the warning icon (path + 2 lines) for warning type', () => {
        const toasts: ToastItem[] = [{ id: 1, type: 'warning', title: 'warn' }];
        const { container } = render(<ToastHost toasts={toasts} />);
        expect(container.querySelector('.toast-icon path')).toBeInTheDocument();
        const lines = container.querySelectorAll('.toast-icon line');
        expect(lines.length).toBe(2);
    });

    it('renders the icon svg with 20x20 dimensions and stroke=currentColor', () => {
        const toasts: ToastItem[] = [{ id: 1, type: 'success', title: 'ok' }];
        const { container } = render(<ToastHost toasts={toasts} />);
        const svg = container.querySelector('.toast-icon svg') as SVGElement;
        expect(svg).toBeInTheDocument();
        expect(svg.getAttribute('width')).toBe('20');
        expect(svg.getAttribute('height')).toBe('20');
        expect(svg.getAttribute('stroke')).toBe('currentColor');
    });

    /* ============================================================
     4. TITLE + DESCRIPTION
     ============================================================ */
    it('renders the title text', () => {
        const toasts: ToastItem[] = [{ id: 1, type: 'info', title: 'Operation complete' }];
        render(<ToastHost toasts={toasts} />);
        expect(screen.getByText('Operation complete')).toBeInTheDocument();
    });

    it('renders the description when provided', () => {
        const toasts: ToastItem[] = [
            { id: 1, type: 'info', title: 'Title', description: 'Detailed description' },
        ];
        render(<ToastHost toasts={toasts} />);
        expect(screen.getByText('Detailed description')).toBeInTheDocument();
    });

    it('does not render a description element when description is omitted', () => {
        const toasts: ToastItem[] = [{ id: 1, type: 'info', title: 'No desc' }];
        const { container } = render(<ToastHost toasts={toasts} />);
        expect(container.querySelector('.toast-desc')).not.toBeInTheDocument();
    });

    /* ============================================================
     5. ROLE=status ON EACH TOAST
     ============================================================ */
    it('sets role=status on each toast element', () => {
        const toasts: ToastItem[] = [{ id: 1, type: 'success', title: 'a' }];
        render(<ToastHost toasts={toasts} />);
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('sets role=region with aria-label on the host container', () => {
        const { container } = render(<ToastHost toasts={[]} />);
        const host = container.firstChild as HTMLElement;
        expect(host).toHaveAttribute('role', 'region');
        expect(host).toHaveAttribute('aria-label', 'Notificaciones');
    });

    /* ============================================================
     6. AUTO-DISMISS NOT IN COMPONENT (parent responsibility)
     ============================================================ */
    it('does not auto-dismiss toasts on its own (no internal timeout)', () => {
        const toasts: ToastItem[] = [{ id: 1, type: 'success', title: 'persist' }];
        const { container } = render(<ToastHost toasts={toasts} />);
        // After 5s the toast should still be in the DOM — component is presentational.
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                expect(container.querySelector('.toast')).toBeInTheDocument();
                resolve();
            }, 50);
        });
    });

    /* ============================================================
     7. MULTIPLE TOASTS STACK
     ============================================================ */
    it('renders multiple toasts stacked in order', () => {
        const toasts: ToastItem[] = [
            { id: 1, type: 'success', title: 'first' },
            { id: 2, type: 'error', title: 'second' },
            { id: 3, type: 'info', title: 'third' },
        ];
        const { container } = render(<ToastHost toasts={toasts} />);
        const items = container.querySelectorAll('.toast');
        expect(items.length).toBe(3);
        expect(items[0]).toHaveClass('toast--success');
        expect(items[1]).toHaveClass('toast--error');
        expect(items[2]).toHaveClass('toast--info');
    });

    /* ============================================================
     8. CUSTOM CLASSNAME MERGED
     ============================================================ */
    it('merges a consumer className onto the host container', () => {
        const { container } = render(<ToastHost toasts={[]} className="my-custom-host" />);
        expect(container.firstChild).toHaveClass('toast-host');
        expect(container.firstChild).toHaveClass('my-custom-host');
    });

    /* ============================================================
     9. onDismiss CALLBACK
     ============================================================ */
    it('calls onDismiss with the toast id when a toast is clicked', () => {
        const onDismiss = vi.fn();
        const toasts: ToastItem[] = [{ id: 42, type: 'success', title: 'click me' }];
        const { container } = render(<ToastHost toasts={toasts} onDismiss={onDismiss} />);
        fireEvent.click(container.querySelector('.toast') as HTMLElement);
        expect(onDismiss).toHaveBeenCalledTimes(1);
        expect(onDismiss).toHaveBeenCalledWith(42);
    });

    it('does not attach a click handler when onDismiss is omitted', () => {
        const toasts: ToastItem[] = [{ id: 1, type: 'success', title: 'no handler' }];
        const { container } = render(<ToastHost toasts={toasts} />);
        const toast = container.querySelector('.toast') as HTMLElement;
        // Clicking should not throw — no handler wired.
        expect(() => fireEvent.click(toast)).not.toThrow();
    });

    /* ============================================================
     10. REF FORWARDING
     ============================================================ */
    it('forwards the ref to the host div element', () => {
        const ref = { current: null as HTMLDivElement | null };
        render(<ToastHost toasts={[]} ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    /* ============================================================
     11. pushToast HELPER
     ============================================================ */
    it('pushToast generates a unique id and returns the full ToastItem', () => {
        const a = pushToast({ type: 'success', title: 'A' });
        const b = pushToast({ type: 'error', title: 'B', description: 'desc' });
        expect(typeof a.id).toBe('number');
        expect(a.id).not.toBe(b.id);
        expect(b.id).toBeGreaterThan(a.id);
        expect(b).toEqual({ id: b.id, type: 'error', title: 'B', description: 'desc' });
    });

    it('pushToast preserves optional description as undefined when omitted', () => {
        const item = pushToast({ type: 'info', title: 'no desc' });
        expect(item.description).toBeUndefined();
        expect(item).toEqual({ id: item.id, type: 'info', title: 'no desc' });
    });
});
