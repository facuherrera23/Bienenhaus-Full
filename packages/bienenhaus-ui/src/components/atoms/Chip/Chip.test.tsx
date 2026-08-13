import { fireEvent, render, screen } from '@testing-library/preact';
import { Chip } from './Chip';

/** A minimal SVG icon used as the `icon` prop across tests. */
const TestIcon = () => (
    <svg data-testid="test-icon" viewBox="0 0 24 24" width="14" height="14">
        <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" />
    </svg>
);

describe('Chip', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the label text', () => {
        render(<Chip label="Departamento" />);
        expect(screen.getByText('Departamento')).toBeInTheDocument();
    });

    it('renders as a span element', () => {
        const { container } = render(<Chip label="Tag" />);
        expect(container.firstChild).toBeInstanceOf(HTMLSpanElement);
    });

    it('shows the icon when provided', () => {
        render(<Chip label="Con icono" icon={<TestIcon />} />);
        expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('does not render an icon when not provided', () => {
        const { container } = render(<Chip label="Sin icono" />);
        // No nested svg inside the chip span.
        expect(container.querySelector('svg')).not.toBeInTheDocument();
    });

    it('shows the close button when removable', () => {
        render(<Chip label="Removible" removable onClose={() => {}} />);
        expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument();
    });

    it('does not show the close button when not removable', () => {
        render(<Chip label="No removible" />);
        expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
    });

    it('calls onClose when the close button is clicked', () => {
        const onClose = vi.fn();
        render(<Chip label="Cerrar" removable onClose={onClose} />);
        fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when removable is false even if onClose is provided', () => {
        const onClose = vi.fn();
        render(<Chip label="No removable" onClose={onClose} />);
        // No button rendered → nothing to click.
        expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
        expect(onClose).not.toHaveBeenCalled();
    });

    it('applies the default variant class by default', () => {
        const { container } = render(<Chip label="Default" />);
        const chip = container.firstChild as HTMLElement;
        // base + variant = at least 2 hashed classes
        expect(chip.classList.length).toBeGreaterThanOrEqual(2);
    });

    it.each(['default', 'outline'] as const)('applies the %s variant class', (variant) => {
        const { container } = render(<Chip label={variant} variant={variant} />);
        const chip = container.firstChild as HTMLElement;
        expect(chip.classList.length).toBeGreaterThanOrEqual(2);
    });

    it('applies the removable modifier class when removable', () => {
        const { container } = render(<Chip label="Removable" removable onClose={() => {}} />);
        const chip = container.firstChild as HTMLElement;
        // base + variant + removable = at least 3 hashed classes
        expect(chip.classList.length).toBeGreaterThanOrEqual(3);
    });

    it('merges a consumer className alongside module classes', () => {
        const { container } = render(<Chip label="Custom" className="my-extra" />);
        expect(container.firstChild).toHaveClass('my-extra');
    });

    it('forwards the ref to the span element', () => {
        const ref = { current: null as HTMLSpanElement | null };
        render(<Chip label="Ref" ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    });

    it('passes through extra span attributes', () => {
        render(<Chip label="Attrs" data-testid="custom" title="Category chip" id="c1" />);
        const chip = screen.getByTestId('custom');
        expect(chip).toHaveAttribute('title', 'Category chip');
        expect(chip).toHaveAttribute('id', 'c1');
    });

    it('combines variant, icon, removable, and custom className together', () => {
        const { container } = render(
            <Chip
                label="Combined"
                variant="outline"
                icon={<TestIcon />}
                removable
                onClose={() => {}}
                className="extra"
            />,
        );
        const chip = container.firstChild as HTMLElement;
        expect(chip).toHaveClass('extra');
        expect(chip.classList.length).toBeGreaterThanOrEqual(4);
        expect(screen.getByTestId('test-icon')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument();
    });
});
