import { render, screen, fireEvent, act } from '@testing-library/preact';
import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders an input with the given placeholder', () => {
    render(<SearchInput placeholder="Buscar propiedades" />);
    expect(
      screen.getByPlaceholderText('Buscar propiedades')
    ).toBeInTheDocument();
  });

  it('renders the search icon by default', () => {
    const { container } = render(<SearchInput placeholder="Search" />);
    // The magnifier icon is the first SVG inside the wrapper.
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.querySelector('circle')).toBeInTheDocument();
  });

  it('uses placeholder as aria-label fallback', () => {
    render(<SearchInput placeholder="Buscar" />);
    expect(screen.getByLabelText('Buscar')).toBeInTheDocument();
  });

  it('uses explicit aria-label when provided', () => {
    render(
      <SearchInput placeholder="Buscar" aria-label="Campo de búsqueda" />
    );
    expect(screen.getByLabelText('Campo de búsqueda')).toBeInTheDocument();
  });

  it('typing updates the input immediately (never blocks typing)', () => {
    render(<SearchInput placeholder="Search" onChange={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search') as HTMLInputElement;
    fireEvent.input(input, { target: { value: 'hola' } });
    expect(input.value).toBe('hola');
  });

  it('fires debounced onChange after the delay', () => {
    const onChange = vi.fn();
    render(<SearchInput placeholder="Search" onChange={onChange} />);
    const input = screen.getByPlaceholderText('Search');
    fireEvent.input(input, { target: { value: 'abc' } });

    // Before the debounce window elapses, onChange has NOT fired.
    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('abc');
  });

  it('respects a custom debounceMs', () => {
    const onChange = vi.fn();
    render(
      <SearchInput placeholder="Search" onChange={onChange} debounceMs={500} />
    );
    const input = screen.getByPlaceholderText('Search');
    fireEvent.input(input, { target: { value: 'xyz' } });

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('xyz');
  });

  it('cancels pending debounce on new input (no stale updates)', () => {
    const onChange = vi.fn();
    render(<SearchInput placeholder="Search" onChange={onChange} />);
    const input = screen.getByPlaceholderText('Search');
    fireEvent.input(input, { target: { value: 'a' } });
    fireEvent.input(input, { target: { value: 'ab' } });
    fireEvent.input(input, { target: { value: 'abc' } });

    act(() => {
      vi.advanceTimersByTime(300);
    });
    // Only the final value fires — intermediate ones were cancelled.
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('abc');
  });

  it('fires immediately when debounceMs is 0', () => {
    const onChange = vi.fn();
    render(
      <SearchInput placeholder="Search" onChange={onChange} debounceMs={0} />
    );
    const input = screen.getByPlaceholderText('Search');
    fireEvent.input(input, { target: { value: 'now' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('now');
  });

  it('shows the clear button only when there is a value', () => {
    render(<SearchInput placeholder="Search" />);
    // No value → no clear button.
    expect(screen.queryByLabelText('Limpiar búsqueda')).not.toBeInTheDocument();

    const input = screen.getByPlaceholderText('Search');
    fireEvent.input(input, { target: { value: 'algo' } });
    expect(screen.getByLabelText('Limpiar búsqueda')).toBeInTheDocument();
  });

  it('clears the value and fires onChange with empty string on clear click', () => {
    const onChange = vi.fn();
    render(<SearchInput placeholder="Search" onChange={onChange} />);
    const input = screen.getByPlaceholderText('Search') as HTMLInputElement;
    fireEvent.input(input, { target: { value: 'texto' } });

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onChange).toHaveBeenCalledWith('texto');

    fireEvent.click(screen.getByLabelText('Limpiar búsqueda'));
    expect(input.value).toBe('');
    // Clear fires onChange immediately (not debounced).
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('refocuses the input after clearing', () => {
    render(<SearchInput placeholder="Search" />);
    const input = screen.getByPlaceholderText('Search') as HTMLInputElement;
    fireEvent.input(input, { target: { value: 'x' } });
    fireEvent.click(screen.getByLabelText('Limpiar búsqueda'));
    expect(document.activeElement).toBe(input);
  });

  it('shows the spinner and hides the clear button while loading', () => {
    const { container } = render(
      <SearchInput placeholder="Search" loading value="abc" />
    );
    // Clear button is hidden while loading.
    expect(screen.queryByLabelText('Limpiar búsqueda')).not.toBeInTheDocument();
    // A spinner SVG exists (the clear icon has no circle; the spinner does).
    const svgs = container.querySelectorAll('svg');
    const hasSpinner = Array.from(svgs).some((svg) =>
      svg.querySelector('circle')
    );
    expect(hasSpinner).toBe(true);
    // Input is marked aria-busy.
    expect(screen.getByPlaceholderText('Search')).toHaveAttribute(
      'aria-busy',
      'true'
    );
  });

  it('blocks typing when disabled', () => {
    const onChange = vi.fn();
    render(
      <SearchInput placeholder="Search" disabled onChange={onChange} />
    );
    const input = screen.getByPlaceholderText('Search') as HTMLInputElement;
    expect(input).toBeDisabled();
    fireEvent.input(input, { target: { value: 'x' } });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders the shortcut badge when provided, idle and empty', () => {
    render(<SearchInput placeholder="Search" shortcut="/" />);
    expect(screen.getByText('/')).toBeInTheDocument();
  });

  it('hides the shortcut badge while focused', () => {
    render(<SearchInput placeholder="Search" shortcut="/" />);
    const input = screen.getByPlaceholderText('Search') as HTMLInputElement;
    expect(screen.getByText('/')).toBeInTheDocument();
    act(() => {
      input.focus();
    });
    expect(screen.queryByText('/')).not.toBeInTheDocument();
  });

  it('hides the shortcut badge when there is a value', () => {
    render(<SearchInput placeholder="Search" shortcut="/" />);
    const input = screen.getByPlaceholderText('Search');
    fireEvent.input(input, { target: { value: 'q' } });
    expect(screen.queryByText('/')).not.toBeInTheDocument();
  });

  it('supports uncontrolled usage via defaultValue', () => {
    render(<SearchInput placeholder="Search" defaultValue="inicial" />);
    const input = screen.getByPlaceholderText('Search') as HTMLInputElement;
    expect(input.value).toBe('inicial');
    // Clear button appears because there is a value.
    expect(screen.getByLabelText('Limpiar búsqueda')).toBeInTheDocument();
  });

  it('supports controlled usage via value', () => {
    render(<SearchInput placeholder="Search" value="controlado" />);
    const input = screen.getByPlaceholderText('Search') as HTMLInputElement;
    expect(input.value).toBe('controlado');
  });

  it('forwards the ref to the input element', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<SearchInput placeholder="Search" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('applies size classes', () => {
    const { container, rerender } = render(
      <SearchInput placeholder="Search" size="sm" />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.classList.length).toBeGreaterThanOrEqual(2);

    rerender(<SearchInput placeholder="Search" size="lg" />);
    const wrapperLg = container.firstChild as HTMLElement;
    expect(wrapperLg.classList.length).toBeGreaterThanOrEqual(2);
  });

  it('cleans up the debounce timer on unmount (no stale updates)', () => {
    const onChange = vi.fn();
    const { unmount } = render(
      <SearchInput placeholder="Search" onChange={onChange} />
    );
    const input = screen.getByPlaceholderText('Search');
    fireEvent.input(input, { target: { value: 'ghost' } });
    // Unmount before the timer fires.
    unmount();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onChange).not.toHaveBeenCalled();
  });
});
