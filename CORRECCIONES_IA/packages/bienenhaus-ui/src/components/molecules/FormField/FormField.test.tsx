import { render, screen } from '@testing-library/preact';
import { FormField } from './FormField';

describe('FormField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the label text when label is provided', () => {
    render(
      <FormField label="Email address" htmlFor="email">
        <input id="email" type="email" />
      </FormField>,
    );
    expect(screen.getByText('Email address')).toBeInTheDocument();
  });

  it('wires the label htmlFor to the provided htmlFor prop', () => {
    render(
      <FormField label="Email" htmlFor="email-input">
        <input id="email-input" type="email" />
      </FormField>,
    );
    const label = screen.getByText('Email').closest('label');
    expect(label).toHaveAttribute('for', 'email-input');
  });

  it('renders the hint text under the control when hint is provided', () => {
    render(
      <FormField label="Email" hint="We will never share your email">
        <input type="email" />
      </FormField>,
    );
    expect(screen.getByText('We will never share your email')).toBeInTheDocument();
  });

  it('renders the error text when error is provided', () => {
    render(
      <FormField label="Email" error="Email is required">
        <input type="email" />
      </FormField>,
    );
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('error takes precedence over hint (hint is not rendered when error is set)', () => {
    render(
      <FormField label="Email" hint="Helper text" error="Something went wrong">
        <input type="email" />
      </FormField>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
  });

  it('required renders a `*` marker on the label', () => {
    render(
      <FormField label="Email" required>
        <input type="email" />
      </FormField>,
    );
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('required sets aria-required="true" on the wrapper', () => {
    const { container } = render(
      <FormField label="Email" required>
        <input type="email" />
      </FormField>,
    );
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute('aria-required', 'true');
  });

  it('error has role="alert" for screen-reader announcements', () => {
    render(
      <FormField label="Email" error="Invalid format">
        <input type="email" />
      </FormField>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid format');
  });

  it('error and hint each get a unique id (description id)', () => {
    const { container: hintContainer } = render(
      <FormField label="A" hint="hint text">
        <input />
      </FormField>,
    );
    const hintEl = screen.getByText('hint text');
    const hintId = hintEl.getAttribute('id');
    expect(hintId).toBeTruthy();
    expect(hintId).toContain('description');

    const root = hintContainer.firstChild as HTMLElement;
    expect(root).toHaveAttribute('aria-describedby', hintId);

    hintContainer.remove();

    const { container: errContainer } = render(
      <FormField label="B" error="err text">
        <input />
      </FormField>,
    );
    const errEl = screen.getByText('err text');
    const errId = errEl.getAttribute('id');
    expect(errId).toBeTruthy();
    expect(errId).toContain('description');
    const errRoot = errContainer.firstChild as HTMLElement;
    expect(errRoot).toHaveAttribute('aria-describedby', errId);
  });

  it('renders children inside the field', () => {
    render(
      <FormField label="Email">
        <input data-testid="child-input" type="email" />
      </FormField>,
    );
    expect(screen.getByTestId('child-input')).toBeInTheDocument();
  });

  it('merges the className prop onto the root wrapper', () => {
    const { container } = render(
      <FormField label="Email" className="custom-class">
        <input type="email" />
      </FormField>,
    );
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass('custom-class');
  });

  it('does not render a label element when label is omitted', () => {
    const { container } = render(
      <FormField>
        <input type="email" />
      </FormField>,
    );
    expect(container.querySelector('label')).toBeNull();
  });

  it('does not render a description element when neither hint nor error is provided', () => {
    const { container } = render(
      <FormField label="Email">
        <input type="email" />
      </FormField>,
    );
    expect(container.querySelector('p')).toBeNull();
  });

  it('does not set aria-describedby when no description is present', () => {
    const { container } = render(
      <FormField label="Email">
        <input type="email" />
      </FormField>,
    );
    const root = container.firstChild as HTMLElement;
    expect(root).not.toHaveAttribute('aria-describedby');
  });

  it('uses the provided id prop and derives the description id from it', () => {
    const { container } = render(
      <FormField id="my-field" label="Email" hint="helper">
        <input type="email" />
      </FormField>,
    );
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute('id', 'my-field');
    expect(root).toHaveAttribute('aria-describedby', 'my-field-description');
    expect(screen.getByText('helper')).toHaveAttribute('id', 'my-field-description');
  });

  it('auto-generates a stable id via useId when none is provided', () => {
    const { container } = render(
      <FormField label="Email" hint="helper">
        <input type="email" />
      </FormField>,
    );
    const root = container.firstChild as HTMLElement;
    const generatedId = root.getAttribute('id');
    expect(generatedId).toBeTruthy();
    expect(root).toHaveAttribute('aria-describedby', `${generatedId}-description`);
  });

  it('required marker is aria-hidden to avoid redundant SR output', () => {
    render(
      <FormField label="Email" required>
        <input type="email" />
      </FormField>,
    );
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
  });

  it('hint does not get role="alert" (only error does)', () => {
    render(
      <FormField label="Email" hint="just a hint">
        <input type="email" />
      </FormField>,
    );
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
