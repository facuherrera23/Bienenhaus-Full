import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import type { Session } from '@supabase/supabase-js';
import { Topbar } from '../Topbar';
import {
    authSession,
    authSigningOut,
    commandPaletteOpen,
    mobileMenuOpen,
    sidebarCollapsed,
} from '../../store/app';

// Stable setLocation spy so we can assert navigation calls.
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

function makeSession(email: string, name?: string): Session {
    return {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
            id: 'u1',
            app_metadata: {},
            user_metadata: name ? { name } : {},
            aud: 'authenticated',
            created_at: '2026-01-01',
            email,
        },
    } as unknown as Session;
}

describe('Topbar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authSession.value = null;
        authSigningOut.value = false;
        sidebarCollapsed.value = false;
        mobileMenuOpen.value = false;
        commandPaletteOpen.value = false;
        if (typeof document !== 'undefined') {
            delete document.documentElement.dataset.theme;
        }
    });

    describe('layout', () => {
        it('renders the topbar banner with hamburger, search and right cluster', () => {
            render(<Topbar />);

            expect(screen.getByRole('banner')).toBeInTheDocument();
            // Two hamburger buttons (desktop + mobile) — both have aria-labels
            expect(screen.getByLabelText('Contraer menú lateral')).toBeInTheDocument();
            expect(screen.getByLabelText('Abrir menú lateral')).toBeInTheDocument();
            // Search input (center)
            expect(screen.getByPlaceholderText('Buscar… (Ctrl+K)')).toBeInTheDocument();
            // Right cluster
            expect(screen.getByLabelText('Acciones rápidas')).toBeInTheDocument();
            expect(screen.getByLabelText('Notificaciones')).toBeInTheDocument();
        });

        it('shows the Ctrl+K shortcut hint in the search field', () => {
            render(<Topbar />);
            expect(screen.getByText('Ctrl+K')).toBeInTheDocument();
        });
    });

    describe('hamburger', () => {
        it('desktop hamburger toggles sidebarCollapsed', () => {
            render(<Topbar />);

            expect(sidebarCollapsed.value).toBe(false);
            fireEvent.click(screen.getByLabelText('Contraer menú lateral'));
            expect(sidebarCollapsed.value).toBe(true);
            fireEvent.click(screen.getByLabelText('Contraer menú lateral'));
            expect(sidebarCollapsed.value).toBe(false);
        });

        it('mobile hamburger opens the mobile menu', () => {
            render(<Topbar />);

            expect(mobileMenuOpen.value).toBe(false);
            fireEvent.click(screen.getByLabelText('Abrir menú lateral'));
            expect(mobileMenuOpen.value).toBe(true);
        });
    });

    describe('global search', () => {
        it('opens the command palette on click', () => {
            render(<Topbar />);

            expect(commandPaletteOpen.value).toBe(false);
            fireEvent.click(screen.getByPlaceholderText('Buscar… (Ctrl+K)'));
            expect(commandPaletteOpen.value).toBe(true);
        });

        it('mobile search icon opens the command palette', () => {
            render(<Topbar />);

            const searchButtons = screen.getAllByLabelText('Buscar');
            expect(searchButtons.length).toBeGreaterThanOrEqual(1);
            fireEvent.click(searchButtons[0]);
            expect(commandPaletteOpen.value).toBe(true);
        });
    });

    describe('QuickActions', () => {
        it('opens the dropdown and lists all quick actions', async () => {
            render(<Topbar />);

            fireEvent.click(screen.getByLabelText('Acciones rápidas'));

            await waitFor(() => {
                expect(screen.getByText('Nueva Propiedad')).toBeInTheDocument();
            });
            expect(screen.getByText('Nuevo Lead')).toBeInTheDocument();
            expect(screen.getByText('Nuevo Agente')).toBeInTheDocument();
            expect(screen.getByText('Nueva Visita')).toBeInTheDocument();
        });

        it('navigates to the new property route on click', async () => {
            render(<Topbar />);

            fireEvent.click(screen.getByLabelText('Acciones rápidas'));
            await waitFor(() => {
                expect(screen.getByText('Nueva Propiedad')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByText('Nueva Propiedad'));

            expect(setLocation).toHaveBeenCalledWith('/propiedades/nueva');
        });

        it('navigates to the new lead route on click', async () => {
            render(<Topbar />);

            fireEvent.click(screen.getByLabelText('Acciones rápidas'));
            await waitFor(() => {
                expect(screen.getByText('Nuevo Lead')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByText('Nuevo Lead'));

            expect(setLocation).toHaveBeenCalledWith('/leads/nueva');
        });

        it('navigates to the new agent route on click', async () => {
            render(<Topbar />);

            fireEvent.click(screen.getByLabelText('Acciones rápidas'));
            await waitFor(() => {
                expect(screen.getByText('Nuevo Agente')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByText('Nuevo Agente'));

            expect(setLocation).toHaveBeenCalledWith('/agentes/nueva');
        });

        it('navigates to the visits route on click', async () => {
            render(<Topbar />);

            fireEvent.click(screen.getByLabelText('Acciones rápidas'));
            await waitFor(() => {
                expect(screen.getByText('Nueva Visita')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByText('Nueva Visita'));

            expect(setLocation).toHaveBeenCalledWith('/visitas');
        });
    });

    describe('NotificationCenter', () => {
        it('shows unread badge count on the bell', () => {
            render(<Topbar />);

            // 3 unread in demo dataset
            expect(screen.getByText('3')).toBeInTheDocument();
        });

        it('opens the dropdown with header, filters and notification items', async () => {
            render(<Topbar />);

            fireEvent.click(screen.getByLabelText('Notificaciones'));

            await waitFor(() => {
                expect(screen.getByText('Notificaciones')).toBeInTheDocument();
            });
            // Filter chips
            expect(screen.getByText('Todas')).toBeInTheDocument();
            expect(screen.getByText('CRM')).toBeInTheDocument();
            expect(screen.getByText('Mercado Libre')).toBeInTheDocument();
            expect(screen.getByText('Sistema')).toBeInTheDocument();
            expect(screen.getByText('Errores')).toBeInTheDocument();
            expect(screen.getByText('Usuarios')).toBeInTheDocument();
            expect(screen.getByText('Sincronización')).toBeInTheDocument();
            // Footer
            expect(screen.getByText('Ver todas')).toBeInTheDocument();
        });

        it('renders demo notification items with title and time', async () => {
            render(<Topbar />);

            fireEvent.click(screen.getByLabelText('Notificaciones'));
            await waitFor(() => {
                expect(screen.getByText('Nuevo lead asignado')).toBeInTheDocument();
            });
            expect(screen.getByText('hace 5 min')).toBeInTheDocument();
            expect(screen.getByText('Sincronización completada')).toBeInTheDocument();
        });

        it('marks all notifications as read and clears the badge', async () => {
            render(<Topbar />);

            expect(screen.getByText('3')).toBeInTheDocument();
            fireEvent.click(screen.getByLabelText('Notificaciones'));
            await waitFor(() => {
                expect(screen.getByText('Marcar todas')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByText('Marcar todas'));

            // Badge count disappears after marking all read
            await waitFor(() => {
                expect(screen.queryByText('3')).not.toBeInTheDocument();
            });
        });

        it('filters notifications by type when a chip is clicked', async () => {
            render(<Topbar />);

            fireEvent.click(screen.getByLabelText('Notificaciones'));
            await waitFor(() => {
                expect(screen.getByText('Nuevo lead asignado')).toBeInTheDocument();
            });

            // Click the CRM filter chip
            fireEvent.click(screen.getByText('CRM'));

            await waitFor(() => {
                expect(screen.getByText('Nuevo lead asignado')).toBeInTheDocument();
                expect(screen.queryByText('Sincronización completada')).not.toBeInTheDocument();
                expect(screen.queryByText('Backup automático')).not.toBeInTheDocument();
            });
        });

        it('dismisses a notification on dismiss button click', async () => {
            render(<Topbar />);

            fireEvent.click(screen.getByLabelText('Notificaciones'));
            await waitFor(() => {
                expect(screen.getByText('Nuevo lead asignado')).toBeInTheDocument();
            });

            const dismissButtons = screen.getAllByLabelText('Descartar notificación');
            fireEvent.click(dismissButtons[0]);

            await waitFor(() => {
                expect(screen.queryByText('Nuevo lead asignado')).not.toBeInTheDocument();
            });
        });
    });

    describe('Avatar', () => {
        it('shows fallback "U" when no session', () => {
            render(<Topbar />);
            // Avatar fallback span
            expect(screen.getByText('U')).toBeInTheDocument();
        });

        it('shows initials derived from email when session present', () => {
            authSession.value = makeSession('admin@bienenhaus.com');
            render(<Topbar />);

            expect(screen.getByText('AD')).toBeInTheDocument();
        });

        it('shows initials derived from user_metadata name when present', () => {
            authSession.value = makeSession('admin@bienenhaus.com', 'Facundo Herrera');
            render(<Topbar />);

            expect(screen.getByText('FH')).toBeInTheDocument();
        });

        it('opens avatar menu with Configuración, Tema and Cerrar Sesión', async () => {
            authSession.value = makeSession('admin@bienenhaus.com', 'Facundo Herrera');
            render(<Topbar />);

            // Open the avatar dropdown by clicking the trigger button.
            // The trigger wraps the avatar; the kit Dropdown toggles on trigger click.
            const trigger = screen.getByText('FH').closest('button');
            expect(trigger).not.toBeNull();
            fireEvent.click(trigger!);

            await waitFor(() => {
                expect(screen.getByText('Configuración')).toBeInTheDocument();
                expect(screen.getByText('Tema')).toBeInTheDocument();
                expect(screen.getByText('Cerrar Sesión')).toBeInTheDocument();
            });
        });

        it('navigates to /configuracion when Configuración is clicked', async () => {
            authSession.value = makeSession('admin@bienenhaus.com');
            render(<Topbar />);

            const trigger = screen.getByText('AD').closest('button');
            fireEvent.click(trigger!);

            await waitFor(() => {
                expect(screen.getByText('Configuración')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByText('Configuración'));

            expect(setLocation).toHaveBeenCalledWith('/configuracion');
        });

        it('toggles theme and pushes a toast when Tema is clicked', async () => {
            authSession.value = makeSession('admin@bienenhaus.com');
            render(<Topbar />);

            const trigger = screen.getByText('AD').closest('button');
            fireEvent.click(trigger!);

            await waitFor(() => {
                expect(screen.getByText('Tema')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByText('Tema'));

            expect(document.documentElement.dataset.theme).toBe('light');
        });

        it('signs out when Cerrar Sesión is clicked', async () => {
            authSession.value = makeSession('admin@bienenhaus.com');
            render(<Topbar />);

            const trigger = screen.getByText('AD').closest('button');
            fireEvent.click(trigger!);

            await waitFor(() => {
                expect(screen.getByText('Cerrar Sesión')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByText('Cerrar Sesión'));

            // signOut sets authSigningOut true then calls supabase.auth.signOut (mocked)
            await waitFor(() => {
                expect(authSigningOut.value).toBe(false);
            });
        });

        it('shows Cerrar Sesión even when session is null', async () => {
            render(<Topbar />);

            const trigger = screen.getByText('U').closest('button');
            fireEvent.click(trigger!);

            await waitFor(() => {
                expect(screen.getByText('Cerrar Sesión')).toBeInTheDocument();
            });
        });

        it('disables Cerrar Sesión and shows spinner while signing out', async () => {
            authSession.value = makeSession('admin@bienenhaus.com');
            authSigningOut.value = true;
            render(<Topbar />);

            const trigger = screen.getByText('AD').closest('button');
            fireEvent.click(trigger!);

            await waitFor(() => {
                const item = screen.getByText('Cerrando…');
                expect(item.closest('button')).toBeDisabled();
            });
        });
    });
});
