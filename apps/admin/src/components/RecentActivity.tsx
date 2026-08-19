import {
    Activity,
    ArrowRightLeft,
    Globe,
    LogIn,
    LogOut,
    Pencil,
    Plus,
    RefreshCw,
    ShoppingBag,
    Trash2,
} from 'lucide-preact';
import {
    type ActivityAction,
    type ActivityRow,
    fetchRecentActivity,
} from '../lib/activity';
import { STATUS_LABEL as PROPERTY_STATUS_LABEL } from '../types/properties';
import type { PropertyStatus } from '../types/properties';
import { useQuery } from '../lib/query/hooks';
import styles from './RecentActivity.module.css';

const ICON_BY_ACTION: Record<ActivityAction, typeof Plus> = {
    create: Plus,
    update: Pencil,
    delete: Trash2,
    publish: Globe,
    unpublish: Globe,
    login: LogIn,
    logout: LogOut,
    ml_publish: ShoppingBag,
    ml_update: ShoppingBag,
    ml_delete: ShoppingBag,
    ml_sync: RefreshCw,
    status_change: ArrowRightLeft,
};

function describe(row: ActivityRow): { title: string; detail: string } {
    const meta = row.metadata as { title?: string; status?: string };
    const title = meta.title ? `«${meta.title}»` : '';

    switch (row.action) {
        case 'create':
            return { title: `Creó la propiedad ${title}`, detail: 'Nueva propiedad creada' };
        case 'update':
            return { title: `Actualizó la propiedad ${title}`, detail: 'Datos modificados' };
        case 'status_change': {
            const label = meta.status
                ? (PROPERTY_STATUS_LABEL[meta.status as PropertyStatus] ?? meta.status)
                : '';
            return {
                title: `Cambió el estado de la propiedad ${title}`,
                detail: label ? `→ ${label}` : '',
            };
        }
        case 'publish':
            return {
                title: `Publicó la propiedad ${title}`,
                detail: 'Pasó a estar visible en la web',
            };
        case 'unpublish':
            return {
                title: `Despublicó la propiedad ${title}`,
                detail: 'Ya no está visible en la web',
            };
        case 'ml_publish':
            return { title: `Publicó en Mercado Libre ${title}`, detail: 'Publicación creada' };
        case 'ml_update':
            return {
                title: `Actualizó en Mercado Libre ${title}`,
                detail: 'Publicación sincronizada',
            };
        case 'ml_delete':
            return { title: `Quitó de Mercado Libre ${title}`, detail: 'Publicación eliminada' };
        case 'ml_sync':
            return {
                title: 'Sincronizó Mercado Libre',
                detail: 'Cola de sincronización procesada',
            };
        case 'login':
            return { title: 'Inició sesión', detail: 'Acceso al panel' };
        case 'logout':
            return { title: 'Cerró sesión', detail: 'Salida del panel' };
        default:
            return { title: `Acción ${row.action}`, detail: `${row.entity_type}` };
    }
}

function timeAgo(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diffMs / 1000);
    if (s < 60) return 'hace un momento';
    const m = Math.floor(s / 60);
    if (m < 60) return `hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24);
    if (d < 7) return d === 1 ? 'hace 1 día' : `hace ${d} días`;
    const w = Math.floor(d / 7);
    if (w < 4) return w === 1 ? 'hace 1 semana' : `hace ${w} semanas`;
    const mo = Math.floor(d / 30);
    if (mo < 12) return mo === 1 ? 'hace 1 mes' : `hace ${mo} meses`;
    const y = Math.floor(d / 365);
    return y === 1 ? 'hace 1 año' : `hace ${y} años`;
}

export function RecentActivity() {
    const { data, isPending, isError } = useQuery<ActivityRow[]>({
        queryKey: ['recent-activity'],
        queryFn: () => fetchRecentActivity(12),
    });

    return (
        <div className="card">
            <div className="card-head">
                <h3>Actividad reciente</h3>
                {!isPending && !isError && (
                    <span className="muted">{data?.length ?? 0} registros</span>
                )}
            </div>

            {isPending && <div className="placeholder-card">Cargando actividad…</div>}
            {isError && <div className="placeholder-card">No se pudo cargar la actividad.</div>}

            {!isPending && !isError && (data?.length ?? 0) === 0 && (
                <div className={styles['activity-empty']}>
                    <Activity size={28} strokeWidth={1.6} aria-hidden="true" />
                    <p className={styles['activity-empty-title']}>Sin actividad aún</p>
                    <p className={styles['activity-empty-hint']}>
                        Las acciones del panel aparecerán aquí.
                    </p>
                </div>
            )}

            {!isPending && !isError && (data?.length ?? 0) > 0 && (
                <ul className={styles['activity-list']}>
                    {data!.map((row) => {
                        const { title, detail } = describe(row);
                        const Icon = ICON_BY_ACTION[row.action] ?? Plus;
                        return (
                            <li className={styles['activity-item']} key={row.id}>
                                <span
                                    className={`${styles['activity-icon']} is-${row.action}`}
                                    aria-hidden="true"
                                >
                                    <Icon size={15} strokeWidth={1.9} />
                                </span>
                                <div className={styles['activity-body']}>
                                    <p className={styles['activity-title']}>{title}</p>
                                    <p className={styles['activity-meta']}>
                                        {detail && <span>{detail} · </span>}
                                        {row.actor_name ?? row.actor_email ?? 'Sistema'} ·{' '}
                                        {timeAgo(row.created_at)}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
