import { fireEvent, render, screen } from '@testing-library/preact';
import { StatCard ,type  StatCardProps } from './StatCard';
import styles from './StatCard.module.css';

describe('StatCard', () => {
  const defaultProps: StatCardProps = {
    label: 'Propiedades publicadas',
    value: 128,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ----------------------------------------------------------
     LABEL + VALUE
     ---------------------------------------------------------- */
  it('renders the label and the value', () => {
    render(<StatCard {...defaultProps} />);
    expect(
      screen.getByText('Propiedades publicadas')
    ).toBeInTheDocument();
    expect(screen.getByText('128')).toBeInTheDocument();
  });

  it('renders a numeric value as text', () => {
    render(<StatCard label="Leads" value={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders a string value as text', () => {
    render(<StatCard label="Conversión" value="3.2%" />);
    expect(screen.getByText('3.2%')).toBeInTheDocument();
  });

  /* ----------------------------------------------------------
     ICON
     ---------------------------------------------------------- */
  it('renders the leading icon when provided', () => {
    const icon = <span data-testid="stat-icon">★</span>;
    render(<StatCard {...defaultProps} icon={icon} />);
    expect(screen.getByTestId('stat-icon')).toBeInTheDocument();
  });

  it('does not render an icon box when icon is omitted', () => {
    const { container } = render(<StatCard {...defaultProps} />);
    // The icon box is the only element carrying the iconBox class; assert none.
    expect(container.querySelector('[class*="iconBox"]')).toBeNull();
  });

  /* ----------------------------------------------------------
     TREND — UP (positive)
     ---------------------------------------------------------- */
  it('renders a positive trend with + value, up arrow and success class', () => {
    const { container } = render(
      <StatCard
        {...defaultProps}
        trend={{ value: '+12%', direction: 'up', positive: true }}
      />
    );
    expect(screen.getByText('+12%')).toBeInTheDocument();
    // Up arrow: a <line> from y=19 to y=5 (first SVG child line).
    const trendSvg = container.querySelector('[class*="trendUp"] svg');
    expect(trendSvg).toBeInTheDocument();
    // The trend wrapper carries the success (trendUp) class.
    expect(container.querySelector('[class*="trendUp"]')).not.toBeNull();
  });

  it('infers positive from direction=up when positive is omitted', () => {
    const { container } = render(
      <StatCard {...defaultProps} trend={{ value: '+5%', direction: 'up' }} />
    );
    expect(container.querySelector('[class*="trendUp"]')).not.toBeNull();
    expect(container.querySelector('[class*="trendDown"]')).toBeNull();
  });

  /* ----------------------------------------------------------
     TREND — DOWN (negative)
     ---------------------------------------------------------- */
  it('renders a negative trend with - value, down arrow and danger class', () => {
    const { container } = render(
      <StatCard
        {...defaultProps}
        trend={{ value: '-3%', direction: 'down', positive: false }}
      />
    );
    expect(screen.getByText('-3%')).toBeInTheDocument();
    // Down arrow SVG present inside the trendDown wrapper.
    const trendSvg = container.querySelector('[class*="trendDown"] svg');
    expect(trendSvg).toBeInTheDocument();
    expect(container.querySelector('[class*="trendDown"]')).not.toBeNull();
  });

  it('infers negative from direction=down when positive is omitted', () => {
    const { container } = render(
      <StatCard {...defaultProps} trend={{ value: '-8%', direction: 'down' }} />
    );
    expect(container.querySelector('[class*="trendDown"]')).not.toBeNull();
    expect(container.querySelector('[class*="trendUp"]')).toBeNull();
  });

  it('allows direction=up with positive=false (e.g. cost up is bad)', () => {
    const { container } = render(
      <StatCard
        {...defaultProps}
        trend={{ value: '+15%', direction: 'up', positive: false }}
      />
    );
    // Explicit positive=false → danger class even though arrow is up.
    expect(container.querySelector('[class*="trendDown"]')).not.toBeNull();
    expect(container.querySelector('[class*="trendUp"]')).toBeNull();
  });

  /* ----------------------------------------------------------
     SPARKLINE
     ---------------------------------------------------------- */
  it('renders an SVG polyline with the correct point count', () => {
    const data = [10, 20, 15, 30, 25, 40];
    const { container } = render(
      <StatCard {...defaultProps} sparkline={data} />
    );
    const polyline = container.querySelector('polyline');
    expect(polyline).toBeInTheDocument();
    const points = (polyline?.getAttribute('points') ?? '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    expect(points).toHaveLength(data.length);
  });

  it('does not render a sparkline with fewer than 2 points', () => {
    const { container } = render(
      <StatCard {...defaultProps} sparkline={[42]} />
    );
    expect(container.querySelector('polyline')).toBeNull();
  });

  /* ----------------------------------------------------------
     ACTION
     ---------------------------------------------------------- */
  it('renders an action button with the provided aria-label', () => {
    render(
      <StatCard
        {...defaultProps}
        action={{ label: 'Ver detalle', onClick: () => {} }}
      />
    );
    expect(
      screen.getByRole('button', { name: 'Ver detalle' })
    ).toBeInTheDocument();
  });

  it('triggers action.onClick when the action button is clicked', () => {
    const onClick = vi.fn();
    render(
      <StatCard {...defaultProps} action={{ label: 'Configurar', onClick }} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Configurar' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not render an action button when action is omitted', () => {
    render(<StatCard {...defaultProps} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  /* ----------------------------------------------------------
     LOADING
     ---------------------------------------------------------- */
  it('shows a spinner and hides the value when loading is true', () => {
    render(<StatCard {...defaultProps} loading />);
    // Value is NOT rendered.
    expect(screen.queryByText('128')).toBeNull();
    // Spinner is rendered (role=status).
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('keeps the label and icon visible while loading', () => {
    const icon = <span data-testid="stat-icon">★</span>;
    render(<StatCard {...defaultProps} icon={icon} loading />);
    expect(screen.getByText('Propiedades publicadas')).toBeInTheDocument();
    expect(screen.getByTestId('stat-icon')).toBeInTheDocument();
  });

  it('hides the trend while loading', () => {
    const { container } = render(
      <StatCard
        {...defaultProps}
        trend={{ value: '+12%', direction: 'up' }}
        loading
      />
    );
    expect(screen.queryByText('+12%')).toBeNull();
    expect(container.querySelector('[class*="trendUp"]')).toBeNull();
  });

  it('hides the sparkline while loading', () => {
    const { container } = render(
      <StatCard {...defaultProps} sparkline={[1, 2, 3]} loading />
    );
    expect(container.querySelector('polyline')).toBeNull();
  });

  /* ----------------------------------------------------------
     SIZE
     ---------------------------------------------------------- */
  it('applies the sm size class', () => {
    const { container } = render(
      <StatCard {...defaultProps} size="sm" />
    );
    expect(container.firstChild).toHaveClass(styles.sm);
  });

  it('applies the md size class by default', () => {
    const { container } = render(<StatCard {...defaultProps} />);
    expect(container.firstChild).toHaveClass(styles.md);
  });

  /* ----------------------------------------------------------
     ROOT ELEMENT + REF
     ---------------------------------------------------------- */
  it('renders as a div element', () => {
    const { container } = render(<StatCard {...defaultProps} />);
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });

  it('forwards the ref to the div element', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<StatCard {...defaultProps} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a consumer className alongside module classes', () => {
    const { container } = render(
      <StatCard {...defaultProps} className="my-extra" />
    );
    expect(container.firstChild).toHaveClass('my-extra');
    expect(container.firstChild).toHaveClass(styles.md);
  });
});
