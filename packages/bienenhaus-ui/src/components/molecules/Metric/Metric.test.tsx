import { render, screen } from '@testing-library/preact';
import { Metric, type MetricProps } from './Metric';

describe('Metric', () => {
    const defaultProps: MetricProps = {
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
        render(<Metric {...defaultProps} />);
        expect(screen.getByText('Propiedades publicadas')).toBeInTheDocument();
        expect(screen.getByText('128')).toBeInTheDocument();
    });

    it('renders a numeric value as text', () => {
        render(<Metric label="Leads" value={42} />);
        expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders a string value as text', () => {
        render(<Metric label="Conversión" value="3.2%" />);
        expect(screen.getByText('3.2%')).toBeInTheDocument();
    });

    /* ----------------------------------------------------------
     DELTA — UP (positive)
     ---------------------------------------------------------- */
    it('renders a positive delta with value, up arrow and success class', () => {
        const { container } = render(
            <Metric {...defaultProps} delta={{ value: '+12%', direction: 'up' }} />,
        );
        expect(screen.getByText('+12%')).toBeInTheDocument();
        // Up arrow SVG present inside the delta--up wrapper.
        const deltaSvg = container.querySelector('.metric__delta--up svg');
        expect(deltaSvg).toBeInTheDocument();
        // The delta wrapper carries the success (delta--up) class.
        expect(container.querySelector('.metric__delta--up')).not.toBeNull();
    });

    /* ----------------------------------------------------------
     DELTA — DOWN (negative)
     ---------------------------------------------------------- */
    it('renders a negative delta with value, down arrow and danger class', () => {
        const { container } = render(
            <Metric {...defaultProps} delta={{ value: '-3%', direction: 'down' }} />,
        );
        expect(screen.getByText('-3%')).toBeInTheDocument();
        // Down arrow SVG present inside the delta--down wrapper.
        const deltaSvg = container.querySelector('.metric__delta--down svg');
        expect(deltaSvg).toBeInTheDocument();
        expect(container.querySelector('.metric__delta--down')).not.toBeNull();
    });

    /* ----------------------------------------------------------
     NO DELTA
     ---------------------------------------------------------- */
    it('renders nothing delta-related when delta is omitted', () => {
        const { container } = render(<Metric {...defaultProps} />);
        expect(container.querySelector('.metric__delta')).toBeNull();
        expect(container.querySelector('.metric__delta--up')).toBeNull();
        expect(container.querySelector('.metric__delta--down')).toBeNull();
        expect(container.querySelector('svg')).toBeNull();
    });

    /* ----------------------------------------------------------
     ICON
     ---------------------------------------------------------- */
    it('renders the leading icon when provided', () => {
        const icon = <span data-testid="metric-icon">★</span>;
        render(<Metric {...defaultProps} icon={icon} />);
        expect(screen.getByTestId('metric-icon')).toBeInTheDocument();
    });

    it('does not render an icon box when icon is omitted', () => {
        const { container } = render(<Metric {...defaultProps} />);
        expect(container.querySelector('.metric__icon')).toBeNull();
    });

    /* ----------------------------------------------------------
     LOADING
     ---------------------------------------------------------- */
    it('shows a spinner and hides the value when loading is true', () => {
        render(<Metric {...defaultProps} loading />);
        // Value is NOT rendered.
        expect(screen.queryByText('128')).toBeNull();
        // Spinner is rendered (role=status).
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('keeps the label and icon visible while loading', () => {
        const icon = <span data-testid="metric-icon">★</span>;
        render(<Metric {...defaultProps} icon={icon} loading />);
        expect(screen.getByText('Propiedades publicadas')).toBeInTheDocument();
        expect(screen.getByTestId('metric-icon')).toBeInTheDocument();
    });

    it('hides the delta while loading', () => {
        const { container } = render(
            <Metric {...defaultProps} delta={{ value: '+12%', direction: 'up' }} loading />,
        );
        expect(screen.queryByText('+12%')).toBeNull();
        expect(container.querySelector('.metric__delta--up')).toBeNull();
    });

    it('renders an aria-label on the spinner while loading', () => {
        render(<Metric {...defaultProps} loading />);
        expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Cargando…');
    });

    /* ----------------------------------------------------------
     SIZE
     ---------------------------------------------------------- */
    it('applies the sm size class', () => {
        const { container } = render(<Metric {...defaultProps} size="sm" />);
        expect(container.firstChild).toHaveClass('metric--sm');
    });

    it('applies the md size class by default', () => {
        const { container } = render(<Metric {...defaultProps} />);
        expect(container.firstChild).toHaveClass('metric--md');
    });

    /* ----------------------------------------------------------
     VALUE — tabular-nums
     ---------------------------------------------------------- */
    it('renders the value with the tabular-nums class', () => {
        const { container } = render(<Metric {...defaultProps} />);
        const valueEl = container.querySelector('.metric__value');
        expect(valueEl).not.toBeNull();
        // The value element carries the metric__value class (which applies
        // font-variant-numeric: tabular-nums in the CSS module).
        expect(valueEl).toHaveClass('metric__value');
    });

    /* ----------------------------------------------------------
     ROOT ELEMENT + REF
     ---------------------------------------------------------- */
    it('renders as a div element', () => {
        const { container } = render(<Metric {...defaultProps} />);
        expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
    });

    it('forwards the ref to the div element', () => {
        const ref = { current: null as HTMLDivElement | null };
        render(<Metric {...defaultProps} ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('merges a consumer className alongside module classes', () => {
        const { container } = render(<Metric {...defaultProps} className="my-extra" />);
        expect(container.firstChild).toHaveClass('my-extra');
        expect(container.firstChild).toHaveClass('metric--md');
    });
});
