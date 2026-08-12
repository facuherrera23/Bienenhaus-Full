import { fireEvent, render, screen } from '@testing-library/preact';
import { Breadcrumb ,type  BreadcrumbItem } from './Breadcrumb';

describe('Breadcrumb', () => {
  const twoItems: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Propiedades' },
  ];

  const fourItems: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Propiedades', href: '/admin/propiedades' },
    { label: 'Editar', href: '/admin/propiedades/123' },
    { label: 'Galería' },
  ];

  const fiveItems: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Propiedades', href: '/admin/propiedades' },
    { label: 'Detalle', href: '/admin/propiedades/123' },
    { label: 'Editar', href: '/admin/propiedades/123/editar' },
    { label: 'Galería' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a nav with aria-label="breadcrumb"', () => {
    render(<Breadcrumb items={twoItems} />);
    expect(
      screen.getByRole('navigation', { name: 'breadcrumb' })
    ).toBeInTheDocument();
  });

  it('renders all item labels for a short trail', () => {
    render(<Breadcrumb items={twoItems} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Propiedades')).toBeInTheDocument();
  });

  it('renders the last item as non-link with aria-current="page"', () => {
    render(<Breadcrumb items={twoItems} />);
    const current = screen.getByText('Propiedades').closest('span');
    expect(current).toHaveAttribute('aria-current', 'page');
    // No anchor wraps the current page label.
    expect(current?.closest('a')).toBeNull();
  });

  it('renders intermediate items with href as links pointing to the href', () => {
    render(<Breadcrumb items={fourItems} />);
    const link = screen.getByText('Dashboard').closest('a');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/admin');
    const link2 = screen.getByText('Propiedades').closest('a');
    expect(link2).toHaveAttribute('href', '/admin/propiedades');
  });

  it('renders intermediate items without href as plain text (no anchor)', () => {
    render(<Breadcrumb items={twoItems} />);
    // "Dashboard" has an href → anchor. The last item ("Propiedades") is the
    // current page, also non-link. Use a 3-item trail to test a middle text.
    const items: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/admin' },
      { label: 'Sección sin link' },
      { label: 'Actual' },
    ];
    render(<Breadcrumb items={items} />);
    const middle = screen.getByText('Sección sin link').closest('span');
    expect(middle).toBeInTheDocument();
    expect(middle?.closest('a')).toBeNull();
    expect(middle).not.toHaveAttribute('aria-current', 'page');
  });

  it('renders exactly items.length - 1 separators', () => {
    const { container } = render(<Breadcrumb items={fourItems} />);
    // Separators are SVGs with the separator class; count them via the
    // polyline child shape which only the chevron uses.
    const separators = container.querySelectorAll('svg polyline');
    expect(separators.length).toBe(fourItems.length - 1);
  });

  it('does not render a separator after the current (last) item', () => {
    const { container } = render(<Breadcrumb items={twoItems} />);
    const items = container.querySelectorAll('li');
    const lastItem = items[items.length - 1];
    // The last <li> must not contain a separator SVG.
    expect(lastItem.querySelector('svg polyline')).toBeNull();
  });

  it('collapses to 4 visible levels + ellipsis when items exceed maxItems', () => {
    render(<Breadcrumb items={fiveItems} maxItems={4} />);
    // Ellipsis button is present.
    expect(screen.getByRole('button', { name: 'Mostrar anteriores' })).toBeInTheDocument();
    // First and last items are always visible.
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Galería')).toBeInTheDocument();
    // The collapsed middle item ("Detalle") is NOT rendered.
    expect(screen.queryByText('Detalle')).not.toBeInTheDocument();
  });

  it('renders only the single item when items has length 1 (no separators, no ellipsis)', () => {
    render(<Breadcrumb items={[{ label: 'Único' }]} />);
    expect(screen.getByText('Único')).toBeInTheDocument();
    expect(screen.getByText('Único').closest('span')).toHaveAttribute('aria-current', 'page');
    // No links, no buttons, no separators.
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('calls onExpand when the ellipsis button is clicked', () => {
    const onExpand = vi.fn();
    render(<Breadcrumb items={fiveItems} maxItems={4} onExpand={onExpand} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar anteriores' }));
    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it('does not collapse when items.length === maxItems', () => {
    render(<Breadcrumb items={fourItems} maxItems={4} />);
    expect(screen.queryByRole('button', { name: 'Mostrar anteriores' })).not.toBeInTheDocument();
    expect(screen.getByText('Editar')).toBeInTheDocument();
  });

  it('truncates long labels via title attribute and keeps single-line label', () => {
    const longLabel = 'Esta es una etiqueta de breadcrumb extremadamente larga que supera los 28 caracteres';
    render(<Breadcrumb items={[{ label: 'Inicio', href: '/' }, { label: longLabel }]} />);
    const current = screen.getByText(longLabel).closest('span');
    expect(current).toHaveAttribute('title', longLabel);
    // The label span must not wrap (white-space: nowrap is applied via CSS).
    const labelSpan = screen.getByText(longLabel);
    expect(labelSpan).toBeInTheDocument();
  });

  it('does not set a title for short labels', () => {
    render(<Breadcrumb items={twoItems} />);
    const current = screen.getByText('Propiedades').closest('span');
    expect(current).not.toHaveAttribute('title');
  });

  it('merges a consumer className onto the nav element', () => {
    const { container } = render(
      <Breadcrumb items={twoItems} className="my-extra" />
    );
    expect(container.firstChild).toHaveClass('my-extra');
  });

  it('forwards the ref to the nav element', () => {
    const ref = { current: null as HTMLElement | null };
    render(<Breadcrumb items={twoItems} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current?.tagName).toBe('NAV');
  });
});
