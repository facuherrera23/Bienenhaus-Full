import { fireEvent, render, screen } from '@testing-library/preact';
import { Button } from './Button';
import styles from './Button.module.css';

describe('Button', () => {
    const defaultProps = {
        children: 'Test Button',
        onClick: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders children correctly', () => {
        render(<Button {...defaultProps}>Click me</Button>);
        expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('applies base + variant + size classes', () => {
        const { container } = render(<Button {...defaultProps} variant="secondary" />);
        expect(container.firstChild).toHaveClass(styles.btn);
        expect(container.firstChild).toHaveClass(styles['btn--secondary']);
    });

    it('applies size classes', () => {
        const { container } = render(
            <Button {...defaultProps} size="lg">
                Large
            </Button>,
        );
        expect(container.firstChild).toHaveClass(styles['btn--lg']);
    });

    it('calls onClick when clicked', () => {
        render(<Button {...defaultProps} />);
        fireEvent.click(screen.getByRole('button'));
        expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
        render(<Button {...defaultProps} disabled />);
        fireEvent.click(screen.getByRole('button'));
        expect(defaultProps.onClick).not.toHaveBeenCalled();
    });

    it('shows loading state', () => {
        render(<Button {...defaultProps} loading />);
        expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('renders iconLeft when provided', () => {
        const icon = <span data-testid="icon-left" />;
        render(<Button {...defaultProps} iconLeft={icon} />);
        expect(screen.getByTestId('icon-left')).toBeInTheDocument();
    });

    it('renders iconRight when provided', () => {
        const icon = <span data-testid="icon-right" />;
        render(<Button {...defaultProps} iconRight={icon} />);
        expect(screen.getByTestId('icon-right')).toBeInTheDocument();
    });

    it('applies fullWidth class', () => {
        const { container } = render(<Button {...defaultProps} fullWidth />);
        expect(container.firstChild).toHaveClass(styles['btn--block']);
    });

    it('applies rounded class', () => {
        const { container } = render(<Button {...defaultProps} rounded />);
        expect(container.firstChild).toHaveClass(styles['btn--rounded']);
    });

    it('forwards ref', () => {
        const ref = { current: null };
        render(<Button {...defaultProps} ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it.each([
        'primary',
        'secondary',
        'ghost',
        'outline',
        'danger',
        'success',
        'warning',
        'link',
        'icon',
    ] as const)('renders variant %s', (variant) => {
        const { container } = render(<Button {...defaultProps} variant={variant} />);
        expect(container.firstChild).toHaveClass(styles[`btn--${variant}` as keyof typeof styles]);
    });

    it('renders icon variant with icon class', () => {
        const { container } = render(
            <Button {...defaultProps} variant="icon" aria-label="Edit">
                <span data-testid="icon-node" />
            </Button>,
        );
        expect(container.firstChild).toHaveClass(styles['btn--icon']);
        expect(screen.getByTestId('icon-node')).toBeInTheDocument();
    });

    it.each(['xs', 'sm', 'md', 'lg', 'xl'] as const)('renders size %s', (size) => {
        const { container } = render(<Button {...defaultProps} size={size} />);
        expect(container.firstChild).toHaveClass(styles.btn);
    });

    it('renders text inside text wrapper', () => {
        const { container } = render(<Button {...defaultProps}>Label</Button>);
        expect(container.querySelector(`.${styles.btn__text}`)).toHaveTextContent('Label');
    });

    it('does not render text wrapper for icon variant', () => {
        const { container } = render(
            <Button {...defaultProps} variant="icon" aria-label="Delete">
                <svg data-testid="svg" />
            </Button>,
        );
        expect(container.querySelector(`.${styles.btn__text}`)).not.toBeInTheDocument();
    });
});
