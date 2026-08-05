import { LogOut, Menu, Search, Loader2 } from 'lucide-preact';
import { useLocation } from 'wouter-preact';
import { mobileMenuOpen, sidebarCollapsed, authSigningOut, signOut } from '../store/app';

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
  const [location] = useLocation();
  const title = TITLES[location] ?? 'BIENENHAUS Admin';
  const signingOut = authSigningOut.value;

  const handleLogout = async () => {
    await signOut();
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
        <button className="btn btn--ghost" onClick={handleLogout} disabled={signingOut} aria-busy={signingOut}>
          {signingOut ? <Loader2 size={16} className="spin" /> : <LogOut size={16} />}
          {signingOut ? 'Cerrando…' : 'Salir'}
        </button>
      </div>
    </header>
  );
}
