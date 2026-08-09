import { fireEvent, render, screen, within } from '@testing-library/preact';
import type { ReactNode } from 'preact';
import { Sidebar } from '../Sidebar';
import { authUserRole, mobileMenuOpen, sidebarCollapsed } from '../../store/app';

vi.mock('@bienenhaus/ui', () => ({
    Tooltip: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

function getSidebar(): HTMLElement {
    return screen.getByTestId('sidebar');
}

describe('Sidebar', () => {
    beforeEach(() => {
        sidebarCollapsed.value = false;
        mobileMenuOpen.value = false;
        authUserRole.value = 'super_admin';
    });

    it('renderiza el aside del sidebar', () => {
        render(<Sidebar />);
        expect(getSidebar()).toBeInTheDocument();
    });

    it('muestra el logo y wordmark cuando está expandido', () => {
        render(<Sidebar />);
        expect(screen.getByText('BIENENHAUS')).toBeInTheDocument();
        expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('oculta el wordmark cuando está colapsado', () => {
        sidebarCollapsed.value = true;
        render(<Sidebar />);
        expect(screen.queryByText('BIENENHAUS')).not.toBeInTheDocument();
        expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });

    it('aplica la clase is-collapsed cuando sidebarCollapsed es true', () => {
        sidebarCollapsed.value = true;
        render(<Sidebar />);
        expect(getSidebar().className).toContain('is-collapsed');
    });

    it('aplica la clase is-mobile-open cuando mobileMenuOpen es true', () => {
        mobileMenuOpen.value = true;
        render(<Sidebar />);
        expect(getSidebar().className).toContain('is-mobile-open');
    });

    it('renderiza el workspace con Bienenhaus activo', () => {
        render(<Sidebar />);
        expect(screen.getByText('Bienenhaus')).toBeInTheDocument();
        expect(screen.getByText('Producción')).toBeInTheDocument();
    });

    it('renderiza el input de búsqueda cuando está expandido', () => {
        render(<Sidebar />);
        expect(screen.getByPlaceholderText('Buscar…')).toBeInTheDocument();
    });

    it('renderiza el botón de búsqueda cuando está colapsado', () => {
        sidebarCollapsed.value = true;
        render(<Sidebar />);
        expect(screen.getByLabelText('Buscar')).toBeInTheDocument();
        expect(screen.queryByPlaceholderText('Buscar…')).not.toBeInTheDocument();
    });

    it('renderiza todos los items de navegación principales para super_admin', () => {
        render(<Sidebar />);
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Propiedades')).toBeInTheDocument();
        expect(screen.getByText('Leads')).toBeInTheDocument();
        expect(screen.getByText('Agentes')).toBeInTheDocument();
        expect(screen.getByText('Visitas')).toBeInTheDocument();
        expect(screen.getByText('Chat')).toBeInTheDocument();
        expect(screen.getByText('Sitio Web')).toBeInTheDocument();
        expect(screen.getByText('Mercado Libre')).toBeInTheDocument();
        expect(screen.getByText('Newsletter')).toBeInTheDocument();
    });

    it('renderiza la sección Propietarios con sus items', () => {
        render(<Sidebar />);
        expect(screen.getByText('Planes de acción')).toBeInTheDocument();
        expect(screen.getByText('Comunicaciones')).toBeInTheDocument();
        expect(screen.getByText('Reportes')).toBeInTheDocument();
    });

    it('renderiza la sección Administración para super_admin', () => {
        render(<Sidebar />);
        expect(screen.getByText('Auditoría')).toBeInTheDocument();
        expect(screen.getByText('Usuarios')).toBeInTheDocument();
        expect(screen.getByText('Papelera')).toBeInTheDocument();
    });

    it('oculta Usuarios para rol viewer', () => {
        authUserRole.value = 'viewer';
        render(<Sidebar />);
        expect(screen.queryByText('Usuarios')).not.toBeInTheDocument();
    });

    it('oculta Auditoría para rol staff', () => {
        authUserRole.value = 'staff';
        render(<Sidebar />);
        expect(screen.queryByText('Auditoría')).not.toBeInTheDocument();
    });

    it('oculta Sitio Web para rol viewer', () => {
        authUserRole.value = 'viewer';
        render(<Sidebar />);
        expect(screen.queryByText('Sitio Web')).not.toBeInTheDocument();
    });

    it('renderiza Configuración en el footer para super_admin', () => {
        render(<Sidebar />);
        const footer = screen.getByTestId('sidebar-footer');
        expect(footer).toBeInTheDocument();
        expect(within(footer).getByText('Configuración')).toBeInTheDocument();
    });

    it('oculta Configuración para rol viewer', () => {
        authUserRole.value = 'viewer';
        render(<Sidebar />);
        const footer = screen.getByTestId('sidebar-footer');
        expect(within(footer).queryByText('Configuración')).not.toBeInTheDocument();
    });

    it('renderiza la versión en el footer', () => {
        render(<Sidebar />);
        const footer = screen.getByTestId('sidebar-footer');
        expect(within(footer).getByText(/v.*dev/)).toBeInTheDocument();
    });

    it('renderiza los títulos de sección cuando está expandido', () => {
        render(<Sidebar />);
        expect(screen.getByText('Principal')).toBeInTheDocument();
        expect(screen.getByText('Administración')).toBeInTheDocument();
    });

    it('oculta los títulos de sección cuando está colapsado', () => {
        sidebarCollapsed.value = true;
        render(<Sidebar />);
        expect(screen.queryByText('Principal')).not.toBeInTheDocument();
        expect(screen.queryByText('Administración')).not.toBeInTheDocument();
    });

    it('renderiza chevron en items con submenú', () => {
        render(<Sidebar />);
        const propiedadesBtn = screen.getByText('Propiedades').closest('button');
        expect(propiedadesBtn).toBeInTheDocument();
        expect(within(propiedadesBtn!).getByTestId('sidebar-submenu-chevron')).toBeInTheDocument();
    });

    it('expande el submenú al hacer click en el toggle', () => {
        render(<Sidebar />);
        const propiedadesBtn = screen.getByText('Propiedades').closest('button');
        expect(propiedadesBtn?.getAttribute('aria-expanded')).toBe('false');
        fireEvent.click(propiedadesBtn!);
        expect(propiedadesBtn?.getAttribute('aria-expanded')).toBe('true');
    });

    it('renderiza los hijos del submenú cuando está expandido', () => {
        render(<Sidebar />);
        const propiedadesBtn = screen.getByText('Propiedades').closest('button');
        fireEvent.click(propiedadesBtn!);
        expect(screen.getByText('Listado')).toBeInTheDocument();
        expect(screen.getByText('Nueva propiedad')).toBeInTheDocument();
    });

    it('filtra los items de navegación al escribir en la búsqueda', () => {
        render(<Sidebar />);
        const input = screen.getByPlaceholderText('Buscar…');
        fireEvent.input(input, { target: { value: 'propiedad' } });
        expect(screen.getByText('Propiedades')).toBeInTheDocument();
        expect(screen.queryByText('Leads')).not.toBeInTheDocument();
        expect(screen.queryByText('Visitas')).not.toBeInTheDocument();
    });

    it('muestra todos los items cuando la búsqueda está vacía', () => {
        render(<Sidebar />);
        const input = screen.getByPlaceholderText('Buscar…') as HTMLInputElement;
        expect(input.value).toBe('');
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Propiedades')).toBeInTheDocument();
        expect(screen.getByText('Leads')).toBeInTheDocument();
    });

    it('preserva todos los hrefs de navegación', () => {
        render(<Sidebar />);
        const submenuToggles = screen.getAllByTestId('sidebar-submenu-toggle');
        submenuToggles.forEach((btn) => fireEvent.click(btn));
        const anchors = document.querySelectorAll('a[href]');
        const hrefs = Array.from(anchors)
            .map((a) => a.getAttribute('href'))
            .filter(Boolean) as string[];
        expect(hrefs).toContain('/');
        expect(hrefs).toContain('/propiedades');
        expect(hrefs).toContain('/propiedades/nueva');
        expect(hrefs).toContain('/leads');
        expect(hrefs).toContain('/leads/nueva');
        expect(hrefs).toContain('/agentes');
        expect(hrefs).toContain('/agentes/nueva');
        expect(hrefs).toContain('/visitas');
        expect(hrefs).toContain('/chat');
        expect(hrefs).toContain('/sitio');
        expect(hrefs).toContain('/mercadolibre');
        expect(hrefs).toContain('/newsletter');
        expect(hrefs).toContain('/propietarios');
        expect(hrefs).toContain('/propietarios/nuevo');
        expect(hrefs).toContain('/planes-accion');
        expect(hrefs).toContain('/comunicaciones');
        expect(hrefs).toContain('/reportes');
        expect(hrefs).toContain('/auditoria');
        expect(hrefs).toContain('/usuarios');
        expect(hrefs).toContain('/papelera');
        expect(hrefs).toContain('/configuracion');
    });

    it('el logo enlaza a /', () => {
        render(<Sidebar />);
        const brandLink = document.querySelector('a[href="/"]');
        expect(brandLink).toBeInTheDocument();
    });

    it('renderiza el workspace colapsado como solo el activo', () => {
        sidebarCollapsed.value = true;
        render(<Sidebar />);
        expect(screen.queryByText('Producción')).not.toBeInTheDocument();
    });

    it('cambia el workspace activo al hacer click', () => {
        render(<Sidebar />);
        const produccionBtn = screen.getByText('Producción').closest('button');
        fireEvent.click(produccionBtn!);
        expect(screen.getByTestId('sidebar-workspace-check')).toBeInTheDocument();
    });

    it('el botón de búsqueda colapsado expande el sidebar', () => {
        sidebarCollapsed.value = true;
        render(<Sidebar />);
        const searchBtn = screen.getByLabelText('Buscar');
        fireEvent.click(searchBtn);
        expect(sidebarCollapsed.value).toBe(false);
    });
});
