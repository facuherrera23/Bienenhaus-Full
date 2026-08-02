import { useEffect, useMemo, useState } from 'preact/hooks';
import { ChevronDown, Download, ExternalLink, Loader2, Plus, RefreshCw, Search, ShoppingBag, Trash2, X } from 'lucide-preact';
import { Link, useLocation } from 'wouter-preact';
import { useProperties, useMLMeta, useMLQueue, usePublishToML, useBulkEnqueueMl, STATUS_LABEL, STATUS_TONE, type PropertyRow, type PropertyStatus, type MlMetaRow, type MlQueueRow, type MlOperation } from '../lib/properties.api';
import { queryClient } from '../lib/query/client';
import { pushToast } from '../store/app';

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

function todayStamp(): string {
  return new Date().toISOString().split('T')[0];
}

function toCsv(header: string[], rows: (string | number)[][]): string {
  const escape = (v: string | number) => {
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  return [header.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function MlActionCell({
  property,
  meta,
  queue,
}: {
  property: PropertyRow;
  meta?: MlMetaRow;
  queue: MlQueueRow[];
}) {
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState<MlOperation | null>(null);
  const publishToML = usePublishToML();

  const active = queue.find((q) => q.status === 'pending' || q.status === 'processing');

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['ml-queue'] });
    void queryClient.invalidateQueries({ queryKey: ['ml-meta'] });
    void queryClient.invalidateQueries({ queryKey: ['properties'] });
  };

  const run = async (op: MlOperation) => {
    setBusy(true);
    setCurrent(op);
    try {
      await publishToML.mutateAsync({ p_property_id: property.id, p_operation: op });
      pushToast({
        type: 'success',
        title: op === 'publish' ? 'Publicación encolada' : op === 'update' ? 'Actualización encolada' : 'Baja encolada',
      });
      invalidate();
    } catch (err) {
      pushToast({ type: 'error', title: 'No se pudo encolar', description: (err as Error).message });
    } finally {
      setBusy(false);
      setCurrent(null);
    }
  };

  if (active) {
    return (
      <span className={`badge badge--${active.status === 'processing' ? 'warning' : 'neutral'}`}>
        {active.status === 'processing' ? 'Sincronizando' : 'En cola'}
      </span>
    );
  }

  if (meta) {
    const closed = meta.status === 'closed' || meta.status === 'paused';
    return (
      <div className="row-actions">
        {meta.permalink && (
          <a href={meta.permalink} target="_blank" rel="noreferrer" className="icon-btn" title="Ver en Mercado Libre">
            <ExternalLink size={13} />
          </a>
        )}
        {closed ? (
          <button
            type="button"
            className="icon-btn"
            title="Republicar en Mercado Libre"
            disabled={busy || property.status !== 'publicada'}
            onClick={() => run('publish')}
          >
            {busy && current === 'publish' ? <Loader2 size={13} className="spin" /> : <ShoppingBag size={13} />}
          </button>
        ) : (
          <button
            type="button"
            className="icon-btn"
            title="Actualizar en Mercado Libre"
            disabled={busy}
            onClick={() => run('update')}
          >
            {busy && current === 'update' ? <Loader2 size={13} className="spin" /> : <RefreshCw size={13} />}
          </button>
        )}
        <button
          type="button"
          className="icon-btn icon-btn--danger"
          title="Quitar de Mercado Libre"
          disabled={busy}
          onClick={() => run('delete')}
        >
          <Trash2 size={13} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="btn btn--sm btn--secondary"
      title={
        property.status !== 'publicada'
          ? 'Publicá la propiedad para poder subirla a Mercado Libre'
          : 'Publicar en Mercado Libre'
      }
      disabled={busy || property.status !== 'publicada'}
      onClick={() => run('publish')}
    >
      {busy && current === 'publish' ? <Loader2 size={13} className="spin" /> : <ShoppingBag size={13} />} Publicar
    </button>
  );
}

export function PropertiesPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | PropertyStatus>('todos');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkOp, setBulkOp] = useState<'publish' | 'update' | 'delete' | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const { data, isPending, isError } = useProperties({
    search,
    status: statusFilter === 'todos' ? undefined : statusFilter,
  });
  const properties = getListData<PropertyRow>(data);

  const { data: mlMetaRaw } = useMLMeta();
  const { data: mlQueueRaw } = useMLQueue();
  const bulkEnqueueMl = useBulkEnqueueMl();

  const mlMeta = getListData<MlMetaRow>(mlMetaRaw);
  const mlQueue = getListData<MlQueueRow>(mlQueueRaw);

  const metaByProp = useMemo(() => new Map(mlMeta.map((m) => [m.property_id, m])), [mlMeta]);
  const queueByProp = useMemo(() => {
    const map = new Map<string, MlQueueRow[]>();
    for (const q of mlQueue) {
      const list = map.get(q.property_id) ?? [];
      list.push(q);
      map.set(q.property_id, list);
    }
    return map;
  }, [mlQueue]);

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

  const allSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id));
  const someSelected = selectedIds.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

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

  const runBulk = async (op: 'publish' | 'update' | 'delete') => {
    setBulkBusy(true);
    setBulkOp(op);
    try {
      await bulkEnqueueMl.mutateAsync({ propertyIds: Array.from(selectedIds), operation: op });
      pushToast({
        type: 'success',
        title: `${op === 'publish' ? 'Publicaciones' : op === 'update' ? 'Actualizaciones' : 'Bajas'} encoladas`,
        description: `${selectedIds.size} propiedad${selectedIds.size === 1 ? '' : 'es'}`,
      });
      clearSelection();
      void queryClient.invalidateQueries({ queryKey: ['ml-queue'] });
      void queryClient.invalidateQueries({ queryKey: ['ml-meta'] });
    } catch (err) {
      pushToast({ type: 'error', title: 'No se pudo encolar', description: (err as Error).message });
    } finally {
      setBulkBusy(false);
      setBulkOp(null);
    }
  };

  const handleBulkConfirm = () => {
    if (bulkOp) runBulk(bulkOp);
  };

  const openBulkMenu = (op: MlOperation) => setBulkOp(op);

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

      {someSelected && (
        <div className="bulk-bar">
          <div className="bulk-info">
            <span>{selectedIds.size} seleccionada{selectedIds.size === 1 ? '' : 's'}</span>
            <button type="button" className="btn btn--ghost btn--sm" onClick={clearSelection}>
              <X size={14} /> Limpiar
            </button>
          </div>
          <div className="bulk-actions">
            <div className="dropdown-wrapper">
              <button
                className={`dropdown-trigger${bulkOp ? ' open' : ''}`}
                onClick={() => setBulkOp(bulkOp ? null : 'publish')}
              >
                <ShoppingBag size={15} /> Acciones en lote <ChevronDown size={12} />
              </button>
              {bulkOp && (
                <ul className="dropdown-menu open" role="menu">
                  <li role="menuitem" onClick={() => openBulkMenu('publish')}>
                    <ShoppingBag size={14} /> Publicar en ML
                  </li>
                  <li role="menuitem" onClick={() => openBulkMenu('update')}>
                    <RefreshCw size={14} /> Actualizar en ML
                  </li>
                  <li role="menuitem" onClick={() => openBulkMenu('delete')}>
                    <Trash2 size={14} /> Quitar de ML
                  </li>
                </ul>
              )}
            </div>
            {bulkOp && (
              <div className="bulk-confirm">
                <span>¿{bulkOp === 'publish' ? 'Publicar' : bulkOp === 'update' ? 'Actualizar' : 'Quitar'} {selectedIds.size} propiedad{selectedIds.size === 1 ? '' : 'es'}?</span>
                <button className="btn btn--secondary btn--sm" onClick={() => setBulkOp(null)}>
                  Cancelar
                </button>
                <button className="btn btn--primary btn--sm" onClick={handleBulkConfirm} disabled={bulkBusy}>
                  {bulkBusy ? <Loader2 size={14} className="spin" /> : 'Confirmar'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
                <th style="width:44px;">
                  <input
                    type="checkbox"
                    className="table-select-all"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Seleccionar todas"
                  />
                </th>
                <th>Propiedad</th>
                <th>Estado</th>
                <th>Operación</th>
                <th>Precio</th>
                <th>Zona</th>
                <th>Dorm.</th>
                <th>Actualizada</th>
                <th>Mercado Libre</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isSelected = selectedIds.has(p.id);
                return (
                  <tr
                    key={p.id}
                    className={`row-click${isSelected ? ' selected' : ''}`}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('input,button,a,.icon-btn')) return;
                      setLocation(`/propiedades/${p.id}`);
                    }}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(p.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Seleccionar ${p.title}`}
                      />
                    </td>
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
                    <td onClick={(e) => e.stopPropagation()}>
                      <MlActionCell property={p} meta={metaByProp.get(p.id)} queue={queueByProp.get(p.id) ?? []} />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="empty-cell">
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