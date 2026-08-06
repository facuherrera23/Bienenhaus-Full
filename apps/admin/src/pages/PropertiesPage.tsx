import { useEffect, useMemo, useState } from 'preact/hooks';
import { Download, Plus, Search } from 'lucide-preact';
import { Link, useLocation } from 'wouter-preact';
import { useProperties, useMLMeta, STATUS_LABEL, STATUS_TONE, type PropertyRow, type PropertyStatus, type MlMetaRow } from '../lib/properties.api';
import { getListData as getListDataUtil, todayStamp, toCsv, downloadCsv } from '../lib/utils';

function StatusBadge({ status }: { status: PropertyStatus }) {
  return <span className={`badge badge--${STATUS_TONE[status]}`}>{STATUS_LABEL[status]}</span>;
}

function formatPrice(row: PropertyRow): string {
  if (row.price === null) return '—';
  return `${row.currency} ${row.price.toLocaleString('es-AR')}`;
}

function getListData<T>(data: unknown): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  if (typeof data === 'object' && data !== null && 'data' in data) {
    return (data as { data: T[] }).data ?? [];
  }
  return [];
}

export function PropertiesPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | PropertyStatus>('todos');

  const { data, isPending, isError } = useProperties({
    search,
    status: statusFilter === 'todos' ? undefined : statusFilter,
  });
  const properties = getListDataUtil<PropertyRow>(data);

  const { data: mlMetaRaw } = useMLMeta();

  const mlMeta = getListData<MlMetaRow>(mlMetaRaw);

  const metaByProp = useMemo(() => new Map(mlMeta.map((m) => [m.property_id, m])), [mlMeta]);

  useEffect(() => {
    document.title = 'Propiedades · BIENENHAUS';
    return () => {
      document.title = 'BIENENHAUS — Panel de Administración';
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return properties.filter((p) => {
      const matchesSearch =
        q === '' ||
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'todos' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [properties, search, statusFilter]);

  const handleExport = () => {
    if (properties.length === 0) return;

    const header = [
      'Título', 'Código', 'Estado', 'Operación', 'Precio', 'Moneda', 'Zona',
      'Sup. Total', 'Dorm.', 'Baños', 'Destacada', 'Actualizada',
      'En ML', 'Item ML', 'Estado ML', 'Precio ML', 'Última Sync', 'Link ML'
    ];
    const rows = properties.map((p) => {
      const meta = metaByProp.get(p.id);
      return [
        p.title,
        p.code,
        STATUS_LABEL[p.status],
        p.listing_type,
        p.price ?? '',
        p.currency,
        p.location,
        p.area_total ?? '',
        p.bedrooms ?? '',
        p.bathrooms ?? '',
        p.featured ? 'Sí' : 'No',
        new Date(p.updated_at).toLocaleDateString('es-AR'),
        meta ? 'Sí' : 'No',
        meta?.ml_item_id ?? '',
        meta?.status ?? '',
        meta?.price ?? '',
        meta?.last_sync_at ? new Date(meta.last_sync_at).toLocaleDateString('es-AR') : '',
        meta?.permalink ?? '',
      ];
    });
    downloadCsv(`propiedades-${todayStamp()}.csv`, toCsv(header, rows));
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2 className="page-title">Propiedades</h2>
          <p className="page-subtitle">Gestioná el catálogo completo de tu inmobiliaria.</p>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <button type="button" className="btn btn--secondary" onClick={handleExport} disabled={properties.length === 0}>
            <Download size={15} /> Exportar CSV
          </button>
          <Link href="/propiedades/nueva" className="btn btn--primary">
            <Plus size={16} /> Nueva propiedad
          </Link>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Buscar por título o zona…"
            value={search}
            onInput={(e) => setSearch((e.currentTarget as HTMLInputElement).value)}
          />
        </div>
        <select
          className="select"
          value={statusFilter}
          onChange={(e) => setStatusFilter((e.currentTarget as HTMLSelectElement).value as 'todos' | PropertyStatus)}
        >
          <option value="todos">Todos los estados</option>
          {(Object.keys(STATUS_LABEL) as PropertyStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {isPending && <div className="card placeholder-card">Cargando propiedades…</div>}
      {isError && <div className="card placeholder-card">No se pudieron cargar las propiedades.</div>}

      {!isPending && !isError && (
        <div className="card table-card">
          <table className="table">
            <thead>
              <tr>
                <th>Propiedad</th>
                <th>Estado</th>
                <th>Operación</th>
                <th>Precio</th>
                <th>Zona</th>
                <th>Dorm.</th>
                <th>Actualizada</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                return (
                  <tr
                    key={p.id}
                    className="row-click"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('input,button,a,.icon-btn')) return;
                      setLocation(`/propiedades/${p.id}`);
                    }}
                  >
                    <td>
                      <div className="cell-property">
                        {p.cover_url ? (
                          <img src={p.cover_url} alt="" loading="lazy" />
                        ) : (
                          <span className="cell-thumb" aria-hidden="true" />
                        )}
                        <div>
                          <strong>{p.title}</strong>
                          <span className="muted">#{String(p.code).padStart(4, '0')}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="cap">{p.listing_type}</td>
                    <td className="num">{formatPrice(p)}</td>
                    <td>{p.location}</td>
                    <td className="num">{p.bedrooms ?? '—'}</td>
                    <td className="muted">{new Date(p.updated_at).toLocaleDateString('es-AR')}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    No hay propiedades que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}