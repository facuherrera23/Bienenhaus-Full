import { render, screen, fireEvent } from '@testing-library/preact';
import { Tabs, type TabItem } from './Tabs';

const baseTabs: TabItem[] = [
  { id: 'overview', label: 'Overview', content: 'Overview content' },
  { id: 'details', label: 'Details', content: 'Details content' },
  { id: 'reviews', label: 'Reviews', content: 'Reviews content' },
];

describe('Tabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all tabs with role="tab"', () => {
    render(<Tabs tabs={baseTabs} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveTextContent('Overview');
    expect(tabs[1]).toHaveTextContent('Details');
    expect(tabs[2]).toHaveTextContent('Reviews');
  });

  it('renders a tablist with role="tablist"', () => {
    render(<Tabs tabs={baseTabs} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('default active tab has aria-selected="true" (first tab)', () => {
    render(<Tabs tabs={baseTabs} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
  });

  it('respects defaultActiveId to set the initial active tab', () => {
    render(<Tabs tabs={baseTabs} defaultActiveId="details" />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('clicking a tab switches active and fires onChange with the new id', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={baseTabs} onChange={onChange} />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[1]);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('details');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
  });

  it('renders panel content for the active tab and hides inactive panels', () => {
    render(<Tabs tabs={baseTabs} />);
    const overviewPanel = screen.getByText('Overview content').closest('[role="tabpanel"]');
    const detailsPanel = screen.getByText('Details content').closest('[role="tabpanel"]');
    expect(overviewPanel).not.toHaveAttribute('hidden');
    expect(detailsPanel).toHaveAttribute('hidden');
  });

  it('switching tabs reveals the newly active panel content', () => {
    render(<Tabs tabs={baseTabs} />);
    const tabs = screen.getAllByRole('tab');
    const detailsPanel = screen.getByText('Details content').closest('[role="tabpanel"]');
    expect(detailsPanel).toHaveAttribute('hidden');
    fireEvent.click(tabs[1]);
    expect(detailsPanel).not.toHaveAttribute('hidden');
  });

  it('wires aria-controls on tabs and aria-labelledby on panels correctly', () => {
    render(<Tabs tabs={baseTabs} />);
    const tabs = screen.getAllByRole('tab');
    const panels = screen.getAllByRole('tabpanel');
    expect(tabs[0]).toHaveAttribute('id', 'tab-overview');
    expect(tabs[0]).toHaveAttribute('aria-controls', 'panel-overview');
    expect(panels[0]).toHaveAttribute('id', 'panel-overview');
    expect(panels[0]).toHaveAttribute('aria-labelledby', 'tab-overview');
  });

  it('ArrowRight moves focus to the next tab and activates it', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={baseTabs} onChange={onChange} />);
    const tabs = screen.getAllByRole('tab');
    tabs[0].focus();
    expect(document.activeElement).toBe(tabs[0]);
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('details');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(tabs[1]);
  });

  it('ArrowLeft moves focus back to the previous tab and activates it', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={baseTabs} defaultActiveId="reviews" onChange={onChange} />);
    const tabs = screen.getAllByRole('tab');
    tabs[2].focus();
    fireEvent.keyDown(tabs[2], { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenCalledWith('details');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(tabs[1]);
  });

  it('Home jumps to the first tab and End to the last', () => {
    render(<Tabs tabs={baseTabs} defaultActiveId="details" />);
    const tabs = screen.getAllByRole('tab');
    tabs[1].focus();
    fireEvent.keyDown(tabs[1], { key: 'Home' });
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(tabs[0]);
    fireEvent.keyDown(tabs[0], { key: 'End' });
    expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(tabs[2]);
  });

  it('Enter and Space activate the focused tab', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={baseTabs} onChange={onChange} />);
    const tabs = screen.getAllByRole('tab');
    tabs[1].focus();
    fireEvent.keyDown(tabs[1], { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('details');
    tabs[2].focus();
    fireEvent.keyDown(tabs[2], { key: ' ' });
    expect(onChange).toHaveBeenCalledWith('reviews');
  });

  it('disabled tab is skipped by keyboard navigation (ArrowRight jumps over it)', () => {
    const onChange = vi.fn();
    const tabsWithDisabled: TabItem[] = [
      { id: 'a', label: 'A', content: 'A content' },
      { id: 'b', label: 'B', content: 'B content', disabled: true },
      { id: 'c', label: 'C', content: 'C content' },
    ];
    render(<Tabs tabs={tabsWithDisabled} onChange={onChange} />);
    const tabs = screen.getAllByRole('tab');
    tabs[0].focus();
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
    // should skip disabled 'b' and land on 'c'
    expect(onChange).toHaveBeenCalledWith('c');
    expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(tabs[2]);
  });

  it('disabled tab is not clickable and does not fire onChange', () => {
    const onChange = vi.fn();
    const tabsWithDisabled: TabItem[] = [
      { id: 'a', label: 'A', content: 'A content' },
      { id: 'b', label: 'B', content: 'B content', disabled: true },
    ];
    render(<Tabs tabs={tabsWithDisabled} onChange={onChange} />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[1]);
    expect(onChange).not.toHaveBeenCalled();
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[1]).toBeDisabled();
    expect(tabs[1]).toHaveAttribute('aria-disabled', 'true');
  });

  it('disabled tab has tabindex -1 (not focusable via roving tabindex)', () => {
    const tabsWithDisabled: TabItem[] = [
      { id: 'a', label: 'A', content: 'A content' },
      { id: 'b', label: 'B', content: 'B content', disabled: true },
    ];
    render(<Tabs tabs={tabsWithDisabled} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[1]).toHaveAttribute('tabindex', '-1');
  });

  it('applies the pills variant class on the root', () => {
    const { container } = render(<Tabs tabs={baseTabs} variant="pills" />);
    expect(container.firstChild).toHaveClass('tabs--pills');
  });

  it('applies the underline variant class by default', () => {
    const { container } = render(<Tabs tabs={baseTabs} />);
    expect(container.firstChild).toHaveClass('tabs--underline');
  });

  it('controlled mode respects external activeId and does not change internally on click', () => {
    const onChange = vi.fn();
    const { rerender } = render(<Tabs tabs={baseTabs} activeId="overview" onChange={onChange} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    // user clicks the second tab — onChange fires but parent keeps it on overview
    fireEvent.click(tabs[1]);
    expect(onChange).toHaveBeenLastCalledWith('details');
    rerender(<Tabs tabs={baseTabs} activeId="overview" onChange={onChange} />);
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByRole('tab')[1]).toHaveAttribute('aria-selected', 'false');
    // parent flips to details
    rerender(<Tabs tabs={baseTabs} activeId="details" onChange={onChange} />);
    expect(screen.getAllByRole('tab')[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('renders an icon when provided on a tab', () => {
    const icon = <span data-testid="tab-icon" />;
    const tabsWithIcon: TabItem[] = [
      { id: 'home', label: 'Home', icon, content: 'Home content' },
    ];
    render(<Tabs tabs={tabsWithIcon} />);
    expect(screen.getByTestId('tab-icon')).toBeInTheDocument();
  });

  it('applies a custom className to the root wrapper', () => {
    const { container } = render(<Tabs tabs={baseTabs} className="my-custom-tabs" />);
    expect(container.firstChild).toHaveClass('my-custom-tabs');
  });

  it('roving tabindex: only the active tab has tabindex 0, others -1', () => {
    render(<Tabs tabs={baseTabs} defaultActiveId="details" />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('tabindex', '-1');
    expect(tabs[1]).toHaveAttribute('tabindex', '0');
    expect(tabs[2]).toHaveAttribute('tabindex', '-1');
  });

  it('ArrowRight wraps around from the last tab to the first', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={baseTabs} defaultActiveId="reviews" onChange={onChange} />);
    const tabs = screen.getAllByRole('tab');
    tabs[2].focus();
    fireEvent.keyDown(tabs[2], { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('overview');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(tabs[0]);
  });

  it('smoke renders both variants without throwing', () => {
    expect(() => render(<Tabs tabs={baseTabs} variant="underline" />)).not.toThrow();
    expect(() => render(<Tabs tabs={baseTabs} variant="pills" />)).not.toThrow();
  });
});
