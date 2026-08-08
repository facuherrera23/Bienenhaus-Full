import { render, screen, fireEvent } from '@testing-library/preact';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders unchecked by default (uncontrolled)', () => {
    render(<Checkbox aria-label="Accept" />);
    const input = screen.getByRole('checkbox');
    expect(input).not.toBeChecked();
    expect(input).toHaveAttribute('aria-checked', 'false');
  });

  it('renders checked when defaultChecked is true', () => {
    render(<Checkbox aria-label="Accept" defaultChecked />);
    const input = screen.getByRole('checkbox');
    expect(input).toBeChecked();
    expect(input).toHaveAttribute('aria-checked', 'true');
  });

  it('clicking toggles and fires onChange(true) then onChange(false)', () => {
    const onChange = vi.fn();
    render(<Checkbox aria-label="Accept" onChange={onChange} />);
    const input = screen.getByRole('checkbox');
    fireEvent.click(input);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(input).toBeChecked();
    fireEvent.click(input);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(input).not.toBeChecked();
  });

  it('controlled mode respects external checked prop', () => {
    const onChange = vi.fn();
    const { rerender } = render(<Checkbox aria-label="Accept" checked={false} onChange={onChange} />);
    const input = screen.getByRole('checkbox');
    expect(input).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(input);
    expect(onChange).toHaveBeenLastCalledWith(true);
    rerender(<Checkbox aria-label="Accept" checked={true} onChange={onChange} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
  });

  it('clicking the associated label toggles the checkbox', () => {
    const onChange = vi.fn();
    render(<Checkbox label="Accept terms" onChange={onChange} />);
    const input = screen.getByRole('checkbox');
    const label = screen.getByText('Accept terms');
    fireEvent.click(label);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(input).toBeChecked();
  });

  it('indeterminate sets el.indeterminate to true on the native input', () => {
    render(<Checkbox aria-label="Select all" indeterminate />);
    const input = screen.getByRole('checkbox') as HTMLInputElement;
    expect(input.indeterminate).toBe(true);
    expect(input).toHaveAttribute('aria-checked', 'mixed');
  });

  it('indeterminate=false leaves el.indeterminate false', () => {
    render(<Checkbox aria-label="Select all" />);
    const input = screen.getByRole('checkbox') as HTMLInputElement;
    expect(input.indeterminate).toBe(false);
  });

  it('indeterminate updates el.indeterminate when the prop toggles', () => {
    const { rerender } = render(<Checkbox aria-label="Select all" indeterminate={false} />);
    const input = screen.getByRole('checkbox') as HTMLInputElement;
    expect(input.indeterminate).toBe(false);
    rerender(<Checkbox aria-label="Select all" indeterminate={true} />);
    expect((screen.getByRole('checkbox') as HTMLInputElement).indeterminate).toBe(true);
    rerender(<Checkbox aria-label="Select all" indeterminate={false} />);
    expect((screen.getByRole('checkbox') as HTMLInputElement).indeterminate).toBe(false);
  });

  it('does not fire onChange when disabled', () => {
    const onChange = vi.fn();
    render(<Checkbox aria-label="Accept" disabled onChange={onChange} />);
    const input = screen.getByRole('checkbox');
    expect(input).toBeDisabled();
    fireEvent.click(input);
    expect(onChange).not.toBeCalled();
    expect(input).toHaveAttribute('aria-checked', 'false');
  });

  it('has type="checkbox" and aria-checked reflecting state', () => {
    render(<Checkbox aria-label="Accept" defaultChecked />);
    const input = screen.getByRole('checkbox');
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('type', 'checkbox');
    expect(input).toHaveAttribute('aria-checked', 'true');
  });

  it('applies size classes (sm and md)', () => {
    const { container: smContainer, unmount: smUnmount } = render(<Checkbox aria-label="sm" size="sm" />);
    const smRoot = smContainer.firstChild as HTMLElement;
    expect(smRoot).toHaveClass('checkbox--sm');
    smUnmount();

    const { container: mdContainer } = render(<Checkbox aria-label="md" size="md" />);
    const mdRoot = mdContainer.firstChild as HTMLElement;
    expect(mdRoot).toHaveClass('checkbox--md');
  });

  it('applies disabled class on the wrapper', () => {
    const { container } = render(<Checkbox aria-label="Accept" disabled />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass('checkbox--disabled');
  });

  it('forwards name and value for form integration', () => {
    render(<Checkbox aria-label="Accept" name="terms" value="accepted" />);
    const input = screen.getByRole('checkbox');
    expect(input).toHaveAttribute('name', 'terms');
    expect(input).toHaveAttribute('value', 'accepted');
  });

  it('forwards explicit id and wires label htmlFor', () => {
    render(<Checkbox label="Public profile" id="public-profile" />);
    const input = screen.getByRole('checkbox');
    expect(input).toHaveAttribute('id', 'public-profile');
    const label = screen.getByText('Public profile').closest('label');
    expect(label).toHaveAttribute('for', 'public-profile');
  });

  it('auto-generates id when omitted and wires label htmlFor', () => {
    render(<Checkbox label="Auto id" />);
    const input = screen.getByRole('checkbox');
    expect(input).toHaveAttribute('id');
    const label = screen.getByText('Auto id').closest('label');
    expect(label).toHaveAttribute('for', input.getAttribute('id'));
  });

  it('does not set aria-label when a visible label is provided', () => {
    render(<Checkbox label="Public profile" />);
    const input = screen.getByRole('checkbox');
    expect(input).not.toHaveAttribute('aria-label');
  });

  it('sets aria-label when no visible label is provided', () => {
    render(<Checkbox aria-label="Privacy toggle" />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-label', 'Privacy toggle');
  });

  it('renders the check icon SVG when checked', () => {
    const { container } = render(<Checkbox aria-label="Accept" defaultChecked />);
    const svg = container.querySelector('.checkbox__icon');
    expect(svg).not.toBeNull();
    expect(svg?.tagName.toLowerCase()).toBe('svg');
    const polyline = svg?.querySelector('polyline');
    expect(polyline).not.toBeNull();
  });

  it('renders the dash icon SVG when indeterminate', () => {
    const { container } = render(<Checkbox aria-label="Select all" indeterminate />);
    const svg = container.querySelector('.checkbox__icon');
    expect(svg).not.toBeNull();
    const line = svg?.querySelector('line');
    expect(line).not.toBeNull();
  });

  it('forwards ref to the native input', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Checkbox aria-label="Accept" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.type).toBe('checkbox');
  });

  it('smoke renders both sizes without throwing', () => {
    expect(() => render(<Checkbox aria-label="sm" size="sm" />)).not.toThrow();
    expect(() => render(<Checkbox aria-label="md" size="md" />)).not.toThrow();
  });
});
