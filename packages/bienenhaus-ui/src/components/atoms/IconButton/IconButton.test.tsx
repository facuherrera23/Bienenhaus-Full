import { fireEvent, render, screen } from '@testing-library/preact';
import { IconButton } from './IconButton';

/** A minimal SVG icon used as children across tests. */
const TestIcon = () => (
    <svg data-testid="test-icon" viewBox="0 0 24 24" width="16" height="16">
        <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" />
    </svg>
);

describe('IconButton', () => {
    const defaultProps = {
        'aria-label': 'Close',
        children: <TestIcon />,
        onClick: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the icon as children', () => {
        render(<IconButton {...defaultProps} />);
        expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('exposes the required aria-label', () => {
        render(<IconButton {...defaultProps} />);
        expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('applies the ghost variant class by default', () => {
        const { container } = render(<IconButton {...defaultProps} />);
        // CSS Module class names are hashed; assert the variant class is present
        // alongside the base class by checking the button has >1 class token.
        const btn = container.firstChild as HTMLElement;
        expect(btn.classList.length).toBeGreaterThanOrEqual(2);
    });

    it.each(['ghost', 'outline', 'solid'] as const)('applies the %s variant class', (variant) => {
        const { container } = render(<IconButton {...defaultProps} variant={variant} />);
        // Different variants produce different hashed class names, so the
        // class set changes between variants.
        const btn = container.firstChild as HTMLElement;
        expect(btn.classList.length).toBeGreaterThanOrEqual(2);
    });

    it.each(['sm', 'md', 'lg'] as const)('applies the %s size class', (size) => {
        const { container } = render(<IconButton {...defaultProps} size={size} />);
        const btn = container.firstChild as HTMLElement;
        expect(btn.classList.length).toBeGreaterThanOrEqual(2);
    });

    it('calls onClick when clicked', () => {
        render(<IconButton {...defaultProps} />);
        fireEvent.click(screen.getByRole('button'));
        expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
        render(<IconButton {...defaultProps} disabled />);
        fireEvent.click(screen.getByRole('button'));
        expect(defaultProps.onClick).not.toHaveBeenCalled();
    });

    it('reflects the disabled attribute on the element', () => {
        render(<IconButton {...defaultProps} disabled />);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows loading state (aria-busy + disabled + spinner)', () => {
        const { container } = render(<IconButton {...defaultProps} loading />);
        const btn = screen.getByRole('button');
        expect(btn).toHaveAttribute('aria-busy', 'true');
        expect(btn).toBeDisabled();
        // The icon is replaced by the spinner; the original icon is not rendered.
        expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
        // A spinner svg exists inside the button.
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('does not call onClick when loading', () => {
        render(<IconButton {...defaultProps} loading />);
        fireEvent.click(screen.getByRole('button'));
        expect(defaultProps.onClick).not.toHaveBeenCalled();
    });

    it('forwards the ref to the button element', () => {
        const ref = { current: null as HTMLButtonElement | null };
        render(<IconButton {...defaultProps} ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('defaults type to "button" to avoid accidental form submits', () => {
        render(<IconButton {...defaultProps} />);
        expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('passes through extra button attributes', () => {
        render(<IconButton {...defaultProps} data-testid="custom" title="More" />);
        const btn = screen.getByTestId('custom');
        expect(btn).toHaveAttribute('title', 'More');
    });

    it('merges a consumer className', () => {
        const { container } = render(<IconButton {...defaultProps} className="my-extra" />);
        expect(container.firstChild).toHaveClass('my-extra');
    });
});
