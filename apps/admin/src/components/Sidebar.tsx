import {
    Building2,
    Calculator,
    Calendar,
    Check,
    ChevronRight,
    ClipboardList,
    FileText,
    Globe,
    LayoutDashboard,
    Mail,
    MessageSquare,
    Search,
    Settings,
    Shield,
    ShoppingBag,
    Trash2,
    UserCheck,
    UserRound,
    Users,
} from 'lucide-preact';
import { useState } from 'preact/hooks';
import { Link, useRoute } from 'wouter-preact';
import { Tooltip } from '@bienenhaus/ui';
import styles from './Sidebar.module.css';
import { authUserRole, mobileMenuOpen, sidebarCollapsed } from '../store/app';
import type { AdminRole } from '../types/admin';

type IconType = typeof Building2;

interface NavChild {
    href: string;
    label: string;
}

interface NavItem {
    href: string;
    label: string;
    icon: IconType;
    roles?: AdminRole[];
    badge?: string | number;
    children?: NavChild[];
}

const NAV: NavItem[] = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    {
        href: '/propiedades',
        label: 'Propiedades',
        icon: Building2,
        children: [
            { href: '/propiedades', label: 'Listado' },
            { href: '/propiedades/nueva', label: 'Nueva propiedad' },
        ],
    },
    {
        href: '/leads',
        label: 'Leads',
        icon: Users,
        children: [
            { href: '/leads', label: 'Listado' },
            { href: '/leads/nueva', label: 'Nuevo lead' },
        ],
    },
    {
        href: '/agentes',
        label: 'Agentes',
        icon: UserRound,
        roles: ['super_admin', 'admin', 'staff'],
        children: [
            { href: '/agentes', label: 'Listado' },
            { href: '/agentes/nueva', label: 'Nuevo agente' },
        ],
    },
    { href: '/visitas', label: 'Visitas', icon: Calendar },
    { href: '/chat', label: 'Chat', icon: MessageSquare },
    { href: '/tasar', label: 'Tasar', icon: Calculator, roles: ['super_admin', 'admin', 'staff'] },
    { href: '/sitio', label: 'Sitio Web', icon: Globe, roles: ['super_admin', 'admin'] },
    {
        href: '/mercadolibre',
        label: 'Mercado Libre',
        icon: ShoppingBag,
        roles: ['super_admin', 'admin', 'staff'],
    },
    { href: '/newsletter', label: 'Newsletter', icon: Mail, roles: ['super_admin', 'admin'] },
];

const OWNERS_NAV: NavItem[] = [
    {
        href: '/propietarios',
        label: 'Propietarios',
        icon: UserCheck,
        children: [
            { href: '/propietarios', label: 'Listado' },
            { href: '/propietarios/nuevo', label: 'Nuevo propietario' },
        ],
    },
    { href: '/planes-accion', label: 'Planes de acción', icon: ClipboardList },
    { href: '/comunicaciones', label: 'Comunicaciones', icon: MessageSquare },
    { href: '/reportes', label: 'Reportes', icon: FileText },
];

const ADMIN_ONLY_NAV: NavItem[] = [
    { href: '/auditoria', label: 'Auditoría', icon: FileText, roles: ['super_admin', 'admin'] },
    { href: '/usuarios', label: 'Usuarios', icon: Shield, roles: ['super_admin'] },
    {
        href: '/papelera',
        label: 'Papelera',
        icon: Trash2,
        roles: ['super_admin', 'admin', 'staff'],
    },
];

const SETTINGS_NAV: NavItem = {
    href: '/configuracion',
    label: 'Configuración',
    icon: Settings,
    roles: ['super_admin', 'admin'],
};

const WORKSPACES = [
    { id: 'bienenhaus', name: 'Bienenhaus', glyph: 'B' },
    { id: 'produccion', name: 'Producción', glyph: 'P' },
];

const APP_VERSION: string = import.meta.env.VITE_APP_VERSION ?? 'dev';

function filterByRole(items: NavItem[], role: AdminRole | null): NavItem[] {
    return items.filter((item) => !item.roles || item.roles.includes(role ?? 'viewer'));
}

function matchesQuery(label: string, query: string): boolean {
    return label.toLowerCase().includes(query.toLowerCase().trim());
}

function itemMatchesQuery(item: NavItem, query: string): boolean {
    if (!query.trim()) return true;
    if (matchesQuery(item.label, query)) return true;
    if (item.children) {
        return item.children.some((child) => matchesQuery(child.label, query));
    }
    return false;
}

function useRouteMatch(href: string): boolean {
    const [match] = useRoute(href);
    return Boolean(match);
}

interface NavLinkProps {
    item: NavItem;
    collapsed: boolean;
    onNavigate: () => void;
}

function NavLink({ item, collapsed, onNavigate }: NavLinkProps) {
    const active = useRouteMatch(item.href);
    const linkContent = (
        <Link
            href={item.href}
            className={`${styles['sidebar-link']}${active ? ` ${styles['is-active']}` : ''}`}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
        >
            <span className={styles['sidebar-link-icon']}>
                <item.icon size={18} strokeWidth={1.8} />
            </span>
            {!collapsed && <span className={styles['sidebar-link-label']}>{item.label}</span>}
            {!collapsed && item.badge != null && (
                <span className={styles['sidebar-badge']}>{item.badge}</span>
            )}
            {collapsed && item.badge != null && (
                <span className={`${styles['sidebar-badge']} ${styles['is-dot']}`} />
            )}
        </Link>
    );

    if (collapsed) {
        return (
            <Tooltip content={item.label} position="right" delay={300} arrow={false}>
                {linkContent}
            </Tooltip>
        );
    }
    return linkContent;
}

interface SubmenuChildProps {
    child: NavChild;
    onNavigate: () => void;
}

function SubmenuChild({ child, onNavigate }: SubmenuChildProps) {
    const active = useRouteMatch(child.href);
    return (
        <Link
            href={child.href}
            className={`${styles['sidebar-link']}${active ? ` ${styles['is-active']}` : ''}`}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
        >
            <span className={styles['sidebar-link-label']}>{child.label}</span>
        </Link>
    );
}

interface SubmenuProps {
    item: NavItem;
    collapsed: boolean;
    onNavigate: () => void;
}

function Submenu({ item, collapsed, onNavigate }: SubmenuProps) {
    const selfActive = useRouteMatch(item.href);
    const [open, setOpen] = useState(selfActive);

    if (collapsed) {
        const linkContent = (
            <Link
                href={item.href}
                className={`${styles['sidebar-link']}${selfActive ? ` ${styles['is-active']}` : ''}`}
                onClick={onNavigate}
                aria-current={selfActive ? 'page' : undefined}
            >
                <span className={styles['sidebar-link-icon']}>
                    <item.icon size={18} strokeWidth={1.8} />
                </span>
                {item.badge != null && (
                    <span className={`${styles['sidebar-badge']} ${styles['is-dot']}`} />
                )}
            </Link>
        );
        return (
            <Tooltip content={item.label} position="right" delay={300} arrow={false}>
                {linkContent}
            </Tooltip>
        );
    }

    return (
        <div className={styles['sidebar-submenu-group']}>
            <button
                type="button"
                className={`${styles['sidebar-submenu-toggle']}${selfActive ? ` ${styles['is-active']}` : ''}`}
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                data-testid="sidebar-submenu-toggle"
            >
                <span className={styles['sidebar-link-icon']}>
                    <item.icon size={18} strokeWidth={1.8} />
                </span>
                <span className={styles['sidebar-link-label']}>{item.label}</span>
                {item.badge != null && (
                    <span className={styles['sidebar-badge']}>{item.badge}</span>
                )}
                <span
                    className={`${styles['sidebar-submenu-chevron']}${open ? ` ${styles['is-open']}` : ''}`}
                    data-testid="sidebar-submenu-chevron"
                >
                    <ChevronRight size={16} strokeWidth={1.8} />
                </span>
            </button>
            {open && item.children && (
                <div className={`${styles['sidebar-submenu']} ${styles['is-open']}`}>
                    {item.children.map((child) => (
                        <SubmenuChild key={child.href} child={child} onNavigate={onNavigate} />
                    ))}
                </div>
            )}
        </div>
    );
}

interface NavSectionProps {
    title: string;
    items: NavItem[];
    collapsed: boolean;
    onNavigate: () => void;
    query: string;
}

function NavSection({ title, items, collapsed, onNavigate, query }: NavSectionProps) {
    const visible = items.filter((item) => itemMatchesQuery(item, query));
    if (visible.length === 0) return null;

    return (
        <div className={styles['sidebar-section']}>
            {!collapsed && <span className={styles['sidebar-section-title']}>{title}</span>}
            {visible.map((item) =>
                item.children && !collapsed ? (
                    <Submenu
                        key={item.href}
                        item={item}
                        collapsed={collapsed}
                        onNavigate={onNavigate}
                    />
                ) : (
                    <NavLink
                        key={item.href}
                        item={item}
                        collapsed={collapsed}
                        onNavigate={onNavigate}
                    />
                ),
            )}
        </div>
    );
}

interface WorkspaceItemProps {
    workspace: { id: string; name: string; glyph: string };
    active: boolean;
    collapsed: boolean;
    onSelect: (id: string) => void;
}

function WorkspaceItem({ workspace, active, collapsed, onSelect }: WorkspaceItemProps) {
    if (collapsed) {
        return (
            <Tooltip content={workspace.name} position="right" delay={300} arrow={false}>
                <button
                    type="button"
                    className={`${styles['sidebar-workspace-item']} ${styles['is-active']}`}
                    aria-label={workspace.name}
                >
                    <span className={styles['sidebar-workspace-glyph']}>{workspace.glyph}</span>
                </button>
            </Tooltip>
        );
    }
    return (
        <button
            type="button"
            className={`${styles['sidebar-workspace-item']}${active ? ` ${styles['is-active']}` : ''}`}
            onClick={() => onSelect(workspace.id)}
        >
            <span className={styles['sidebar-workspace-glyph']}>{workspace.glyph}</span>
            <span className={styles['sidebar-workspace-name']}>{workspace.name}</span>
            {active && (
                <span
                    className={styles['sidebar-workspace-check']}
                    data-testid="sidebar-workspace-check"
                >
                    <Check size={14} strokeWidth={2} />
                </span>
            )}
        </button>
    );
}

export function Sidebar() {
    const collapsed = sidebarCollapsed.value;
    const mobileOpen = mobileMenuOpen.value;
    const role = authUserRole.value;
    const [query, setQuery] = useState('');
    const [activeWorkspace, setActiveWorkspace] = useState(WORKSPACES[0].id);

    const handleNavigate = () => {
        mobileMenuOpen.value = false;
    };

    const mainNav = filterByRole(NAV, role);
    const ownersNav = filterByRole(OWNERS_NAV, role);
    const adminNav = filterByRole(ADMIN_ONLY_NAV, role);
    const settingsVisible = !SETTINGS_NAV.roles || SETTINGS_NAV.roles.includes(role ?? 'viewer');

    return (
        <aside
            className={`${styles.sidebar}${collapsed ? ` ${styles['is-collapsed']}` : ''}${mobileOpen ? ` ${styles['is-mobile-open']}` : ''}`}
            aria-label="Navegación del panel"
            data-testid="sidebar"
        >
            <div className={styles['sidebar-brand']}>
                <Link href="/" className={styles['sidebar-brand-link']} onClick={handleNavigate}>
                    <span className={styles['sidebar-logo']} aria-hidden="true">
                        B
                    </span>
                    {!collapsed && (
                        <div className={styles['sidebar-brand-text']}>
                            <strong>BIENENHAUS</strong>
                            <span>Admin</span>
                        </div>
                    )}
                </Link>
            </div>

            <div className={styles['sidebar-workspace']}>
                {collapsed
                    ? WORKSPACES.filter((w) => w.id === activeWorkspace).map((w) => (
                          <WorkspaceItem
                              key={w.id}
                              workspace={w}
                              active
                              collapsed
                              onSelect={setActiveWorkspace}
                          />
                      ))
                    : WORKSPACES.map((w) => (
                          <WorkspaceItem
                              key={w.id}
                              workspace={w}
                              active={w.id === activeWorkspace}
                              collapsed={false}
                              onSelect={setActiveWorkspace}
                          />
                      ))}
            </div>

            <div className={styles['sidebar-search']}>
                {collapsed ? (
                    <Tooltip content="Buscar" position="right" delay={300} arrow={false}>
                        <button
                            type="button"
                            className={styles['sidebar-search-btn']}
                            aria-label="Buscar"
                            onClick={() => {
                                sidebarCollapsed.value = false;
                            }}
                        >
                            <Search size={18} strokeWidth={1.8} />
                        </button>
                    </Tooltip>
                ) : (
                    <div className={styles['sidebar-search-field']}>
                        <span className={styles['sidebar-search-icon']}>
                            <Search size={15} strokeWidth={1.8} />
                        </span>
                        <input
                            type="text"
                            className={styles['sidebar-search-input']}
                            placeholder="Buscar…"
                            aria-label="Buscar en navegación"
                            value={query}
                            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
                        />
                    </div>
                )}
            </div>

            <nav className={styles['sidebar-nav']} aria-label="Navegación principal">
                <NavSection
                    title="Principal"
                    items={mainNav}
                    collapsed={collapsed}
                    onNavigate={handleNavigate}
                    query={query}
                />
                {ownersNav.length > 0 && (
                    <NavSection
                        title="Propietarios"
                        items={ownersNav}
                        collapsed={collapsed}
                        onNavigate={handleNavigate}
                        query={query}
                    />
                )}
                {adminNav.length > 0 && (
                    <NavSection
                        title="Administración"
                        items={adminNav}
                        collapsed={collapsed}
                        onNavigate={handleNavigate}
                        query={query}
                    />
                )}
            </nav>

            <div className={styles['sidebar-footer']} data-testid="sidebar-footer">
                {settingsVisible && (
                    <NavLink
                        item={SETTINGS_NAV}
                        collapsed={collapsed}
                        onNavigate={handleNavigate}
                    />
                )}
                {collapsed ? (
                    <Tooltip content={`v${APP_VERSION}`} position="right" delay={300} arrow={false}>
                        <button
                            type="button"
                            className={styles['sidebar-version-btn']}
                            aria-label="Versión"
                        >
                            v
                        </button>
                    </Tooltip>
                ) : (
                    <div className={styles['sidebar-version']}>v{APP_VERSION}</div>
                )}
            </div>
        </aside>
    );
}
