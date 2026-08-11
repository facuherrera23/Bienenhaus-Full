import { useEffect, useMemo, useState } from 'preact/hooks';
import { useLocation } from 'wouter-preact';
import {
    Bell,
    CheckCheck,
    LogOut,
    type LucideIcon,
    Menu,
    Moon,
    Plus,
    Search,
    Settings,
    Sun,
    User,
    X,
} from 'lucide-preact';
import { Avatar, Badge, Dropdown, IconButton, SearchInput, Spinner } from '@bienenhaus/ui';
import styles from './Topbar.module.css';
import {
    authSession,
    authSigningOut,
    commandPaletteOpen,
    mobileMenuOpen,
    pushToast,
    sidebarCollapsed,
    signOut,
} from '../store/app';

/* -------------------------------------------------------------------------- */
/* Quick Actions (spec §46)                                                   */
/* -------------------------------------------------------------------------- */

interface QuickAction {
    id: string;
    label: string;
    description: string;
    icon: LucideIcon;
    route: string;
}

const QUICK_ACTIONS: readonly QuickAction[] = [
    {
        id: 'new-property',
        label: 'Nueva Propiedad',
        description: 'Crear una propiedad nueva',
        icon: Plus,
        route: '/propiedades/nueva',
    },
    {
        id: 'new-lead',
        label: 'Nuevo Lead',
        description: 'Registrar un nuevo lead',
        icon: User,
        route: '/leads/nueva',
    },
    {
        id: 'new-agent',
        label: 'Nuevo Agente',
        description: 'Registrar un nuevo agente',
        icon: User,
        route: '/agentes/nueva',
    },
    {
        id: 'new-visit',
        label: 'Nueva Visita',
        description: 'Programar una visita',
        icon: Bell,
        route: '/visitas',
    },
] as const;

/* -------------------------------------------------------------------------- */
/* Notifications (spec §47) — local demo dataset, no backend                  */
/* -------------------------------------------------------------------------- */

type NotificationType =
    | 'sistema'
    | 'mercadolibre'
    | 'crm'
    | 'usuarios'
    | 'errores'
    | 'sincronizacion';

interface NotificationItem {
    id: string;
    type: NotificationType;
    title: string;
    description?: string;
    time: string;
    read: boolean;
}

const NOTIF_TYPE_META: Record<NotificationType, { label: string; color: string }> = {
    sistema: { label: 'Sistema', color: 'var(--bh-info)' },
    mercadolibre: { label: 'Mercado Libre', color: 'var(--bh-warning)' },
    crm: { label: 'CRM', color: 'var(--bh-accent)' },
    usuarios: { label: 'Usuarios', color: 'var(--bh-success)' },
    errores: { label: 'Errores', color: 'var(--bh-danger)' },
    sincronizacion: { label: 'Sincronización', color: 'var(--bh-info)' },
};

const NOTIF_FILTERS: readonly NotificationType[] = [
    'sistema',
    'mercadolibre',
    'crm',
    'usuarios',
    'errores',
    'sincronizacion',
] as const;

const DEMO_NOTIFICATIONS: readonly NotificationItem[] = [
    {
        id: 'n1',
        type: 'crm',
        title: 'Nuevo lead asignado',
        description: 'Juan Pérez solicitó info sobre Depto en Palermo',
        time: 'hace 5 min',
        read: false,
    },
    {
        id: 'n2',
        type: 'mercadolibre',
        title: 'Sincronización completada',
        description: '3 propiedades publicadas correctamente en ML',
        time: 'hace 20 min',
        read: false,
    },
    {
        id: 'n3',
        type: 'sistema',
        title: 'Backup automático',
        description: 'El backup diario de la base de datos se completó',
        time: 'hace 1 h',
        read: true,
    },
    {
        id: 'n4',
        type: 'errores',
        title: 'Error de publicación ML',
        description: 'No se pudo publicar la propiedad #1284 en ML',
        time: 'hace 2 h',
        read: false,
    },
    {
        id: 'n5',
        type: 'usuarios',
        title: 'Nuevo usuario invitado',
        description: 'Se invitó a maria@bienenhaus.com como staff',
        time: 'hace 3 h',
        read: true,
    },
    {
        id: 'n6',
        type: 'sincronizacion',
        title: 'Cola de sync procesada',
        description: '12 items procesados, 0 errores',
        time: 'hace 5 h',
        read: true,
    },
] as const;

/* -------------------------------------------------------------------------- */
/* Avatar helpers (spec §48)                                                  */
/* -------------------------------------------------------------------------- */

function deriveInitials(email?: string | null, name?: string | null): string {
    if (name) {
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    }
    if (email) {
        const local = email.split('@')[0];
        return local.slice(0, 2).toUpperCase();
    }
    return 'U';
}

function deriveDisplayName(email?: string | null, name?: string | null): string {
    if (name) return name;
    if (email) return email.split('@')[0];
    return 'Usuario';
}

function getCurrentTheme(): 'dark' | 'light' {
    if (typeof document === 'undefined') return 'dark';
    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function toggleTheme(): void {
    const next = getCurrentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    pushToast({ type: 'info', title: 'Tema actualizado', description: next === 'dark' ? 'Modo oscuro' : 'Modo claro' });
}

/* -------------------------------------------------------------------------- */
/* Topbar                                                                     */
/* -------------------------------------------------------------------------- */

export function Topbar() {
    const [, setLocation] = useLocation();
    const [quickOpen, setQuickOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [avatarOpen, setAvatarOpen] = useState(false);

    const session = authSession.value;
    const signingOut = authSigningOut.value;
    const userEmail = session?.user?.email ?? null;
    const userName =
        (session?.user?.user_metadata as { name?: string } | undefined)?.name ?? null;
    const initials = deriveInitials(userEmail, userName);
    const displayName = deriveDisplayName(userEmail, userName);

    const handleBurgerDesktop = () => {
        sidebarCollapsed.value = !sidebarCollapsed.value;
    };

    const handleBurgerMobile = () => {
        mobileMenuOpen.value = true;
    };

    const openCommandPalette = () => {
        commandPaletteOpen.value = true;
    };

    const navigateTo = (route: string) => {
        setLocation(route);
        setQuickOpen(false);
    };

    return (
        <header className={styles['topbar']} role="banner">
            {/* Left: hamburger (spec §42) */}
            <div className={styles['topbar-left']}>
                <div className={`${styles['topbar-burger']} ${styles['topbar-burger--desktop']}`}>
                    <IconButton
                        aria-label="Contraer menú lateral"
                        variant="ghost"
                        size="md"
                        onClick={handleBurgerDesktop}
                    >
                        <Menu size={18} />
                    </IconButton>
                </div>
                <div className={`${styles['topbar-burger']} ${styles['topbar-burger--mobile']}`}>
                    <IconButton
                        aria-label="Abrir menú lateral"
                        variant="ghost"
                        size="md"
                        onClick={handleBurgerMobile}
                    >
                        <Menu size={18} />
                    </IconButton>
                </div>
            </div>

            {/* Center: global search (spec §43, §45) */}
            <div className={styles['topbar-search']}>
                <div className={styles['topbar-search-input']}>
                    <SearchInput
                        placeholder="Buscar… (Ctrl+K)"
                        shortcut="Ctrl+K"
                        aria-label="Buscar"
                        readOnly
                        onClick={openCommandPalette}
                        onFocus={openCommandPalette}
                    />
                </div>
                <div className={styles['topbar-search-icon']}>
                    <IconButton
                        aria-label="Buscar"
                        variant="ghost"
                        size="md"
                        onClick={openCommandPalette}
                    >
                        <Search size={18} />
                    </IconButton>
                </div>
            </div>

            {/* Right: quick actions | notifications | avatar (spec §42) */}
            <div className={styles['topbar-right']}>
                <QuickActions
                    open={quickOpen}
                    onOpenChange={setQuickOpen}
                    onNavigate={navigateTo}
                />
                <NotificationCenter
                    open={notifOpen}
                    onOpenChange={setNotifOpen}
                />
                <AvatarMenu
                    open={avatarOpen}
                    onOpenChange={setAvatarOpen}
                    initials={initials}
                    displayName={displayName}
                    email={userEmail}
                    signingOut={signingOut}
                    onSignOut={signOut}
                    onNavigate={setLocation}
                />
            </div>
        </header>
    );
}

/* -------------------------------------------------------------------------- */
/* QuickActions (spec §46)                                                    */
/* -------------------------------------------------------------------------- */

interface QuickActionsProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onNavigate: (route: string) => void;
}

function QuickActions({ open, onOpenChange, onNavigate }: QuickActionsProps) {
    const trigger = (
        <div className={styles['topbar-badge-wrap']}>
            <IconButton aria-label="Acciones rápidas" variant="ghost" size="md">
                <Plus size={18} />
            </IconButton>
        </div>
    );

    return (
        <Dropdown
            trigger={trigger}
            align="end"
            label="Acciones rápidas"
            open={open}
            onOpenChange={onOpenChange}
        >
            <div role="menu">
                {QUICK_ACTIONS.map((action) => (
                    <button
                        key={action.id}
                        type="button"
                        role="menuitem"
                        className={styles['topbar-quick-item']}
                        onClick={() => onNavigate(action.route)}
                    >
                        <span className={styles['topbar-quick-item-icon']}>
                            <action.icon size={16} />
                        </span>
                        <span className={styles['topbar-quick-item-body']}>
                            <span className={styles['topbar-quick-item-label']}>{action.label}</span>
                            <span className={styles['topbar-quick-item-desc']}>{action.description}</span>
                        </span>
                    </button>
                ))}
            </div>
        </Dropdown>
    );
}

/* -------------------------------------------------------------------------- */
/* NotificationCenter (spec §47)                                              */
/* -------------------------------------------------------------------------- */

interface NotificationCenterProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function NotificationCenter({ open, onOpenChange }: NotificationCenterProps) {
    const [notifications, setNotifications] = useState<NotificationItem[]>(
        () => [...DEMO_NOTIFICATIONS],
    );
    const [activeFilter, setActiveFilter] = useState<NotificationType | 'all'>('all');

    const unreadCount = useMemo(
        () => notifications.filter((n) => !n.read).length,
        [notifications],
    );

    const filtered = useMemo(() => {
        if (activeFilter === 'all') return notifications;
        return notifications.filter((n) => n.type === activeFilter);
    }, [notifications, activeFilter]);

    const markAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const dismiss = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const trigger = (
        <div className={styles['topbar-badge-wrap']}>
            <IconButton aria-label="Notificaciones" variant="ghost" size="md">
                <Bell size={18} />
            </IconButton>
            {unreadCount > 0 && (
                <span
                    className={`${styles['topbar-badge']}${unreadCount > 9 ? ` ${styles['topbar-badge--danger']}` : ''}`}
                >
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </div>
    );

    return (
        <Dropdown
            trigger={trigger}
            align="end"
            label="Notificaciones"
            open={open}
            onOpenChange={onOpenChange}
        >
            <div className={styles['topbar-notif']}>
                <div className={styles['topbar-notif-header']}>
                    <div className={styles['topbar-notif-title-row']}>
                        <span className={styles['topbar-notif-title']}>Notificaciones</span>
                        {unreadCount > 0 && (
                            <Badge variant="primary" size="sm">
                                {unreadCount}
                            </Badge>
                        )}
                    </div>
                    <button
                        type="button"
                        className={styles['topbar-notif-mark-all']}
                        onClick={markAllRead}
                        disabled={unreadCount === 0}
                        aria-label="Marcar todas como leídas"
                    >
                        <CheckCheck size={14} />
                        <span>Marcar todas</span>
                    </button>
                </div>

                <div className={styles['topbar-notif-filters']} role="group" aria-label="Filtrar por tipo">
                    <button
                        type="button"
                        className={`${styles['topbar-notif-chip']}${activeFilter === 'all' ? ` ${styles['topbar-notif-chip--active']}` : ''}`}
                        onClick={() => setActiveFilter('all')}
                    >
                        Todas
                    </button>
                    {NOTIF_FILTERS.map((type) => (
                        <button
                            key={type}
                            type="button"
                            className={`${styles['topbar-notif-chip']}${activeFilter === type ? ` ${styles['topbar-notif-chip--active']}` : ''}`}
                            onClick={() => setActiveFilter(type)}
                        >
                            {NOTIF_TYPE_META[type].label}
                        </button>
                    ))}
                </div>

                <div className={styles['topbar-notif-list']} role="list">
                    {filtered.length === 0 ? (
                        <div className={styles['topbar-notif-empty']}>No hay notificaciones</div>
                    ) : (
                        filtered.map((item) => (
                            <div
                                key={item.id}
                                className={`${styles['topbar-notif-item']}${!item.read ? ` ${styles['topbar-notif-item--unread']}` : ''}`}
                                role="listitem"
                            >
                                <span
                                    className={styles['topbar-notif-item-dot']}
                                    style={{ background: NOTIF_TYPE_META[item.type].color }}
                                    aria-hidden="true"
                                />
                                <div className={styles['topbar-notif-item-body']}>
                                    <span className={styles['topbar-notif-item-title']}>{item.title}</span>
                                    {item.description && (
                                        <span className={styles['topbar-notif-item-desc']}>
                                            {item.description}
                                        </span>
                                    )}
                                    <span className={styles['topbar-notif-item-time']}>{item.time}</span>
                                </div>
                                <button
                                    type="button"
                                    className={styles['topbar-notif-item-dismiss']}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        dismiss(item.id);
                                    }}
                                    aria-label="Descartar notificación"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className={styles['topbar-notif-footer']}>
                    <button type="button" className={styles['topbar-notif-footer-link']}>
                        Ver todas
                    </button>
                </div>
            </div>
        </Dropdown>
    );
}

/* -------------------------------------------------------------------------- */
/* AvatarMenu (spec §48)                                                      */
/* -------------------------------------------------------------------------- */

interface AvatarMenuProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initials: string;
    displayName: string;
    email: string | null;
    signingOut: boolean;
    onSignOut: () => void;
    onNavigate: (route: string) => void;
}

function AvatarMenu({
    open,
    onOpenChange,
    initials,
    displayName,
    email,
    signingOut,
    onSignOut,
    onNavigate,
}: AvatarMenuProps) {
    const themeIcon = getCurrentTheme() === 'dark' ? <Sun size={16} /> : <Moon size={16} />;

    // Re-read theme on each open so the icon reflects the current state.
    const [, forceTick] = useState(0);
    useEffect(() => {
        if (open) forceTick((t) => t + 1);
    }, [open]);

    const trigger = (
        <div className={styles['topbar-avatar-trigger']}>
            <Avatar fallback={initials} size="sm" status="online" alt={displayName} />
            <div className={styles['topbar-avatar-info']}>
                <span className={styles['topbar-avatar-name']}>{displayName}</span>
                {email && <span className={styles['topbar-avatar-email']}>{email}</span>}
            </div>
        </div>
    );

    return (
        <Dropdown
            trigger={trigger}
            align="end"
            label="Menú de usuario"
            open={open}
            onOpenChange={onOpenChange}
        >
            <div className={styles['topbar-avatar-menu']} role="menu">
                <div className={styles['topbar-avatar-menu-header']}>
                    <span className={styles['topbar-avatar-menu-name']}>{displayName}</span>
                    {email && <span className={styles['topbar-avatar-menu-email']}>{email}</span>}
                </div>

                <button
                    type="button"
                    role="menuitem"
                    className={styles['topbar-avatar-menu-item']}
                    onClick={() => {
                        onNavigate('/configuracion');
                        onOpenChange(false);
                    }}
                >
                    <span className={styles['topbar-avatar-menu-item-icon']}>
                        <Settings size={16} />
                    </span>
                    <span className={styles['topbar-avatar-menu-item-label']}>Configuración</span>
                </button>

                <button
                    type="button"
                    role="menuitem"
                    className={styles['topbar-avatar-menu-item']}
                    onClick={() => {
                        toggleTheme();
                        forceTick((t) => t + 1);
                    }}
                >
                    <span className={styles['topbar-avatar-menu-item-icon']}>{themeIcon}</span>
                    <span className={styles['topbar-avatar-menu-item-label']}>Tema</span>
                </button>

                <div className={styles['topbar-avatar-menu-divider']} />

                <button
                    type="button"
                    role="menuitem"
                    className={`${styles['topbar-avatar-menu-item']} ${styles['topbar-avatar-menu-item--danger']}`}
                    onClick={onSignOut}
                    disabled={signingOut}
                    aria-busy={signingOut}
                >
                    <span className={styles['topbar-avatar-menu-item-icon']}>
                        {signingOut ? (
                            <span className={styles['topbar-avatar-menu-item-spinner']}>
                                <Spinner size="sm" inline />
                            </span>
                        ) : (
                            <LogOut size={16} />
                        )}
                    </span>
                    <span className={styles['topbar-avatar-menu-item-label']}>
                        {signingOut ? 'Cerrando…' : 'Cerrar Sesión'}
                    </span>
                </button>
            </div>
        </Dropdown>
    );
}
