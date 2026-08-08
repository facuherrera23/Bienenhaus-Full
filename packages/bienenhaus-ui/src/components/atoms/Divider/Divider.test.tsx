import { render, screen } from '@testing-library/preact';
import { Divider } from './Divider';

describe('Divider', () => {
  it('renders as a div element', () => {
    const { container } = render(<Divider />);
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });

  it('renders horizontal by default', () => {
    const { container } = render(<Divider />);
    const divider = container.firstChild as HTMLElement;
    // base + orientation (horizontal) + thickness (thin) + variant (solid) = 4
    expect(divider.classList.length).toBeGreaterThanOrEqual(4);
    expect(divider).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('renders vertical when orientation="vertical"', () => {
    const { container } = render(<Divider orientation="vertical" />);
    const divider = container.firstChild as HTMLElement;
    expect(divider).toHaveAttribute('aria-orientation', 'vertical');
  });

  it.each(['thin', 'medium', 'thick'] as const)(
    'applies the %s thickness class',
    (thickness) => {
      const { container } = render(<Divider thickness={thickness} />);
      const divider = container.firstChild as HTMLElement;
      // base + orientation + thickness + variant = at least 4
      expect(divider.classList.length).toBeGreaterThanOrEqual(4);
    }
  );

  it.each(['solid', 'dashed', 'dotted'] as const)(
    'applies the %s variant class',
    (variant) => {
      const { container } = render(<Divider variant={variant} />);
      const divider = container.firstChild as HTMLElement;
      expect(divider.classList.length).toBeGreaterThanOrEqual(4);
    }
  );

  it('does not render a label by default', () => {
    const { container } = render(<Divider />);
    expect(container.querySelector('span')).not.toBeInTheDocument();
  });

  it('renders the label text when provided', () => {
    render(<Divider label="Sección" />);
    expect(screen.getByText('Sección')).toBeInTheDocument();
  });

  it('renders two flanking line spans when a label is provided', () => {
    const { container } = render(<Divider label="Título" />);
    const divider = container.firstChild as HTMLElement;
    const lines = divider.querySelectorAll('span');
    // Two .line spans + one .label span = 3 spans total.
    expect(lines.length).toBe(3);
  });

  it('applies the withLabel modifier class when a label is provided', () => {
    const { container } = render(<Divider label="Con label" />);
    const divider = container.firstChild as HTMLElement;
    // base + orientation + thickness + variant + withLabel = at least 5
    expect(divider.classList.length).toBeGreaterThanOrEqual(5);
  });

  it('does not apply the withLabel modifier when no label is provided', () => {
    const { container } = render(<Divider />);
    const divider = container.firstChild as HTMLElement;
    // base + orientation + thickness + variant = 4 (no withLabel).
    expect(divider.classList.length).toBe(4);
  });

  it('merges a consumer className alongside module classes', () => {
    const { container } = render(<Divider className="my-extra" />);
    expect(container.firstChild).toHaveClass('my-extra');
  });

  it('forwards the ref to the div element', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Divider ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('passes through extra div attributes', () => {
    render(
      <Divider data-testid="custom" title="Section break" id="d1" />
    );
    const divider = screen.getByTestId('custom');
    expect(divider).toHaveAttribute('title', 'Section break');
    expect(divider).toHaveAttribute('id', 'd1');
  });

  it('sets role="separator" for accessibility', () => {
    const { container } = render(<Divider />);
    expect(container.firstChild).toHaveAttribute('role', 'separator');
  });

  it('combines orientation, thickness, variant, label, and custom className together', () => {
    const { container } = render(
      <Divider
        orientation="vertical"
        thickness="thick"
        variant="dashed"
        label="Completo"
        className="extra"
      />
    );
    const divider = container.firstChild as HTMLElement;
    expect(divider).toHaveClass('extra');
    expect(divider).toHaveAttribute('aria-orientation', 'vertical');
    expect(divider.classList.length).toBeGreaterThanOrEqual(6);
    expect(screen.getByText('Completo')).toBeInTheDocument();
  });
});
