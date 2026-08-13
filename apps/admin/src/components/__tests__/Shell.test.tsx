import { fireEvent, render, screen } from '@testing-library/preact';
import { Shell } from '../Shell';
import styles from '../Shell.module.css';
import { commandPaletteOpen, mobileMenuOpen, sidebarCollapsed } from '../../store/app';

// Mock Sidebar/Topbar (owned by other agents) to isolate Shell layout tests
// and avoid kit forwardRef resolution issues in jsdom.
vi.mock('../Sidebar', () => ({
    Sidebar: () => <aside data-testid="sidebar-stub" className="sidebar" />,
}));
vi.mock('../Topbar', () => ({
    Topbar: () => <header data-testid="topbar-stub" className="topbar" />,
}));

// Mock the kit Breadcrumb to avoid forwardRef resolution in jsdom.
vi.mock('@bienenhaus/ui', () => ({
    Breadcrumb: ({ items }: { items: { label: string; href?: string }[] }) => (
        <nav aria-label="breadcrumb" data-testid="breadcrumb-stub">
            <ol>
                {items.map((item, i) => {
                    const isLast = i === items.length - 1;
                    return isLast ? (
                        <span key={i} aria-current="page">
                            {item.label}
                        </span>
                    ) : item.href !== undefined ? (
                        <a key={i} href={item.href}>
                            {item.label}
                        </a>
                    ) : (
                        <span key={i}>{item.label}</span>
                    );
                })}
            </ol>
        </nav>
    ),
}));

// Stable setLocation spy so we can assert navigation calls from command items.
const setLocation = vi.fn();
vi.mock('wouter-preact', () => ({
    useLocation: () => ['/', setLocation],
    useRoute: () => [null, {}],
    Link: ({ children, href }: { children: preact.ComponentChild; href: string }) => (
        <a href={href}>{children}</a>
    ),
    Switch: ({ children }: { children: preact.ComponentChild }) => <>{children}</>,
    Route: ({
        component: Component,
        ...props
    }: {
        component: preact.ComponentType<Record<string, unknown>>;
        [key: string]: unknown;
    }) => <Component {...props} />,
}));

describe('Shell', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mobileMenuOpen.value = false;
        sidebarCollapsed.value = false;
        commandPaletteOpen.value = false;
    });

    describe('layout structure', () => {
        it('renders the shell root with skip-link, scrim, shell-main and main content', () => {
            render(
                <Shell>
                    <p>contenido de prueba</p>
                </Shell>,
            );

            expect(screen.getByTestId('shell')).toBeInTheDocument();
            expect(screen.getByText('Saltar al contenido')).toBeInTheDocument();
            expect(screen.getByTestId('sidebar-scrim')).toBeInTheDocument();
            expect(screen.getByTestId('shell-main')).toBeInTheDocument();
            expect(document.getElementById('main-content')).toBeInTheDocument();
            expect(screen.getByTestId('shell-content')).toBeInTheDocument();
            expect(screen.getByText('contenido de prueba')).toBeInTheDocument();
        });

        it('renders Sidebar and Topbar stubs in the correct positions', () => {
            render(
                <Shell>
                    <p>contenido</p>
                </Shell>,
            );
            const sidebar = screen.getByTestId('sidebar-stub');
            const topbar = screen.getByTestId('topbar-stub');
            expect(sidebar).toBeInTheDocument();
            expect(topbar).toBeInTheDocument();
            // Sidebar is a direct child of .shell, before the scrim
            expect(sidebar.parentElement).toBe(screen.getByTestId('shell'));
            // Topbar is inside .shell-main
            expect(topbar.parentElement).toBe(screen.getByTestId('shell-main'));
        });

        it('skip-link targets #main-content', () => {
            render(
                <Shell>
                    <p>contenido</p>
                </Shell>,
            );
            const skip = screen.getByText('Saltar al contenido');
            expect(skip.getAttribute('href')).toBe('#main-content');
        });

        it('main content has id main-content for skip-link target', () => {
            render(
                <Shell>
                    <p>contenido</p>
                </Shell>,
            );
            const main = document.getElementById('main-content');
            expect(main).not.toBeNull();
            expect(main?.tagName).toBe('MAIN');
        });

        it('renders the breadcrumb row inside shell-main', () => {
            render(
                <Shell>
                    <p>contenido</p>
                </Shell>,
            );
            expect(screen.getByTestId('breadcrumb-row')).toBeInTheDocument();
        });
    });

    describe('sidebar scrim', () => {
        it('is not visible when mobileMenuOpen is false', () => {
            render(
                <Shell>
                    <p>contenido</p>
                </Shell>,
            );
            const scrim = screen.getByTestId('sidebar-scrim');
            expect(scrim.classList.contains(styles['is-visible'])).toBe(false);
            expect(scrim.getAttribute('aria-hidden')).toBe('true');
        });

        it('becomes visible when mobileMenuOpen is true', () => {
            mobileMenuOpen.value = true;
            render(
                <Shell>
                    <p>contenido</p>
                </Shell>,
            );
            const scrim = screen.getByTestId('sidebar-scrim');
            expect(scrim.classList.contains(styles['is-visible'])).toBe(true);
            expect(scrim.getAttribute('aria-hidden')).toBe('false');
        });

        it('closes the drawer when clicked', () => {
            mobileMenuOpen.value = true;
            render(
                <Shell>
                    <p>contenido</p>
                </Shell>,
            );
            const scrim = screen.getByTestId('sidebar-scrim');
            expect(mobileMenuOpen.value).toBe(true);
            fireEvent.click(scrim);
            expect(mobileMenuOpen.value).toBe(false);
        });
    });

    describe('command palette keyboard', () => {
        it('opens the command palette on Ctrl+K', () => {
            render(
                <Shell>
                    <p>contenido</p>
                </Shell>,
            );
            expect(commandPaletteOpen.value).toBe(false);
            fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
            expect(commandPaletteOpen.value).toBe(true);
        });

        it('opens the command palette on Cmd+K', () => {
            render(
                <Shell>
                    <p>contenido</p>
                </Shell>,
            );
            expect(commandPaletteOpen.value).toBe(false);
            fireEvent.keyDown(document, { key: 'k', metaKey: true });
            expect(commandPaletteOpen.value).toBe(true);
        });

        it('closes the command palette on Escape when palette is open', () => {
            commandPaletteOpen.value = true;
            render(
                <Shell>
                    <p>contenido</p>
                </Shell>,
            );
            expect(commandPaletteOpen.value).toBe(true);
            fireEvent.keyDown(document, { key: 'Escape' });
            expect(commandPaletteOpen.value).toBe(false);
        });

        it('closes the mobile drawer on Escape when palette is closed', () => {
            mobileMenuOpen.value = true;
            render(
                <Shell>
                    <p>contenido</p>
                </Shell>,
            );
            expect(commandPaletteOpen.value).toBe(false);
            expect(mobileMenuOpen.value).toBe(true);
            fireEvent.keyDown(document, { key: 'Escape' });
            expect(mobileMenuOpen.value).toBe(false);
        });

        it('does not close the drawer on Escape when palette is open (palette takes priority)', () => {
            commandPaletteOpen.value = true;
            mobileMenuOpen.value = true;
            render(
                <Shell>
                    <p>contenido</p>
                </Shell>,
            );
            fireEvent.keyDown(document, { key: 'Escape' });
            expect(commandPaletteOpen.value).toBe(false);
            expect(mobileMenuOpen.value).toBe(true);
        });
    });

    describe('command palette rendering', () => {
        it('does not render the command palette overlay when closed', () => {
            render(
                <Shell>
                    <p>contenido</p>
                </Shell>,
            );
            expect(screen.queryByTestId('command-palette-overlay')).not.toBeInTheDocument();
        });

        it('renders the command palette overlay when commandPaletteOpen is true', () => {
            commandPaletteOpen.value = true;
            render(
                <Shell>
                    <p>contenido</p>
                </Shell>,
            );
            expect(screen.getByTestId('command-palette-overlay')).toBeInTheDocument();
        });
    });

    describe('breadcrumb', () => {
        it('renders Inicio as the first crumb on the home route', () => {
            render(
                <Shell>
                    <p>contenido</p>
                </Shell>,
            );
            expect(screen.getByText('Inicio')).toBeInTheDocument();
        });

        it('marks Inicio as the current page on the home route', () => {
            render(
                <Shell>
                    <p>contenido</p>
                </Shell>,
            );
            const current = screen.getByText('Inicio');
            expect(current.getAttribute('aria-current')).toBe('page');
        });
    });
});
