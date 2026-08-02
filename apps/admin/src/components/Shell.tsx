import type { ComponentChildren } from 'preact';
import { useLocation } from 'wouter-preact';
import { mobileMenuOpen } from '../store/app';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandPalette, useCommandPalette } from './CommandPalette';

export function Shell({ children }: { children: ComponentChildren }) {
  const { isOpen, close } = useCommandPalette();
  const [, setLocation] = useLocation();

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
        items={getGlobalCommands(setLocation)}
        isOpen={isOpen}
        onClose={close}
      />
    </div>
  );
}

function getGlobalCommands(setLocation: (to: string) => void) {
  // Importaciones dinámicas para evitar dependencias circulares
  return [
    {
      id: 'properties-new',
      label: 'Nueva propiedad',
      description: 'Crear una propiedad nueva',
      icon: (() => import('lucide-preact').then(m => m.Plus)) as any,
      section: 'Propiedades',
      action: () => { setLocation('/propiedades/nueva'); },
    },
    {
      id: 'leads-new',
      label: 'Nuevo lead',
      description: 'Registrar un nuevo lead',
      section: 'Leads',
      action: () => { setLocation('/leads/nueva'); },
    },
    {
      id: 'visits-new',
      label: 'Nueva visita',
      description: 'Programar una visita',
      section: 'Visitas',
      action: () => { setLocation('/visitas'); },
    },
    {
      id: 'agents-new',
      label: 'Nuevo agente',
      description: 'Registrar un nuevo agente',
      section: 'Agentes',
      action: () => { setLocation('/agentes/nueva'); },
    },
    {
      id: 'ml-sync',
      label: 'Sincronizar Mercado Libre',
      description: 'Ejecutar sincronización manual',
      section: 'Mercado Libre',
      action: () => { 
        // This would need access to the sync mutation
        console.log('Sync ML');
      },
    },
    {
      id: 'settings',
      label: 'Configuración',
      description: 'Ajustes del panel',
      section: 'Sistema',
      action: () => { setLocation('/configuracion'); },
    },
  ];
}
