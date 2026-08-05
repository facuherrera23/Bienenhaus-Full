import {
  Building2,
  Calendar,
  Globe,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Settings,
  Shield,
  ShoppingBag,
  Trash2,
  UserRound,
  Users,
  FileText,
  UserCheck,
  ClipboardList,
} from 'lucide-preact';
import { Link } from 'wouter-preact';
import { mobileMenuOpen, sidebarCollapsed, authUserRole } from '../store/app';
import type { AdminRole } from '../types/admin';

interface NavItem {
  href: string;
  label: string;
  icon: typeof Building2;
  roles?: AdminRole[];
}

const NAV: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/propiedades', label: 'Propiedades', icon: Building2 },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/agentes', label: 'Agentes', icon: UserRound, roles: ['super_admin', 'admin', 'staff'] },
  { href: '/visitas', label: 'Visitas', icon: Calendar },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/sitio', label: 'Sitio Web', icon: Globe, roles: ['super_admin', 'admin'] },
  { href: '/mercadolibre', label: 'Mercado Libre', icon: ShoppingBag, roles: ['super_admin', 'admin', 'staff'] },
  { href: '/newsletter', label: 'Newsletter', icon: Mail, roles: ['super_admin', 'admin'] },
];

const OWNERS_NAV: NavItem[] = [
  { href: '/propietarios', label: 'Propietarios', icon: UserCheck },
  { href: '/planes-accion', label: 'Planes de acción', icon: ClipboardList },
  { href: '/comunicaciones', label: 'Comunicaciones', icon: MessageSquare },
  { href: '/reportes', label: 'Reportes', icon: FileText },
];

const ADMIN_ONLY_NAV: NavItem[] = [
  { href: '/auditoria', label: 'Auditoría', icon: FileText, roles: ['super_admin', 'admin'] },
  { href: '/usuarios', label: 'Usuarios', icon: Shield, roles: ['super_admin'] },
  { href: '/papelera', label: 'Papelera', icon: Trash2, roles: ['super_admin', 'admin', 'staff'] },
];

const SETTINGS_NAV: NavItem = {
  href: '/configuracion',
  label: 'Configuración',
  icon: Settings,
  roles: ['super_admin', 'admin'],
};

export function Sidebar() {
  const collapsed = sidebarCollapsed.value;
  const role = authUserRole.value;

  const filterByRole = (items: NavItem[]) =>
    items.filter((item) => !item.roles || item.roles.includes(role ?? 'viewer'));

  return (
    <aside
      className={`sidebar${collapsed ? ' is-collapsed' : ''}${mobileMenuOpen.value ? ' is-mobile-open' : ''}`}
    >
      <div className="sidebar-brand">
        <span className="sidebar-logo" aria-hidden="true">
          B
        </span>
        {!collapsed && (
          <div className="sidebar-brand-text">
            <strong>BIENENHAUS</strong>
            <span>Admin</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav" aria-label="Navegación del panel">
        {filterByRole(NAV).map(({ href, label, icon: Icon }) => (
          <Link href={href} key={href} className="sidebar-link" onClick={() => (mobileMenuOpen.value = false)}>
            <Icon size={18} strokeWidth={1.8} />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}

        <div className="sidebar-section">
          <span className="sidebar-section-title">Propietarios</span>
          {filterByRole(OWNERS_NAV).map(({ href, label, icon: Icon }) => (
            <Link href={href} key={href} className="sidebar-link" onClick={() => (mobileMenuOpen.value = false)}>
              <Icon size={18} strokeWidth={1.8} />
              {!collapsed && <span>{label}</span>}
            </Link>
          ))}
        </div>

        {filterByRole(ADMIN_ONLY_NAV).map(({ href, label, icon: Icon }) => (
          <Link href={href} key={href} className="sidebar-link" onClick={() => (mobileMenuOpen.value = false)}>
            <Icon size={18} strokeWidth={1.8} />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        {(!SETTINGS_NAV.roles || SETTINGS_NAV.roles.includes(role ?? 'viewer')) && (
          <Link href={SETTINGS_NAV.href} className="sidebar-link" onClick={() => (mobileMenuOpen.value = false)}>
            <Settings size={18} strokeWidth={1.8} />
            {!collapsed && <span>{SETTINGS_NAV.label}</span>}
          </Link>
        )}
      </div>
    </aside>
  );
}
