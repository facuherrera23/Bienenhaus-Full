import { fireEvent, render, screen } from '@testing-library/preact';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a textarea with the given placeholder', () => {
    render(<Textarea placeholder="Describe la propiedad" />);
    expect(
      screen.getByPlaceholderText('Describe la propiedad')
    ).toBeInTheDocument();
  });

  it('renders a <textarea> element (not an input)', () => {
    const { container } = render(<Textarea placeholder="Notas" />);
    expect(container.querySelector('textarea')).toBeInTheDocument();
    expect(container.querySelector('input')).not.toBeInTheDocument();
  });

  it('applies the default rows=4 attribute', () => {
    render(<Textarea placeholder="Notas" />);
    expect(screen.getByPlaceholderText('Notas')).toHaveAttribute('rows', '4');
  });

  it('applies a custom rows attribute', () => {
    render(<Textarea placeholder="Notas" rows={8} />);
    expect(screen.getByPlaceholderText('Notas')).toHaveAttribute('rows', '8');
  });

  it('applies the resize-none class when resize="none"', () => {
    const { container } = render(
      <Textarea placeholder="Notas" resize="none" />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toMatch(/resizeNone/);
  });

  it('applies the resize-vertical class by default', () => {
    const { container } = render(<Textarea placeholder="Notas" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toMatch(/resizeVertical/);
  });

  it('applies the resize-both class when resize="both"', () => {
    const { container } = render(
      <Textarea placeholder="Notas" resize="both" />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toMatch(/resizeBoth/);
  });

  it('does not render the counter when showCounter is false', () => {
    render(<Textarea placeholder="Notas" maxLength={100} />);
    expect(screen.queryByText('0/100')).not.toBeInTheDocument();
  });

  it('renders the counter when maxLength + showCounter are set', () => {
    render(<Textarea placeholder="Notas" maxLength={100} showCounter />);
    expect(screen.getByText('0/100')).toBeInTheDocument();
  });

  it('shows the counter reflecting the controlled value length', () => {
    render(
      <Textarea
        placeholder="Notas"
        maxLength={10}
        showCounter
        value="hola"
      />
    );
    expect(screen.getByText('4/10')).toBeInTheDocument();
  });

  it('applies the danger counter class when the value reaches the limit', () => {
    const { container } = render(
      <Textarea
        placeholder="Notas"
        maxLength={5}
        showCounter
        value="abcde"
      />
    );
    const counter = container.querySelector('[aria-hidden="true"]');
    expect(counter).toBeInTheDocument();
    expect(counter?.className).toMatch(/counterDanger/);
  });

  it('does not apply the danger counter class when below the limit', () => {
    const { container } = render(
      <Textarea
        placeholder="Notas"
        maxLength={10}
        showCounter
        value="abc"
      />
    );
    const counter = container.querySelector('[aria-hidden="true"]');
    expect(counter?.className).not.toMatch(/counterDanger/);
  });

  it('sets aria-invalid when error is true', () => {
    render(<Textarea placeholder="Notas" error />);
    expect(screen.getByPlaceholderText('Notas')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  it('does not set aria-invalid when error is false', () => {
    render(<Textarea placeholder="Notas" />);
    expect(screen.getByPlaceholderText('Notas')).not.toHaveAttribute(
      'aria-invalid'
    );
  });

  it('applies the error class to the wrapper when error is true', () => {
    const { container } = render(<Textarea placeholder="Notas" error />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toMatch(/error/);
  });

  it('fires onChange with the new value on input', () => {
    const onChange = vi.fn();
    render(<Textarea placeholder="Notas" onChange={onChange} />);
    const textarea = screen.getByPlaceholderText('Notas');
    fireEvent.input(textarea, { target: { value: 'nuevo texto' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('nuevo texto');
  });

  it('does not fire onChange when disabled', () => {
    const onChange = vi.fn();
    render(<Textarea placeholder="Notas" disabled onChange={onChange} />);
    const textarea = screen.getByPlaceholderText('Notas');
    expect(textarea).toBeDisabled();
    fireEvent.input(textarea, { target: { value: 'x' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not fire onChange when readOnly', () => {
    const onChange = vi.fn();
    render(<Textarea placeholder="Notas" readOnly onChange={onChange} />);
    const textarea = screen.getByPlaceholderText('Notas');
    expect(textarea).toHaveAttribute('readonly');
    fireEvent.input(textarea, { target: { value: 'x' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('forwards the ref to the textarea element', () => {
    const ref = { current: null as HTMLTextAreaElement | null };
    render(<Textarea placeholder="Notas" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('supports uncontrolled usage via defaultValue', () => {
    render(<Textarea placeholder="Notas" defaultValue="inicial" />);
    const textarea = screen.getByPlaceholderText('Notas') as HTMLTextAreaElement;
    expect(textarea.value).toBe('inicial');
  });

  it('supports controlled usage via value', () => {
    render(<Textarea placeholder="Notas" value="controlado" />);
    const textarea = screen.getByPlaceholderText('Notas') as HTMLTextAreaElement;
    expect(textarea.value).toBe('controlado');
  });

  it('updates the counter when the controlled value changes', () => {
    const { rerender } = render(
      <Textarea
        placeholder="Notas"
        maxLength={10}
        showCounter
        value="ab"
      />
    );
    expect(screen.getByText('2/10')).toBeInTheDocument();
    rerender(
      <Textarea
        placeholder="Notas"
        maxLength={10}
        showCounter
        value="abcdef"
      />
    );
    expect(screen.getByText('6/10')).toBeInTheDocument();
  });

  it('uses placeholder as aria-label fallback', () => {
    render(<Textarea placeholder="Mensaje" />);
    expect(screen.getByLabelText('Mensaje')).toBeInTheDocument();
  });

  it('uses explicit aria-label when provided', () => {
    render(
      <Textarea placeholder="Mensaje" aria-label="Campo de mensaje" />
    );
    expect(screen.getByLabelText('Campo de mensaje')).toBeInTheDocument();
  });

  it('applies size classes', () => {
    const { container, rerender } = render(
      <Textarea placeholder="Notas" size="sm" />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toMatch(/sm/);

    rerender(<Textarea placeholder="Notas" size="lg" />);
    const wrapperLg = container.firstChild as HTMLElement;
    expect(wrapperLg.className).toMatch(/lg/);
  });

  it('applies the maxLength attribute to the textarea', () => {
    render(<Textarea placeholder="Notas" maxLength={50} />);
    expect(screen.getByPlaceholderText('Notas')).toHaveAttribute(
      'maxlength',
      '50'
    );
  });
});
