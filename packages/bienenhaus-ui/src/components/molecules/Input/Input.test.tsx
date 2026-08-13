import { fireEvent, render, screen } from '@testing-library/preact';
import { createRef } from 'preact';
import { Input } from './Input';
import styles from './Input.module.css';

describe('Input', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders with a placeholder', () => {
        render(<Input placeholder="Enter your name" />);
        expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
    });

    it('renders type=email as a native email input', () => {
        render(<Input type="email" placeholder="Email" />);
        const input = screen.getByPlaceholderText('Email');
        expect(input).toHaveAttribute('type', 'email');
    });

    it('renders type=password as a native password input', () => {
        render(<Input type="password" placeholder="Password" />);
        expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password');
    });

    it('renders type=number as a native number input', () => {
        render(<Input type="number" placeholder="Amount" />);
        expect(screen.getByPlaceholderText('Amount')).toHaveAttribute('type', 'number');
    });

    it('renders type=url as a native url input', () => {
        render(<Input type="url" placeholder="Website" />);
        expect(screen.getByPlaceholderText('Website')).toHaveAttribute('type', 'url');
    });

    it('renders money type as text with inputMode="decimal"', () => {
        const { container } = render(<Input type="money" prefix="$" placeholder="Price" />);
        const input = screen.getByPlaceholderText('Price');
        expect(input).toHaveAttribute('type', 'text');
        expect(input).toHaveAttribute('inputmode', 'decimal');
        expect(container.firstChild).toHaveTextContent('$');
    });

    it('renders phone type as text with inputMode="tel"', () => {
        render(<Input type="phone" placeholder="Phone" />);
        const input = screen.getByPlaceholderText('Phone');
        expect(input).toHaveAttribute('type', 'text');
        expect(input).toHaveAttribute('inputmode', 'tel');
    });

    it('applies the disabled attribute', () => {
        render(<Input placeholder="Disabled" disabled />);
        expect(screen.getByPlaceholderText('Disabled')).toBeDisabled();
    });

    it('applies the readOnly attribute', () => {
        render(<Input placeholder="ReadOnly" readOnly />);
        expect(screen.getByPlaceholderText('ReadOnly')).toHaveAttribute('readonly');
    });

    it('adds aria-invalid and error class when error is true', () => {
        const { container } = render(<Input placeholder="Err" error />);
        const input = screen.getByPlaceholderText('Err');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(container.firstChild).toHaveClass(styles.error);
    });

    it('does not set aria-invalid when error is false', () => {
        render(<Input placeholder="Ok" />);
        expect(screen.getByPlaceholderText('Ok')).not.toHaveAttribute('aria-invalid');
    });

    it('fires onChange with the new value', () => {
        const onChange = vi.fn();
        render(<Input placeholder="Type" onChange={onChange} />);
        const input = screen.getByPlaceholderText('Type');
        fireEvent.input(input, { target: { value: 'hello' } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('hello');
    });

    it('does not fire onChange when disabled', () => {
        const onChange = vi.fn();
        render(<Input placeholder="Type" disabled onChange={onChange} />);
        fireEvent.input(screen.getByPlaceholderText('Type'), { target: { value: 'x' } });
        expect(onChange).not.toHaveBeenCalled();
    });

    it('reflects a controlled value', () => {
        render(<Input value="fixed" placeholder="Ctrl" onChange={() => {}} />);
        expect(screen.getByPlaceholderText('Ctrl')).toHaveValue('fixed');
    });

    it('uses defaultValue for uncontrolled usage', () => {
        render(<Input defaultValue="initial" placeholder="Unc" />);
        expect(screen.getByPlaceholderText('Unc')).toHaveValue('initial');
    });

    it('forwards ref to the native input element', () => {
        const ref = createRef<HTMLInputElement>();
        render(<Input ref={ref} placeholder="Ref" />);
        expect(ref.current).toBeInstanceOf(HTMLInputElement);
        expect(ref.current).toBe(screen.getByPlaceholderText('Ref'));
    });

    it('applies size classes (sm, md, lg)', () => {
        const { container: cSm } = render(<Input placeholder="sm" size="sm" />);
        expect(cSm.firstChild).toHaveClass(styles.sm);

        const { container: cMd } = render(<Input placeholder="md" size="md" />);
        expect(cMd.firstChild).toHaveClass(styles.md);

        const { container: cLg } = render(<Input placeholder="lg" size="lg" />);
        expect(cLg.firstChild).toHaveClass(styles.lg);
    });

    it('renders a leading icon when provided', () => {
        const icon = <span data-testid="lead-icon" />;
        const { container } = render(<Input placeholder="Icon" icon={icon} />);
        expect(screen.getByTestId('lead-icon')).toBeInTheDocument();
        expect(container.firstChild).toHaveClass(styles.hasIcon);
    });

    it('falls back aria-label to placeholder when aria-label is omitted', () => {
        render(<Input placeholder="Fallback label" />);
        expect(screen.getByLabelText('Fallback label')).toBeInTheDocument();
    });

    it('uses an explicit aria-label over placeholder', () => {
        render(<Input placeholder="Placeholder" aria-label="Explicit label" />);
        expect(screen.getByLabelText('Explicit label')).toBeInTheDocument();
    });

    it('applies a custom className alongside the base classes', () => {
        const { container } = render(<Input placeholder="Custom" className="my-extra" />);
        expect(container.firstChild).toHaveClass('my-extra');
        expect(container.firstChild).toHaveClass(styles.md);
    });
});
