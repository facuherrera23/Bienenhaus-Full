import { render, screen } from '@testing-library/preact';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders its children as text content', () => {
    render(<Badge>Publicado</Badge>);
    expect(screen.getByText('Publicado')).toBeInTheDocument();
  });

  it('renders as a span element', () => {
    const { container } = render(<Badge>Activo</Badge>);
    expect(container.firstChild).toBeInstanceOf(HTMLSpanElement);
  });

  it('applies the neutral variant class by default', () => {
    const { container } = render(<Badge>Default</Badge>);
    const badge = container.firstChild as HTMLElement;
    // base + variant + size (md) = at least 3 hashed classes
    expect(badge.classList.length).toBeGreaterThanOrEqual(3);
  });

  it.each([
    'success',
    'danger',
    'warning',
    'info',
    'neutral',
    'primary',
  ] as const)('applies the %s variant class', (variant) => {
    const { container } = render(<Badge variant={variant}>{variant}</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.classList.length).toBeGreaterThanOrEqual(3);
  });

  it.each(['sm', 'md'] as const)('applies the %s size class', (size) => {
    const { container } = render(<Badge size={size}>{size}</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.classList.length).toBeGreaterThanOrEqual(3);
  });

  it('does not render a dot by default', () => {
    const { container } = render(<Badge>No dot</Badge>);
    expect(container.querySelector('span span')).not.toBeInTheDocument();
  });

  it('renders a dot element when dot prop is true', () => {
    const { container } = render(<Badge dot>With dot</Badge>);
    const badge = container.firstChild as HTMLElement;
    // The dot is a nested span inside the badge span.
    const dot = badge.querySelector('span');
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveAttribute('aria-hidden', 'true');
  });

  it('merges a consumer className alongside module classes', () => {
    const { container } = render(
      <Badge className="my-extra">Custom</Badge>
    );
    expect(container.firstChild).toHaveClass('my-extra');
  });

  it('forwards the ref to the span element', () => {
    const ref = { current: null as HTMLSpanElement | null };
    render(<Badge ref={ref}>Ref</Badge>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('passes through extra span attributes', () => {
    render(
      <Badge data-testid="custom" title="Status badge" id="b1">
        Attrs
      </Badge>
    );
    const badge = screen.getByTestId('custom');
    expect(badge).toHaveAttribute('title', 'Status badge');
    expect(badge).toHaveAttribute('id', 'b1');
  });

  it('combines variant, size, dot, and custom className together', () => {
    const { container } = render(
      <Badge variant="success" size="sm" dot className="extra">
        Combined
      </Badge>
    );
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('extra');
    expect(badge.querySelector('span')).toBeInTheDocument();
    expect(badge.classList.length).toBeGreaterThanOrEqual(4);
  });
});
