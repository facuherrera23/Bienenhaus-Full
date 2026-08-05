import type { ComponentChildren } from 'preact';
import { useLocation } from 'wouter-preact';
import { mobileMenuOpen } from '../store/app';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandPalette, useCommandPalette } from './CommandPalette';
import { Plus, Users, Calendar, UserRound, MessageSquare, Globe, ShoppingBag, Mail, Settings } from 'lucide-preact';

export function Shell({ children }: { children: ComponentChildren }) {
  const { isOpen, close } = useCommandPalette();
  const [, setLocation] = useLocation();

  const globalCommands = [
    {
      id: 'properties-new',
      label: 'Nueva propiedad',
      description: 'Crear una propiedad nueva',
      icon: Plus,
      section: 'Propiedades',
      action: () => { setLocation('/propiedades/nueva'); },
    },
    {
      id: 'leads-new',
      label: 'Nuevo lead',
      description: 'Registrar un nuevo lead',
      icon: Users,
      section: 'Leads',
      action: () => { setLocation('/leads/nueva'); },
    },
    {
      id: 'visits-new',
      label: 'Nueva visita',
      description: 'Programar una visita',
      icon: Calendar,
      section: 'Visitas',
      action: () => { setLocation('/visitas'); },
    },
    {
      id: 'agents-new',
      label: 'Nuevo agente',
      description: 'Registrar un nuevo agente',
      icon: UserRound,
      section: 'Agentes',
      action: () => { setLocation('/agentes/nueva'); },
    },
    {
      id: 'ml-sync',
      label: 'Sincronizar Mercado Libre',
      description: 'Ejecutar sincronizaci��n manual',
      icon: ShoppingBag,
      section: 'Mercado Libre',
      action: () => { setLocation('/mercadolibre'); },
    },
    {
      id: 'settings',
      label: 'Configuraci��n',
      description: 'Ajustes del panel',
      icon: Settings,
      section: 'Sistema',
      action: () => { setLocation('/configuracion'); },
    },
  ];

  return (
    <div className="shell">
      <Sidebar />
      <div
        className={`sidebar-scrim${mobileMenuOpen.value ? ' show' : ''}`}
        onClick={() => (mobileMenuOpen.value = false)}
      />
      <div className="shell-main">
        <Topbar />
        <main className="shell-content">{children}</main>
      </div>
      <CommandPalette
        items={globalCommands}
        isOpen={isOpen}
        onClose={close}
      />
    </div>
  );
}