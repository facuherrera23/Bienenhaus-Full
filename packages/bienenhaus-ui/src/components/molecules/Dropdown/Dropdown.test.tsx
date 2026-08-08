import { render, screen, fireEvent, act } from '@testing-library/preact';
import { Dropdown, type DropdownItem } from './Dropdown';

const TestIcon = () => (
  <svg data-testid="test-icon" viewBox="0 0 24 24" width="16" height="16">
    <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" />
  </svg>
);

const baseItems: DropdownItem[] = [
  { id: 'edit', label: 'Edit', onSelect: vi.fn() },
  { id: 'duplicate', label: 'Duplicate', onSelect: vi.fn() },
  { id: 'delete', label: 'Delete', danger: true, onSelect: vi.fn() },
  { id: 'archive', label: 'Archive', disabled: true, onSelect: vi.fn() },
];

describe('Dropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the trigger with aria-haspopup="menu"', () => {
    render(<Dropdown trigger="Actions" items={baseItems} label="Menu" />);
    const trigger = screen.getByRole('button', { name: /Actions/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('menu is hidden by default and aria-expanded is false', () => {
    render(<Dropdown trigger="Actions" items={baseItems} label="Menu" />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  });

  it('clicking the trigger opens the menu (aria-expanded true) with role="menu" and aria-label', () => {
    render(<Dropdown trigger="Actions" items={baseItems} label="Menu" />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menu')).toHaveAttribute('aria-label', 'Menu');
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('clicking the trigger again closes the menu', () => {
    render(<Dropdown trigger="Actions" items={baseItems} label="Menu" />);
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('renders each non-divider item with role="menuitem"', () => {
    render(<Dropdown trigger="Actions" items={baseItems} label="Menu" />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getAllByRole('menuitem')).toHaveLength(4);
  });

  it('clicking an item fires its onSelect and closes the menu', () => {
    render(<Dropdown trigger="Actions" items={baseItems} label="Menu" />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Duplicate'));
    expect(baseItems[1].onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('disabled item has aria-disabled="true" and is not clickable', () => {
    render(<Dropdown trigger="Actions" items={baseItems} label="Menu" />);
    fireEvent.click(screen.getByRole('button'));
    const archive = screen.getByText('Archive').closest('[role="menuitem"]') as HTMLElement;
    expect(archive).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(archive);
    expect(baseItems[3].onSelect).not.toHaveBeenCalled();
  });

  it('ArrowDown moves focus to the next selectable item', () => {
    render(<Dropdown trigger="Actions" items={baseItems} label="Menu" />);
    fireEvent.click(screen.getByRole('button'));
    const menu = screen.getByRole('menu');
    // On open, focus seeds on the first item ('edit').
    expect(document.activeElement).toBe(screen.getByText('Edit').closest('[role="menuitem"]'));
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(
      screen.getByText('Duplicate').closest('[role="menuitem"]'),
    );
  });

  it('ArrowUp moves focus to the previous selectable item (wraps)', () => {
    render(<Dropdown trigger="Actions" items={baseItems} label="Menu" />);
    fireEvent.click(screen.getByRole('button'));
    const menu = screen.getByRole('menu');
    // From 'edit' (first), ArrowUp wraps to last selectable ('delete').
    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(
      screen.getByText('Delete').closest('[role="menuitem"]'),
    );
  });

  it('Home jumps focus to the first selectable item', () => {
    render(<Dropdown trigger="Actions" items={baseItems} label="Menu" />);
    fireEvent.click(screen.getByRole('button'));
    const menu = screen.getByRole('menu');
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    fireEvent.keyDown(menu, { key: 'Home' });
    expect(document.activeElement).toBe(screen.getByText('Edit').closest('[role="menuitem"]'));
  });

  it('End jumps focus to the last selectable item', () => {
    render(<Dropdown trigger="Actions" items={baseItems} label="Menu" />);
    fireEvent.click(screen.getByRole('button'));
    const menu = screen.getByRole('menu');
    fireEvent.keyDown(menu, { key: 'End' });
    expect(document.activeElement).toBe(screen.getByText('Delete').closest('[role="menuitem"]'));
  });

  it('Enter activates the focused item (fires onSelect + closes)', () => {
    render(<Dropdown trigger="Actions" items={baseItems} label="Menu" />);
    fireEvent.click(screen.getByRole('button'));
    const menu = screen.getByRole('menu');
    // Focus is on 'edit' (first). Enter selects it.
    fireEvent.keyDown(menu, { key: 'Enter' });
    expect(baseItems[0].onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('Space activates the focused item', () => {
    render(<Dropdown trigger="Actions" items={baseItems} label="Menu" />);
    fireEvent.click(screen.getByRole('button'));
    const menu = screen.getByRole('menu');
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    fireEvent.keyDown(menu, { key: ' ' });
    expect(baseItems[1].onSelect).toHaveBeenCalledTimes(1);
  });

  it('Escape closes the menu and returns focus to the trigger', () => {
    render(<Dropdown trigger="Actions" items={baseItems} label="Menu" />);
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it('Tab closes the menu', () => {
    render(<Dropdown trigger="Actions" items={baseItems} label="Menu" />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Tab' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('clicking outside the dropdown closes the menu', () => {
    render(
      <div>
        <span data-testid="outside">Outside</span>
        <Dropdown trigger="Actions" items={baseItems} label="Menu" />
      </div>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('align="start" (default) applies the start alignment class to the root', () => {
    const { container } = render(
      <Dropdown trigger="Actions" items={baseItems} label="Menu" />,
    );
    expect((container.firstChild as HTMLElement).className).toMatch(/alignStart/);
  });

  it('align="end" applies the end alignment class to the root', () => {
    const { container } = render(
      <Dropdown trigger="Actions" items={baseItems} label="Menu" align="end" />,
    );
    expect((container.firstChild as HTMLElement).className).toMatch(/alignEnd/);
  });

  it('divider entry renders role="separator" and is excluded from menuitems', () => {
    const itemsWithDivider: DropdownItem[] = [
      { id: 'edit', label: 'Edit', onSelect: vi.fn() },
      { id: 'sep1', label: '', divider: true },
      { id: 'delete', label: 'Delete', danger: true, onSelect: vi.fn() },
    ];
    render(<Dropdown trigger="Actions" items={itemsWithDivider} label="Menu" />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('separator')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
  });

  it('controlled mode: open + onOpenChange drive the menu', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Dropdown
        trigger="Actions"
        items={baseItems}
        label="Menu"
        open={false}
        onOpenChange={onOpenChange}
      />,
    );
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    rerender(
      <Dropdown
        trigger="Actions"
        items={baseItems}
        label="Menu"
        open={true}
        onOpenChange={onOpenChange}
      />,
    );
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('defaultOpen opens the menu on initial render (uncontrolled)', () => {
    render(<Dropdown trigger="Actions" items={baseItems} label="Menu" defaultOpen />);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders an item icon when provided', () => {
    const itemsWithIcon: DropdownItem[] = [
      { id: 'edit', label: 'Edit', icon: <TestIcon />, onSelect: vi.fn() },
    ];
    render(<Dropdown trigger="Actions" items={itemsWithIcon} label="Menu" />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('danger item has the danger class', () => {
    render(<Dropdown trigger="Actions" items={baseItems} label="Menu" />);
    fireEvent.click(screen.getByRole('button'));
    const deleteItem = screen.getByText('Delete').closest('[role="menuitem"]') as HTMLElement;
    expect(deleteItem.className).toMatch(/itemDanger/);
  });

  it('disabled item has the disabled class', () => {
    render(<Dropdown trigger="Actions" items={baseItems} label="Menu" />);
    fireEvent.click(screen.getByRole('button'));
    const archive = screen.getByText('Archive').closest('[role="menuitem"]') as HTMLElement;
    expect(archive.className).toMatch(/itemDisabled/);
  });

  it('disabled items are skipped by keyboard navigation', () => {
    // Order: edit(0), duplicate(1), delete(2), archive(3 disabled)
    // Selectable: [0,1,2]. From edit, 3x ArrowDown wraps: 0->1->2->0.
    render(<Dropdown trigger="Actions" items={baseItems} label="Menu" />);
    fireEvent.click(screen.getByRole('button'));
    const menu = screen.getByRole('menu');
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByText('Edit').closest('[role="menuitem"]'));
  });

  it('forwards the ref to the root element', () => {
    const ref = { current: null as HTMLDivElement | null };
    act(() => {
      render(<Dropdown ref={ref} trigger="Actions" items={baseItems} label="Menu" />);
    });
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('renders children verbatim inside the menu when provided', () => {
    render(
      <Dropdown trigger="Actions" label="Menu">
        <li role="menuitem" data-testid="custom-item">
          Custom
        </li>
      </Dropdown>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('custom-item')).toBeInTheDocument();
  });

  it('applies a custom className to the root wrapper', () => {
    const { container } = render(
      <Dropdown trigger="Actions" items={baseItems} label="Menu" className="my-custom-dropdown" />,
    );
    expect(container.firstChild).toHaveClass('my-custom-dropdown');
  });

  it('renders a chevron icon inside the trigger', () => {
    render(<Dropdown trigger="Actions" items={baseItems} label="Menu" />);
    const trigger = screen.getByRole('button');
    const chevron = trigger.querySelector('.chevron');
    expect(chevron).toBeInTheDocument();
    expect(chevron?.tagName).toBe('svg');
  });

  it('applies the open class to the root when the menu is open', () => {
    const { container } = render(<Dropdown trigger="Actions" items={baseItems} label="Menu" />);
    expect(container.firstChild).not.toHaveClass('open');
    fireEvent.click(screen.getByRole('button'));
    expect(container.firstChild).toHaveClass('open');
  });

  it('smoke renders with an empty items list without throwing', () => {
    expect(() =>
      render(<Dropdown trigger="Actions" items={[]} label="Menu" />),
    ).not.toThrow();
  });
});
