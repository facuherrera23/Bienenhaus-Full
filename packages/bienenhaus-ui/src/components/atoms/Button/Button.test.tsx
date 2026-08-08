import { render, screen, fireEvent } from '@testing-library/preact';
import { Button } from './Button';

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

  it('applies variant classes', () => {
    const { container } = render(<Button {...defaultProps} variant="secondary">Secondary</Button>);
    expect(container.firstChild).toHaveClass('btn--secondary');
  });

  it('applies size classes', () => {
    const { container } = render(<Button {...defaultProps} size="lg">Large</Button>);
    expect(container.firstChild).toHaveClass('btn--lg');
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
    expect(container.firstChild).toHaveClass('btn--block');
  });

  it('applies rounded class', () => {
    const { container } = render(<Button {...defaultProps} rounded />);
    expect(container.firstChild).toHaveClass('btn--rounded');
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
  ] as const)('renders variant %s', (variant) => {
    const { container } = render(<Button {...defaultProps} variant={variant} />);
    expect(container.firstChild).toHaveClass(`btn--${variant}`);
  });

  it.each(['xs', 'sm', 'md', 'lg', 'xl'] as const)('renders size %s', (size) => {
    const { container } = render(<Button {...defaultProps} size={size} />);
    const expectedClass = size === 'md' ? 'btn' : `btn--${size}`;
    expect(container.firstChild).toHaveClass(expectedClass);
  });
});