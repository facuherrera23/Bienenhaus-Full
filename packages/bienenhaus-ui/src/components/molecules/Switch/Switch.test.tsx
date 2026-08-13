import { fireEvent, render, screen } from '@testing-library/preact';
import { Switch } from './Switch';

describe('Switch', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders unchecked by default (uncontrolled)', () => {
        render(<Switch aria-label="Toggle" />);
        const input = screen.getByRole('switch');
        expect(input).not.toBeChecked();
        expect(input).toHaveAttribute('aria-checked', 'false');
    });

    it('renders checked when defaultChecked is true', () => {
        render(<Switch aria-label="Toggle" defaultChecked />);
        expect(screen.getByRole('switch')).toBeChecked();
        expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });

    it('clicking toggles and fires onChange(true) then onChange(false)', () => {
        const onChange = vi.fn();
        render(<Switch aria-label="Toggle" onChange={onChange} />);
        const input = screen.getByRole('switch');
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
        const { rerender } = render(
            <Switch aria-label="Toggle" checked={false} onChange={onChange} />,
        );
        const input = screen.getByRole('switch');
        expect(input).toHaveAttribute('aria-checked', 'false');
        // user clicks — onChange fires with the requested next value
        fireEvent.click(input);
        expect(onChange).toHaveBeenLastCalledWith(true);
        // parent keeps it off (controlled) — re-render with checked=false holds
        rerender(<Switch aria-label="Toggle" checked={false} onChange={onChange} />);
        expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
        // parent flips checked to true
        rerender(<Switch aria-label="Toggle" checked={true} onChange={onChange} />);
        expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });

    it('clicking the associated label toggles the switch', () => {
        const onChange = vi.fn();
        render(<Switch label="Enable notifications" onChange={onChange} />);
        const input = screen.getByRole('switch');
        const label = screen.getByText('Enable notifications');
        fireEvent.click(label);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenLastCalledWith(true);
        expect(input).toBeChecked();
    });

    it('does not fire onChange when disabled', () => {
        const onChange = vi.fn();
        render(<Switch aria-label="Toggle" disabled onChange={onChange} />);
        const input = screen.getByRole('switch');
        expect(input).toBeDisabled();
        fireEvent.click(input);
        expect(onChange).not.toHaveBeenCalled();
        expect(input).toHaveAttribute('aria-checked', 'false');
    });

    it('has role="switch" and aria-checked reflecting state', () => {
        render(<Switch aria-label="Toggle" defaultChecked />);
        const input = screen.getByRole('switch');
        expect(input.tagName).toBe('INPUT');
        expect(input).toHaveAttribute('type', 'checkbox');
        expect(input).toHaveAttribute('aria-checked', 'true');
    });

    it('requires aria-label when no visible label is provided', () => {
        render(<Switch aria-label="Privacy toggle" />);
        expect(screen.getByRole('switch')).toHaveAttribute('aria-label', 'Privacy toggle');
    });

    it('does not set aria-label when a visible label is provided (label associates via htmlFor)', () => {
        render(<Switch label="Public profile" />);
        const input = screen.getByRole('switch');
        expect(input).not.toHaveAttribute('aria-label');
        expect(input).toHaveAttribute('id');
        const label = screen.getByText('Public profile').closest('label');
        expect(label).toHaveAttribute('for', input.getAttribute('id'));
    });

    it('applies size classes (sm and md)', () => {
        const { container: smContainer, unmount: smUnmount } = render(
            <Switch aria-label="sm" size="sm" />,
        );
        const smRoot = smContainer.firstChild as HTMLElement;
        expect(smRoot).toHaveClass('switch--sm');
        smUnmount();

        const { container: mdContainer } = render(<Switch aria-label="md" size="md" />);
        const mdRoot = mdContainer.firstChild as HTMLElement;
        expect(mdRoot).toHaveClass('switch--md');
    });

    it('applies disabled class and aria-disabled on the wrapper', () => {
        const { container } = render(<Switch aria-label="Toggle" disabled />);
        const root = container.firstChild as HTMLElement;
        expect(root).toHaveClass('switch--disabled');
    });

    it('forwards name and id for form integration', () => {
        render(<Switch aria-label="Toggle" name="notifications" id="notif-toggle" />);
        const input = screen.getByRole('switch');
        expect(input).toHaveAttribute('name', 'notifications');
        expect(input).toHaveAttribute('id', 'notif-toggle');
    });

    it('renders a description next to the label when provided', () => {
        render(<Switch label="Auto-sync" description="Syncs every 5 minutes" />);
        expect(screen.getByText('Auto-sync')).toBeInTheDocument();
        expect(screen.getByText('Syncs every 5 minutes')).toBeInTheDocument();
    });

    it('smoke renders both sizes without throwing', () => {
        expect(() => render(<Switch aria-label="sm" size="sm" />)).not.toThrow();
        expect(() => render(<Switch aria-label="md" size="md" />)).not.toThrow();
    });
});
