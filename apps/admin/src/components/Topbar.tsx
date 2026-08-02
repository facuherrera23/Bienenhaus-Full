import { LogOut, Menu, Search } from 'lucide-preact';
import { useLocation } from 'wouter-preact';
import { mobileMenuOpen, sidebarCollapsed } from '../store/app';
import { supabase } from '../lib/supabase';

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/propiedades': 'Propiedades',
  '/leads': 'Leads',
  '/agentes': 'Agentes',
  '/sitio': 'Sitio Web',
  '/mercadolibre': 'Mercado Libre',
  '/configuracion': 'Configuración',
};

export function Topbar() {
  const [location, setLocation] = useLocation();
  const title = TITLES[location] ?? 'BIENENHAUS Admin';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLocation('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="icon-btn"
          aria-label="Alternar menú lateral"
          onClick={() => (sidebarCollapsed.value = !sidebarCollapsed.value)}
        >
          <Menu size={18} />
        </button>
        <button
          className="icon-btn mobile-only"
          aria-label="Abrir menú"
          onClick={() => (mobileMenuOpen.value = !mobileMenuOpen.value)}
        >
          <Menu size={18} />
        </button>
        <h1 className="topbar-title">{title}</h1>
      </div>

      <div className="topbar-right">
        <div className="topbar-search">
          <Search size={15} />
          <input type="text" placeholder="Buscar…" aria-label="Buscar" />
        </div>
        <button className="btn btn--ghost" onClick={handleLogout}>
          <LogOut size={16} />
          Salir
        </button>
      </div>
    </header>
  );
}
