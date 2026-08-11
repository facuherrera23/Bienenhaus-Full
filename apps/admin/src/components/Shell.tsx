import type { ComponentChildren } from 'preact';
import { useEffect } from 'preact/hooks';
import { useLocation } from 'wouter-preact';
import { Calendar, Plus, Settings, ShoppingBag, UserRound, Users } from 'lucide-preact';
import { commandPaletteOpen, mobileMenuOpen, sidebarCollapsed } from '../store/app';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BreadcrumbNav } from './Breadcrumb';
import { CommandPalette } from './CommandPalette';
import styles from './Shell.module.css';

export function Shell({ children }: { children: ComponentChildren }) {
    const [, setLocation] = useLocation();

    const globalCommands = [
        {
            id: 'properties-new',
            label: 'Nueva propiedad',
            description: 'Crear una propiedad nueva',
            icon: Plus,
            section: 'Propiedades',
            action: () => {
                setLocation('/propiedades/nueva');
            },
        },
        {
            id: 'leads-new',
            label: 'Nuevo lead',
            description: 'Registrar un nuevo lead',
            icon: Users,
            section: 'Leads',
            action: () => {
                setLocation('/leads/nueva');
            },
        },
        {
            id: 'visits-new',
            label: 'Nueva visita',
            description: 'Programar una visita',
            icon: Calendar,
            section: 'Visitas',
            action: () => {
                setLocation('/visitas');
            },
        },
        {
            id: 'agents-new',
            label: 'Nuevo agente',
            description: 'Registrar un nuevo agente',
            icon: UserRound,
            section: 'Agentes',
            action: () => {
                setLocation('/agentes/nueva');
            },
        },
        {
            id: 'ml-sync',
            label: 'Sincronizar Mercado Libre',
            description: 'Ejecutar sincronización manual',
            icon: ShoppingBag,
            section: 'Mercado Libre',
            action: () => {
                setLocation('/mercadolibre');
            },
        },
        {
            id: 'settings',
            label: 'Configuración',
            description: 'Ajustes del panel',
            icon: Settings,
            section: 'Sistema',
            action: () => {
                setLocation('/configuracion');
            },
        },
    ];

    // Ctrl/Cmd+K opens command palette; Escape closes palette then drawer (spec §45, §57).
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                commandPaletteOpen.value = true;
            }
            if (e.key === 'Escape') {
                // CommandPalette handles its own Escape (preventDefault); if it
                // already consumed the event, do not also close the drawer.
                if (e.defaultPrevented) return;
                if (commandPaletteOpen.value) {
                    e.preventDefault();
                    commandPaletteOpen.value = false;
                } else if (mobileMenuOpen.value) {
                    e.preventDefault();
                    mobileMenuOpen.value = false;
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const closePalette = () => {
        commandPaletteOpen.value = false;
    };
    const closeDrawer = () => {
        mobileMenuOpen.value = false;
    };

    return (
        <div className={styles.shell} data-testid="shell">
            <a href="#main-content" className={styles['skip-link']}>
                Saltar al contenido
            </a>
            <Sidebar />
            <div
                className={`${styles['sidebar-scrim']}${mobileMenuOpen.value ? ` ${styles['is-visible']}` : ''}`}
                onClick={closeDrawer}
                aria-hidden={!mobileMenuOpen.value}
                data-testid="sidebar-scrim"
            />
            <div
                className={`${styles['shell-main']}${sidebarCollapsed.value ? ` ${styles['is-collapsed']}` : ''}`}
                data-testid="shell-main"
            >
                <Topbar />
                <div className={styles['breadcrumb-row']} data-testid="breadcrumb-row">
                    <BreadcrumbNav />
                </div>
                <main id="main-content" className={styles['shell-content']} data-testid="shell-content">
                    {children}
                </main>
            </div>
            <CommandPalette
                items={globalCommands}
                isOpen={commandPaletteOpen.value}
                onClose={closePalette}
            />
        </div>
    );
}
