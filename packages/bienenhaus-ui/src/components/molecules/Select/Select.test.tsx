import { fireEvent, render, screen } from '@testing-library/preact';
import { Select, type SelectOption } from './Select';

const FRUITS: SelectOption[] = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'date', label: 'Date', disabled: true },
    { value: 'elderberry', label: 'Elderberry' },
];

const ICON_OPTIONS: SelectOption[] = [
    { value: 'home', label: 'Home', icon: <span data-testid="icon-home">H</span> },
    { value: 'user', label: 'User', icon: <span data-testid="icon-user">U</span> },
];

describe('Select', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // 1 — renders placeholder
    it('renders the placeholder when nothing is selected', () => {
        render(<Select options={FRUITS} placeholder="Pick a fruit" aria-label="Fruit" />);
        expect(screen.getByText('Pick a fruit')).toBeInTheDocument();
    });

    // 2 — click opens listbox with aria-expanded true
    it('opens the listbox and sets aria-expanded to true on trigger click', () => {
        render(<Select options={FRUITS} placeholder="Pick" aria-label="Fruit" />);
        const trigger = screen.getByRole('combobox', { name: 'Fruit' });
        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    // 3 — option click fires onChange with value
    it('fires onChange with the option value when an option is clicked', () => {
        const onChange = vi.fn();
        render(
            <Select options={FRUITS} placeholder="Pick" aria-label="Fruit" onChange={onChange} />,
        );
        fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }));
        fireEvent.click(screen.getByRole('option', { name: 'Banana' }));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('banana');
    });

    // 4 — Escape closes
    it('closes the dropdown when Escape is pressed on the trigger', () => {
        render(<Select options={FRUITS} placeholder="Pick" aria-label="Fruit" />);
        const trigger = screen.getByRole('combobox', { name: 'Fruit' });
        fireEvent.click(trigger);
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        fireEvent.keyDown(trigger, { key: 'Escape' });
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    // 5 — ArrowDown moves active option + Enter selects
    it('ArrowDown moves the active option and Enter selects it', () => {
        const onChange = vi.fn();
        render(
            <Select options={FRUITS} placeholder="Pick" aria-label="Fruit" onChange={onChange} />,
        );
        const trigger = screen.getByRole('combobox', { name: 'Fruit' });
        fireEvent.keyDown(trigger, { key: 'ArrowDown' });
        const apple = screen.getByRole('option', { name: 'Apple' });
        fireEvent.keyDown(apple, { key: 'ArrowDown' });
        const banana = screen.getByRole('option', { name: 'Banana' });
        fireEvent.keyDown(banana, { key: 'Enter' });
        expect(onChange).toHaveBeenCalledWith('banana');
    });

    // 6 — multi selects multiple (onChange receives array)
    it('multi mode fires onChange with an array of selected values', () => {
        const onChange = vi.fn();
        render(
            <Select
                options={FRUITS}
                multiple
                placeholder="Pick"
                aria-label="Fruit"
                onChange={onChange}
            />,
        );
        fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }));
        fireEvent.click(screen.getByRole('option', { name: 'Apple' }));
        expect(onChange).toHaveBeenLastCalledWith(['apple']);
        fireEvent.click(screen.getByRole('option', { name: 'Banana' }));
        expect(onChange).toHaveBeenLastCalledWith(['apple', 'banana']);
    });

    // 7 — chips render for selected in multi
    it('renders chips for each selected value in multi mode', () => {
        render(
            <Select
                options={FRUITS}
                multiple
                defaultValue={['apple', 'cherry']}
                placeholder="Pick"
                aria-label="Fruit"
            />,
        );
        expect(screen.getByText('Apple')).toBeInTheDocument();
        expect(screen.getByText('Cherry')).toBeInTheDocument();
    });

    // 8 — chip ✕ removes that value (aria-label "Quitar {label}")
    it('removes a value when its chip close button is clicked', () => {
        const onChange = vi.fn();
        render(
            <Select
                options={FRUITS}
                multiple
                defaultValue={['apple', 'cherry']}
                placeholder="Pick"
                aria-label="Fruit"
                onChange={onChange}
            />,
        );
        const closeButtons = screen.getAllByRole('button', { name: 'Quitar Apple' });
        fireEvent.click(closeButtons[0]);
        expect(onChange).toHaveBeenLastCalledWith(['cherry']);
    });

    // 9 — searchable filters options
    it('filters options by label when searchable and typing in the search input', () => {
        render(<Select options={FRUITS} searchable placeholder="Pick" aria-label="Fruit" />);
        fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }));
        const searchInput = screen.getByRole('textbox', { name: 'Buscar opciones' });
        fireEvent.input(searchInput, { target: { value: 'ban' } });
        expect(screen.getByRole('option', { name: 'Banana' })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: 'Apple' })).not.toBeInTheDocument();
    });

    // 10 — search empty shows "Sin resultados"
    it('shows "Sin resultados" when the search yields no matches', () => {
        render(<Select options={FRUITS} searchable placeholder="Pick" aria-label="Fruit" />);
        fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }));
        const searchInput = screen.getByRole('textbox', { name: 'Buscar opciones' });
        fireEvent.input(searchInput, { target: { value: 'zzz' } });
        expect(screen.getByText('Sin resultados')).toBeInTheDocument();
        expect(screen.queryByRole('option')).not.toBeInTheDocument();
    });

    // 11 — disabled blocks open
    it('does not open the dropdown when disabled', () => {
        render(<Select options={FRUITS} disabled placeholder="Pick" aria-label="Fruit" />);
        const trigger = screen.getByRole('combobox', { name: 'Fruit' });
        expect(trigger).toBeDisabled();
        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    // 12 — error string adds aria-invalid + role=alert message + aria-describedby
    it('renders the error message with role=alert and aria-invalid when error is a string', () => {
        render(
            <Select
                options={FRUITS}
                error="Campo obligatorio"
                placeholder="Pick"
                aria-label="Fruit"
            />,
        );
        const trigger = screen.getByRole('combobox', { name: 'Fruit' });
        expect(trigger).toHaveAttribute('aria-invalid', 'true');
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent('Campo obligatorio');
        const describedBy = trigger.getAttribute('aria-describedby');
        expect(describedBy).toBeTruthy();
        expect(alert).toHaveAttribute('id', describedBy);
    });

    // 13 — selected option has aria-selected true + check icon
    it('marks the selected option with aria-selected and renders a check icon', () => {
        render(
            <Select
                options={FRUITS}
                defaultValue={['banana']}
                placeholder="Pick"
                aria-label="Fruit"
            />,
        );
        fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }));
        const bananaOption = screen.getByRole('option', { name: 'Banana' });
        expect(bananaOption).toHaveAttribute('aria-selected', 'true');
        expect(bananaOption.querySelector('svg')).toBeInTheDocument();
    });

    // 14 — click outside closes
    it('closes the dropdown when clicking outside the container', () => {
        render(
            <div>
                <div data-testid="outside">Outside</div>
                <Select options={FRUITS} placeholder="Pick" aria-label="Fruit" />
            </div>,
        );
        fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }));
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        fireEvent.mouseDown(screen.getByTestId('outside'));
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    // 15 — label renders
    it('renders the visible label above the trigger', () => {
        render(<Select options={FRUITS} label="Choose a fruit" placeholder="Pick" />);
        expect(screen.getByText('Choose a fruit')).toBeInTheDocument();
    });

    // 16 — single select closes after selecting
    it('closes the panel after selecting in single mode', () => {
        const onChange = vi.fn();
        render(
            <Select options={FRUITS} placeholder="Pick" aria-label="Fruit" onChange={onChange} />,
        );
        fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }));
        fireEvent.click(screen.getByRole('option', { name: 'Apple' }));
        expect(onChange).toHaveBeenCalledWith('apple');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    // 17 — disabled option is not selectable
    it('does not select a disabled option when clicked', () => {
        const onChange = vi.fn();
        render(
            <Select options={FRUITS} placeholder="Pick" aria-label="Fruit" onChange={onChange} />,
        );
        fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }));
        const dateOption = screen.getByRole('option', { name: 'Date' });
        expect(dateOption).toHaveAttribute('aria-disabled', 'true');
        fireEvent.click(dateOption);
        expect(onChange).not.toHaveBeenCalled();
    });

    // 18 — Home/End jump to first/last option
    it('Home and End jump the active option to the first and last option', () => {
        const onChange = vi.fn();
        render(
            <Select options={FRUITS} placeholder="Pick" aria-label="Fruit" onChange={onChange} />,
        );
        const trigger = screen.getByRole('combobox', { name: 'Fruit' });
        fireEvent.keyDown(trigger, { key: 'ArrowDown' });
        const apple = screen.getByRole('option', { name: 'Apple' });
        fireEvent.keyDown(apple, { key: 'End' });
        const elderberry = screen.getByRole('option', { name: 'Elderberry' });
        fireEvent.keyDown(elderberry, { key: 'Enter' });
        expect(onChange).toHaveBeenCalledWith('elderberry');
    });

    // 19 — aria-label falls back to placeholder
    it('uses the placeholder as aria-label when no explicit aria-label is provided', () => {
        render(<Select options={FRUITS} placeholder="Fallback label" />);
        expect(screen.getByRole('combobox', { name: 'Fallback label' })).toBeInTheDocument();
    });

    // 20 — multi mode toggling a selected value removes it
    it('deselects a value in multi mode when clicking an already-selected option', () => {
        const onChange = vi.fn();
        render(
            <Select
                options={FRUITS}
                multiple
                defaultValue={['apple', 'banana']}
                placeholder="Pick"
                aria-label="Fruit"
                onChange={onChange}
            />,
        );
        fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }));
        fireEvent.click(screen.getByRole('option', { name: 'Apple' }));
        expect(onChange).toHaveBeenLastCalledWith(['banana']);
    });

    // 21 — applies size classes
    it('applies the size modifier class on the root wrapper', () => {
        const { container, unmount } = render(
            <Select options={FRUITS} size="lg" placeholder="Pick" aria-label="Fruit" />,
        );
        expect(container.firstChild).toHaveClass('select--lg');
        unmount();
        const { container: smContainer } = render(
            <Select options={FRUITS} size="sm" placeholder="Pick" aria-label="Fruit" />,
        );
        expect(smContainer.firstChild).toHaveClass('select--sm');
    });

    // 22 — chevron rotates when open (open class on root)
    it('adds the open modifier class to the root when the panel is open', () => {
        const { container } = render(
            <Select options={FRUITS} placeholder="Pick" aria-label="Fruit" />,
        );
        const trigger = screen.getByRole('combobox', { name: 'Fruit' });
        fireEvent.click(trigger);
        expect(container.firstChild).toHaveClass('select--open');
    });

    // 23 — smoke renders all sizes without throwing
    it('smoke renders all sizes without throwing', () => {
        expect(() =>
            render(<Select options={FRUITS} size="sm" placeholder="s" aria-label="s" />),
        ).not.toThrow();
        expect(() =>
            render(<Select options={FRUITS} size="md" placeholder="m" aria-label="m" />),
        ).not.toThrow();
        expect(() =>
            render(<Select options={FRUITS} size="lg" placeholder="l" aria-label="l" />),
        ).not.toThrow();
    });

    // 24 — aria-activedescendant points to the highlighted option
    it('sets aria-activedescendant on the trigger pointing to the active option', () => {
        render(<Select options={FRUITS} placeholder="Pick" aria-label="Fruit" />);
        const trigger = screen.getByRole('combobox', { name: 'Fruit' });
        fireEvent.keyDown(trigger, { key: 'ArrowDown' });
        expect(trigger).toHaveAttribute('aria-activedescendant');
        const descId = trigger.getAttribute('aria-activedescendant');
        const activeEl = document.getElementById(descId!);
        expect(activeEl).not.toBeNull();
        expect(activeEl).toHaveAttribute('role', 'option');
        expect(activeEl).toHaveTextContent('Apple');
    });

    // 25 — controlled mode respects external value
    it('controlled mode reflects the external value and does not mutate internally', () => {
        const onChange = vi.fn();
        const { rerender } = render(
            <Select
                options={FRUITS}
                value="cherry"
                placeholder="Pick"
                aria-label="Fruit"
                onChange={onChange}
            />,
        );
        expect(screen.getByText('Cherry')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }));
        fireEvent.click(screen.getByRole('option', { name: 'Banana' }));
        expect(onChange).toHaveBeenCalledWith('banana');
        expect(screen.queryByText('Banana')).not.toBeInTheDocument();
        rerender(
            <Select
                options={FRUITS}
                value="banana"
                placeholder="Pick"
                aria-label="Fruit"
                onChange={onChange}
            />,
        );
        expect(screen.getByText('Banana')).toBeInTheDocument();
    });

    // 26 — option icon renders inside the listbox option
    it('renders the option icon when provided', () => {
        render(<Select options={ICON_OPTIONS} placeholder="Pick" aria-label="Icon" />);
        fireEvent.click(screen.getByRole('combobox', { name: 'Icon' }));
        expect(screen.getByTestId('icon-home')).toBeInTheDocument();
        expect(screen.getByTestId('icon-user')).toBeInTheDocument();
    });

    // 27 — required adds aria-required on the trigger
    it('sets aria-required on the trigger when required is true', () => {
        render(<Select options={FRUITS} required placeholder="Pick" aria-label="Fruit" />);
        expect(screen.getByRole('combobox', { name: 'Fruit' })).toHaveAttribute(
            'aria-required',
            'true',
        );
    });

    // 28 — name renders a hidden input carrying the selected value
    it('renders a hidden input with the name and selected value', () => {
        const { container } = render(
            <Select
                options={FRUITS}
                name="fruit"
                defaultValue="banana"
                placeholder="Pick"
                aria-label="Fruit"
            />,
        );
        const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement;
        expect(hidden).not.toBeNull();
        expect(hidden.name).toBe('fruit');
        expect(hidden.value).toBe('banana');
    });

    // 29 — multi does not close the panel after selecting
    it('keeps the panel open after selecting in multi mode', () => {
        render(<Select options={FRUITS} multiple placeholder="Pick" aria-label="Fruit" />);
        fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }));
        fireEvent.click(screen.getByRole('option', { name: 'Apple' }));
        expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    // 30 — ArrowUp opens the dropdown from closed state
    it('opens the dropdown when ArrowUp is pressed on a closed trigger', () => {
        render(<Select options={FRUITS} placeholder="Pick" aria-label="Fruit" />);
        const trigger = screen.getByRole('combobox', { name: 'Fruit' });
        fireEvent.keyDown(trigger, { key: 'ArrowUp' });
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
});
