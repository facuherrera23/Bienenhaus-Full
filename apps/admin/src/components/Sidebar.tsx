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
} from 'lucide-preact';
import { Link } from 'wouter-preact';
import { mobileMenuOpen, sidebarCollapsed } from '../store/app';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/propiedades', label: 'Propiedades', icon: Building2 },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/agentes', label: 'Agentes', icon: UserRound },
  { href: '/visitas', label: 'Visitas', icon: Calendar },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/sitio', label: 'Sitio Web', icon: Globe },
  { href: '/mercadolibre', label: 'Mercado Libre', icon: ShoppingBag },
  { href: '/newsletter', label: 'Newsletter', icon: Mail },
];

export function Sidebar() {
  const collapsed = sidebarCollapsed.value;

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
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link href={href} key={href} className="sidebar-link" onClick={() => (mobileMenuOpen.value = false)}>
            <Icon size={18} strokeWidth={1.8} />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
        <Link href="/auditoria" className="sidebar-link" onClick={() => (mobileMenuOpen.value = false)}>
          <FileText size={18} strokeWidth={1.8} />
          {!collapsed && <span>Auditoría</span>}
        </Link>
        <Link href="/usuarios" className="sidebar-link" onClick={() => (mobileMenuOpen.value = false)}>
          <Shield size={18} strokeWidth={1.8} />
          {!collapsed && <span>Usuarios</span>}
        </Link>
        <Link href="/papelera" className="sidebar-link" onClick={() => (mobileMenuOpen.value = false)}>
          <Trash2 size={18} strokeWidth={1.8} />
          {!collapsed && <span>Papelera</span>}
        </Link>
      </nav>

      <div className="sidebar-footer">
        <Link href="/configuracion" className="sidebar-link">
          <Settings size={18} strokeWidth={1.8} />
          {!collapsed && <span>Configuración</span>}
        </Link>
      </div>
    </aside>
  );
}
