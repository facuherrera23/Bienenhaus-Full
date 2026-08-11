import { render, screen } from '@testing-library/preact';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('renders with the default size (md)', () => {
    const { container } = render(<Spinner />);
    const spinner = container.firstChild as HTMLElement;
    // base + md + primary = 3 hashed classes
    expect(spinner.classList.length).toBe(3);
  });

  it('renders as a div element', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });

  it.each(['sm', 'md', 'lg', 'xl'] as const)(
    'applies the %s size class',
    (size) => {
      const { container } = render(<Spinner size={size} />);
      const spinner = container.firstChild as HTMLElement;
      // base + size + primary = 3 hashed classes
      expect(spinner.classList.length).toBe(3);
    }
  );

  it.each(['primary', 'white', 'inherit'] as const)(
    'applies the %s color class',
    (color) => {
      const { container } = render(<Spinner color={color} />);
      const spinner = container.firstChild as HTMLElement;
      // base + md + color = 3 hashed classes
      expect(spinner.classList.length).toBe(3);
    }
  );

  it('shows a track circle alongside the arc', () => {
    const { container } = render(<Spinner />);
    const circles = container.querySelectorAll('circle');
    // track + arc = 2 circles
    expect(circles).toHaveLength(2);
  });

  it('gives the track circle the track class', () => {
    const { container } = render(<Spinner />);
    const track = container.querySelector('circle:first-of-type');
    expect(track).toBeInTheDocument();
    expect(track).toHaveAttribute('fill', 'none');
  });

  it('gives the arc circle a round linecap and dasharray', () => {
    const { container } = render(<Spinner />);
    const arc = container.querySelector('circle:last-of-type');
    expect(arc).toBeInTheDocument();
    expect(arc).toHaveAttribute('stroke-linecap', 'round');
    expect(arc).toHaveAttribute('stroke-dasharray');
  });

  it('has role="status" and aria-label="Cargando..." by default', () => {
    render(<Spinner data-testid="sp" />);
    const spinner = screen.getByTestId('sp');
    expect(spinner).toHaveAttribute('role', 'status');
    expect(spinner).toHaveAttribute('aria-label', 'Cargando...');
  });

  it('hides the SVG from assistive technology', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
  });

  it('respects the inline prop by adding the inline class', () => {
    const { container } = render(<Spinner inline />);
    const spinner = container.firstChild as HTMLElement;
    // base + md + primary + inline = 4 hashed classes
    expect(spinner.classList.length).toBe(4);
  });

  it('does not add the inline class when inline is false', () => {
    const { container } = render(<Spinner inline={false} />);
    const spinner = container.firstChild as HTMLElement;
    expect(spinner.classList.length).toBe(3);
  });

  it('uses the default thickness per size when thickness is not provided', () => {
    const { container } = render(<Spinner size="xl" />);
    const arc = container.querySelector('circle:last-of-type');
    // xl default thickness = 5
    expect(arc).toHaveAttribute('stroke-width', '5');
  });

  it('overrides the thickness when the prop is provided', () => {
    const { container } = render(<Spinner size="md" thickness={7} />);
    const arc = container.querySelector('circle:last-of-type');
    expect(arc).toHaveAttribute('stroke-width', '7');
  });

  it('applies the same thickness to both track and arc', () => {
    const { container } = render(<Spinner thickness={4} />);
    const [track, arc] = Array.from(container.querySelectorAll('circle'));
    expect(track).toHaveAttribute('stroke-width', '4');
    expect(arc).toHaveAttribute('stroke-width', '4');
  });

  it('allows overriding aria-label', () => {
    render(<Spinner data-testid="sp" aria-label="Loading content" />);
    expect(screen.getByTestId('sp')).toHaveAttribute(
      'aria-label',
      'Loading content'
    );
  });

  it('allows overriding role', () => {
    render(<Spinner data-testid="sp" role="progressbar" />);
    expect(screen.getByTestId('sp')).toHaveAttribute('role', 'progressbar');
  });

  it('forwards the ref to the div element', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Spinner ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a consumer className alongside module classes', () => {
    const { container } = render(<Spinner className="my-extra" />);
    expect(container.firstChild).toHaveClass('my-extra');
  });

  it('passes through extra div attributes', () => {
    render(<Spinner data-testid="custom" title="Loader" id="s1" />);
    const spinner = screen.getByTestId('custom');
    expect(spinner).toHaveAttribute('title', 'Loader');
    expect(spinner).toHaveAttribute('id', 's1');
  });

  it('combines size, color, inline, and custom className together', () => {
    const { container } = render(
      <Spinner size="lg" color="white" inline className="extra" />
    );
    const spinner = container.firstChild as HTMLElement;
    expect(spinner).toHaveClass('extra');
    // base + lg + white + inline = 4 hashed classes + 1 consumer = 5
    expect(spinner.classList.length).toBe(5);
  });
});
