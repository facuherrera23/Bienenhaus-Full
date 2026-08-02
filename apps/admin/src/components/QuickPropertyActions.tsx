import { Building2 } from 'lucide-preact';
import { Link } from 'wouter-preact';
import {
  STATUS_LABEL,
  STATUS_TONE,
  fetchProperties,
  updatePropertyStatus,
  type PropertyRow,
  type PropertyStatus,
} from '../lib/properties';
import { queryClient } from '../lib/query/client';
import { useQuery } from '../lib/query/hooks';
import { pushToast } from '../store/app';

const STATUSES = Object.keys(STATUS_LABEL) as PropertyStatus[];

export function QuickPropertyActions() {
  const { data, isPending, isError } = useQuery<PropertyRow[]>({
    queryKey: ['properties'],
    queryFn: fetchProperties,
  });

  const recent = (data ?? []).slice(0, 6);

  const handleStatus = async (p: PropertyRow, status: PropertyStatus) => {
    try {
      await updatePropertyStatus(p.id, status);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['properties'] }),
        queryClient.invalidateQueries({ queryKey: ['recent-activity'] }),
      ]);
      pushToast({
        type: 'success',
        title: 'Estado actualizado',
        description: `${p.title} → ${STATUS_LABEL[status]}`,
      });
    } catch {
      pushToast({ type: 'error', title: 'No se pudo actualizar el estado' });
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

      {isPending && <div className="placeholder-card">Cargando propiedades…</div>}
      {isError && <div className="placeholder-card">No se pudieron cargar las propiedades.</div>}

      {!isPending && !isError && recent.length === 0 && (
        <div className="placeholder-card">Todavía no hay propiedades.</div>
      )}

      {!isPending && !isError && recent.length > 0 && (
        <ul className="quick-list">
          {recent.map((p) => (
            <li className="quick-item" key={p.id}>
              {p.cover_url ? (
                <img className="quick-thumb" src={p.cover_url} alt="" loading="lazy" />
              ) : (
                <span className="quick-thumb quick-thumb--placeholder" aria-hidden="true">
                  <Building2 size={16} />
                </span>
              )}
              <div className="quick-body">
                <p className="quick-title">{p.title}</p>
                <p className="quick-meta">
                  {p.location} · {p.code}
                </p>
              </div>
              <select
                className={`select select--sm badge-select badge--${STATUS_TONE[p.status]}`}
                value={p.status}
                aria-label={`Estado de ${p.title}`}
                onChange={(e) => handleStatus(p, (e.currentTarget as HTMLSelectElement).value as PropertyStatus)}
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
