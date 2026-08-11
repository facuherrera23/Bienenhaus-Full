import { fireEvent, render, screen } from '@testing-library/preact';
import { EmptyState } from './EmptyState';
import type { EmptyStateProps } from './EmptyState';

describe('EmptyState', () => {
  const defaultProps: EmptyStateProps = {
    title: 'No hay propiedades',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ----------------------------------------------------------
     TITLE (required)
     ---------------------------------------------------------- */
  it('renders the title text', () => {
    render(<EmptyState {...defaultProps} />);
    expect(screen.getByText('No hay propiedades')).toBeInTheDocument();
  });

  it('renders the title as a <p> element (not a hardcoded heading)', () => {
    const { container } = render(<EmptyState {...defaultProps} />);
    const title = container.querySelector('.empty-state__title');
    expect(title).not.toBeNull();
    expect(title?.tagName).toBe('P');
  });

  /* ----------------------------------------------------------
     DESCRIPTION (optional)
     ---------------------------------------------------------- */
  it('renders the description when provided', () => {
    render(
      <EmptyState
        {...defaultProps}
        description="Aún no cargaste ninguna propiedad en el catálogo."
      />,
    );
    expect(
      screen.getByText('Aún no cargaste ninguna propiedad en el catálogo.'),
    ).toBeInTheDocument();
  });

  it('does not render a description element when description is omitted', () => {
    const { container } = render(<EmptyState {...defaultProps} />);
    expect(container.querySelector('.empty-state__desc')).toBeNull();
  });

  /* ----------------------------------------------------------
     ICON (optional, decorative)
     ---------------------------------------------------------- */
  it('renders a custom icon when provided', () => {
    const icon = <span data-testid="es-icon">★</span>;
    render(<EmptyState {...defaultProps} icon={icon} />);
    expect(screen.getByTestId('es-icon')).toBeInTheDocument();
  });

  it('marks the decorative icon wrapper as aria-hidden', () => {
    const { container } = render(
      <EmptyState {...defaultProps} icon={<span data-testid="es-icon">★</span>} />,
    );
    const iconWrapper = container.querySelector('.empty-state__icon');
    expect(iconWrapper).not.toBeNull();
    expect(iconWrapper?.getAttribute('aria-hidden')).toBe('true');
  });

  it('does not render an icon circle when icon is omitted', () => {
    const { container } = render(<EmptyState {...defaultProps} />);
    expect(container.querySelector('.empty-state__icon')).toBeNull();
  });

  /* ----------------------------------------------------------
     ACTION SLOT (optional — parent supplies the trigger)
     ---------------------------------------------------------- */
  it('renders the action slot when provided', () => {
    render(
      <EmptyState
        {...defaultProps}
        action={<button type="button">Crear propiedad</button>}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Crear propiedad' }),
    ).toBeInTheDocument();
  });

  it('fires the clickable child rendered in the action slot', () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        {...defaultProps}
        action={
          <button type="button" onClick={onClick}>
            Reintentar
          </button>
        }
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not render an action container when action is omitted', () => {
    const { container } = render(<EmptyState {...defaultProps} />);
    expect(container.querySelector('.empty-state__action')).toBeNull();
  });

  /* ----------------------------------------------------------
     SIZE CLASSES
     ---------------------------------------------------------- */
  it('applies the md size class by default', () => {
    const { container } = render(<EmptyState {...defaultProps} />);
    expect(container.firstChild).toHaveClass('empty-state--md');
  });

  it('applies the sm (compact) size class', () => {
    const { container } = render(<EmptyState {...defaultProps} size="sm" />);
    expect(container.firstChild).toHaveClass('empty-state--sm');
  });

  /* ----------------------------------------------------------
     CENTERED (default true)
     ---------------------------------------------------------- */
  it('applies the centered class by default', () => {
    const { container } = render(<EmptyState {...defaultProps} />);
    expect(container.firstChild).toHaveClass('empty-state--centered');
  });

  it('removes the centered class and applies inline class when centered=false', () => {
    const { container } = render(
      <EmptyState {...defaultProps} centered={false} />,
    );
    expect(container.firstChild).not.toHaveClass('empty-state--centered');
    expect(container.firstChild).toHaveClass('empty-state--inline');
  });

  /* ----------------------------------------------------------
     SEMANTICS — role="status" on the root
     ---------------------------------------------------------- */
  it('sets role="status" on the root element', () => {
    const { container } = render(<EmptyState {...defaultProps} />);
    expect(container.firstChild).toHaveAttribute('role', 'status');
  });

  /* ----------------------------------------------------------
     ROOT ELEMENT + REF + CLASSNAME
     ---------------------------------------------------------- */
  it('renders as a div element', () => {
    const { container } = render(<EmptyState {...defaultProps} />);
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });

  it('forwards the ref to the div element', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<EmptyState {...defaultProps} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a consumer className alongside the base classes', () => {
    const { container } = render(
      <EmptyState {...defaultProps} className="my-extra" />,
    );
    expect(container.firstChild).toHaveClass('my-extra');
    expect(container.firstChild).toHaveClass('empty-state--md');
    expect(container.firstChild).toHaveClass('empty-state--centered');
  });

  it('smoke renders all sizes without throwing', () => {
    expect(() => render(<EmptyState {...defaultProps} size="sm" />)).not.toThrow();
    expect(() => render(<EmptyState {...defaultProps} size="md" />)).not.toThrow();
  });
});
