import { Building2 } from 'lucide-preact';
import { Link } from 'wouter-preact';
import { useQueryClient } from '@tanstack/react-query';
import { useRef } from 'preact/hooks';
import {
    type PropertyRow,
    type PropertyStatus,
    STATUS_LABEL,
    STATUS_TONE,
    useUpdateProperty,
} from '../lib/properties.api';
import { pushToast } from '../store/app';
import styles from './QuickPropertyActions.module.css';


const STATUSES = Object.keys(STATUS_LABEL) as PropertyStatus[];

interface QuickPropertyActionsProps {
    properties: PropertyRow[];
}

export function QuickPropertyActions({ properties }: QuickPropertyActionsProps) {
    const recent = properties.slice(0, 6);

    const updateProperty = useUpdateProperty();
    const queryClient = useQueryClient();
    const lastErrorToastRef = useRef<number>(0);

    const handleStatus = async (p: PropertyRow, status: PropertyStatus) => {
        try {
            await updateProperty.mutateAsync({ id: p.id, body: { status } });
            queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
            pushToast({
                type: 'success',
                title: 'Estado actualizado',
                description: `${p.title} → ${STATUS_LABEL[status]}`,
            });
        } catch {
            const now = Date.now();
            if (now - lastErrorToastRef.current > 3000) {
                lastErrorToastRef.current = now;
                pushToast({ type: 'error', title: 'No se pudo actualizar el estado' });
            }
        }
    };

    return (
        <div className="card">
            <div className="card-head">
                <h3>Acciones rápidas</h3>
                <Link href="/propiedades" className="btn btn--sm btn--secondary">
                    Ver todas
                </Link>
            </div>

            {recent.length === 0 && (
                <div className="placeholder-card">Todavía no hay propiedades.</div>
            )}

            {recent.length > 0 && (
                <ul className={styles['quick-list']}>
                    {recent.map((p) => (
                        <li className={styles['quick-item']} key={p.id}>
                            {p.cover_url ? (
                                <img
                                    className={styles['quick-thumb']}
                                    src={p.cover_url}
                                    alt=""
                                    loading="lazy"
                                />
                            ) : (
                                <span
                                    className={`${styles['quick-thumb']} ${styles['quick-thumb--placeholder']}`}
                                    aria-hidden="true"
                                >
                                    <Building2 size={16} />
                                </span>
                            )}
                            <div className={styles['quick-body']}>
                                <p className={styles['quick-title']}>{p.title}</p>
                                <p className={styles['quick-meta']}>
                                    {p.location} · {p.code}
                                </p>
                            </div>
                            <select
                                className={`select select--sm badge-select badge--${STATUS_TONE[p.status]}`}
                                value={p.status}
                                aria-label={`Estado de ${p.title}`}
                                onChange={(e) =>
                                    handleStatus(
                                        p,
                                        (e.currentTarget as HTMLSelectElement)
                                            .value as PropertyStatus,
                                    )
                                }
                            >
                                {STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                        {STATUS_LABEL[s]}
                                    </option>
                                ))}
                            </select>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
