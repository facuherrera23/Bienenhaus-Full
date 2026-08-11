import { fireEvent, render, screen } from '@testing-library/preact';
import { RadioGroup } from './RadioGroup';
import type { RadioOption } from './RadioGroup';

const baseOptions: RadioOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

describe('RadioGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the legend when provided', () => {
    render(<RadioGroup legend="Favorite fruit" options={baseOptions} aria-label="fruits" />);
    expect(screen.getByText('Favorite fruit').tagName).toBe('LEGEND');
  });

  it('renders all options as radio inputs', () => {
    render(<RadioGroup aria-label="fruits" options={baseOptions} />);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    expect(screen.getByLabelText('Apple')).toBeInTheDocument();
    expect(screen.getByLabelText('Banana')).toBeInTheDocument();
    expect(screen.getByLabelText('Cherry')).toBeInTheDocument();
  });

  it('checks the default value in uncontrolled mode', () => {
    render(<RadioGroup aria-label="fruits" options={baseOptions} defaultValue="banana" />);
    const banana = screen.getByLabelText('Banana');
    expect(banana).toBeChecked();
    expect(banana).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByLabelText('Apple')).not.toBeChecked();
  });

  it('fires onChange with the option value when an option is clicked', () => {
    const onChange = vi.fn();
    render(<RadioGroup aria-label="fruits" options={baseOptions} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Apple'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith('apple');
  });

  it('controlled mode respects the external value prop', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <RadioGroup aria-label="fruits" options={baseOptions} value="apple" onChange={onChange} />,
    );
    expect(screen.getByLabelText('Apple')).toBeChecked();
    expect(screen.getByLabelText('Banana')).not.toBeChecked();
    // user clicks banana — onChange fires with requested value
    fireEvent.click(screen.getByLabelText('Banana'));
    expect(onChange).toHaveBeenLastCalledWith('banana');
    // parent keeps apple (controlled) — re-render with value="apple" holds
    rerender(<RadioGroup aria-label="fruits" options={baseOptions} value="apple" onChange={onChange} />);
    expect(screen.getByLabelText('Apple')).toBeChecked();
    expect(screen.getByLabelText('Banana')).not.toBeChecked();
    // parent flips to cherry
    rerender(<RadioGroup aria-label="fruits" options={baseOptions} value="cherry" onChange={onChange} />);
    expect(screen.getByLabelText('Cherry')).toBeChecked();
    expect(screen.getByLabelText('Apple')).not.toBeChecked();
  });

  it('uses the same name attribute on all radio inputs', () => {
    render(<RadioGroup aria-label="fruits" name="fruit-choice" options={baseOptions} />);
    const radios = screen.getAllByRole('radio');
    for (const radio of radios) {
      expect(radio).toHaveAttribute('name', 'fruit-choice');
    }
  });

  it('auto-generates a name via useId when name is omitted', () => {
    render(<RadioGroup aria-label="fruits" options={baseOptions} />);
    const radios = screen.getAllByRole('radio');
    const names = new Set(radios.map((r) => r.getAttribute('name')));
    expect(names.size).toBe(1);
    // generated name is non-empty
    const generated = radios[0].getAttribute('name') ?? '';
    expect(generated.length).toBeGreaterThan(0);
  });

  it('applies the inline layout class when layout="inline"', () => {
    const { container } = render(
      <RadioGroup aria-label="fruits" options={baseOptions} layout="inline" />,
    );
    const fieldset = container.firstChild as HTMLElement;
    expect(fieldset).toHaveClass('radioGroup--inline');
  });

  it('applies the stacked layout class by default', () => {
    const { container } = render(<RadioGroup aria-label="fruits" options={baseOptions} />);
    const fieldset = container.firstChild as HTMLElement;
    expect(fieldset).toHaveClass('radioGroup--stacked');
  });

  it('applies size classes (sm and md)', () => {
    const { container: smContainer, unmount: smUnmount } = render(
      <RadioGroup aria-label="fruits" options={baseOptions} size="sm" />,
    );
    expect(smContainer.firstChild).toHaveClass('radioGroup--sm');
    smUnmount();

    const { container: mdContainer } = render(
      <RadioGroup aria-label="fruits" options={baseOptions} size="md" />,
    );
    expect(mdContainer.firstChild).toHaveClass('radioGroup--md');
  });

  it('blocks change when a single option is disabled', () => {
    const onChange = vi.fn();
    const options: RadioOption[] = [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana', disabled: true },
    ];
    render(<RadioGroup aria-label="fruits" options={options} onChange={onChange} />);
    const banana = screen.getByLabelText('Banana');
    expect(banana).toBeDisabled();
    fireEvent.click(banana);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('blocks all options when the whole group is disabled', () => {
    const onChange = vi.fn();
    render(<RadioGroup aria-label="fruits" options={baseOptions} disabled onChange={onChange} />);
    const radios = screen.getAllByRole('radio');
    for (const radio of radios) {
      expect(radio).toBeDisabled();
    }
    fireEvent.click(screen.getByLabelText('Apple'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders an option hint as muted helper text', () => {
    const options: RadioOption[] = [
      { value: 'apple', label: 'Apple', hint: 'Keeps the doctor away' },
    ];
    render(<RadioGroup aria-label="fruits" options={options} />);
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Keeps the doctor away')).toBeInTheDocument();
  });

  it('sets role="radiogroup" on the fieldset', () => {
    render(<RadioGroup aria-label="fruits" options={baseOptions} />);
    const group = screen.getByRole('radiogroup');
    expect(group.tagName).toBe('FIELDSET');
  });

  it('uses aria-label when no legend is provided', () => {
    render(<RadioGroup aria-label="Fruit selection" options={baseOptions} />);
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-label', 'Fruit selection');
  });

  it('does not set aria-label when a legend is provided', () => {
    render(<RadioGroup legend="Pick a fruit" options={baseOptions} />);
    expect(screen.getByRole('radiogroup')).not.toHaveAttribute('aria-label');
  });

  it('clicking the label selects the option (htmlFor wiring)', () => {
    const onChange = vi.fn();
    render(<RadioGroup aria-label="fruits" options={baseOptions} onChange={onChange} />);
    const label = screen.getByText('Cherry').closest('label');
    expect(label).not.toBeNull();
    const input = screen.getByLabelText('Cherry');
    expect(label?.getAttribute('for')).toBe(input.getAttribute('id'));
    fireEvent.click(label as HTMLElement);
    expect(onChange).toHaveBeenLastCalledWith('cherry');
  });

  it('switching from one option to another updates the checked state', () => {
    const onChange = vi.fn();
    render(<RadioGroup aria-label="fruits" options={baseOptions} defaultValue="apple" onChange={onChange} />);
    expect(screen.getByLabelText('Apple')).toBeChecked();
    fireEvent.click(screen.getByLabelText('Cherry'));
    expect(onChange).toHaveBeenLastCalledWith('cherry');
    expect(screen.getByLabelText('Cherry')).toBeChecked();
    expect(screen.getByLabelText('Apple')).not.toBeChecked();
  });

  it('smoke renders both sizes and both layouts without throwing', () => {
    expect(() => render(<RadioGroup aria-label="sm" options={baseOptions} size="sm" />)).not.toThrow();
    expect(() => render(<RadioGroup aria-label="md" options={baseOptions} size="md" />)).not.toThrow();
    expect(() => render(<RadioGroup aria-label="stacked" options={baseOptions} layout="stacked" />)).not.toThrow();
    expect(() => render(<RadioGroup aria-label="inline" options={baseOptions} layout="inline" />)).not.toThrow();
  });
});
