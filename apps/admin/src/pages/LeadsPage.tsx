import { useEffect, useMemo, useState } from 'preact/hooks';
import { Download, Loader2, Plus, Search, Trash2, UserPlus, ChevronDown, Upload, Kanban, List, X, AlertTriangle } from 'lucide-preact';
import { Link, useLocation } from 'wouter-preact';
import { downloadCsv, toCsv, todayStamp } from '../lib/csv';
import {
  LEAD_INTENT_LABEL,
  LEAD_SOURCE_LABEL,
  LEAD_STATUS_LABEL,
  LEAD_STATUS_TONE,
  bulkAutoAssignLeads,
  fetchLeads,
  softDeleteLead,
  updateLeadStatus,
  bulkRecalculateScores,
  addLeadTag,
  removeLeadTag,
  type LeadIntent,
  type LeadSource,
  type LeadRow,
  type LeadStatus,
} from '../lib/leads';
import { queryClient } from '../lib/query/client';
import { useQuery, useMutation } from '../lib/query/hooks';
import { pushToast } from '../store/app';

const STATUS_ORDER: LeadStatus[] = ['nuevo', 'contactado', 'calificado', 'en_proceso', 'cerrado_ganado', 'cerrado_perdido'];

export function LeadsPage() {
  const [, setLocation] = useLocation();
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | LeadStatus>('todos');
  const [intentFilter, setIntentFilter] = useState<'todos' | LeadIntent>('todos');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkOp, setBulkOp] = useState<'assign' | 'trash' | 'recalc' | 'tags' | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<{ valid: any[]; errors: any[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState<string | null>(null);

  const { data, isPending, isError } = useQuery<LeadRow[]>({
    queryKey: ['leads'],
    queryFn: fetchLeads,
  });

  const recalcMutation = useMutation({
    mutationFn: bulkRecalculateScores,
    onSuccess: (updated) => {
      pushToast({ type: 'success', title: 'Scores recalculados', description: `${updated} leads actualizados` });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: () => pushToast({ type: 'error', title: 'Error recalculando scores' }),
  });

  useEffect(() => {
    document.title = 'Leads · BIENENHAUS';
    return () => { document.title = 'BIENENHAUS — Panel de Administración'; };
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.filter((l) => {
      const matchesSearch = q === '' ||
        `${l.name} ${l.last_name}`.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.phone ?? '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'todos' || l.status === statusFilter;
      const matchesIntent = intentFilter === 'todos' || l.intent === intentFilter;
      return matchesSearch && matchesStatus && matchesIntent;
    });
  }, [data, search, statusFilter, intentFilter]);

  const allSelected = filtered.length > 0 && filtered.every((l) => selectedIds.has(l.id));
  const someSelected = selectedIds.size > 0;

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((l) => l.id)));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const runBulkAutoAssign = async () => {
    setBulkBusy(true);
    try {
      const res = await bulkAutoAssignLeads(Array.from(selectedIds));
      clearSelection();
      pushToast({ type: 'success', title: 'Auto-asignación completada', description: `${res.assigned} lead${res.assigned === 1 ? '' : 's'} asignado${res.assigned === 1 ? '' : 's'}${res.skipped ? `, ${res.skipped} sin agente` : ''}` });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    } catch { pushToast({ type: 'error', title: 'No se pudo auto-asignar' }); }
    finally { setBulkBusy(false); }
  };

  const runBulkTrash = async () => {
    setBulkBusy(true);
    try {
      for (const id of selectedIds) await softDeleteLead(id);
      clearSelection();
      pushToast({ type: 'success', title: 'Leads movidos a papelera', description: `${selectedIds.size} lead${selectedIds.size === 1 ? '' : 's'}` });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    } catch { pushToast({ type: 'error', title: 'No se pudo mover a papelera' }); }
    finally { setBulkBusy(false); }
  };

  const runBulkRecalc = () => { recalcMutation.mutate(Array.from(selectedIds)); clearSelection(); };

  const handleTagAction = async (leadId: string, tag: string, action: 'add' | 'remove') => {
    try {
      if (action === 'add') await addLeadTag(leadId, tag);
      else await removeLeadTag(leadId, tag);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      pushToast({ type: 'success', title: action === 'add' ? 'Tag agregado' : 'Tag removido' });
    } catch { pushToast({ type: 'error', title: 'Error actualizando tag' }); }
  };

  const handleImportFile = (e: Event) => {
    const file = (e.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    setImportFile(file);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const { parseLeadsCsv } = await import('../lib/leads');
      const result = await parseLeadsCsv(e.target?.result as string);
      setImportPreview(result);
      setShowImport(true);
    };
    reader.readAsText(file);
  };

  const confirmImport = async () => {
    if (!importPreview || importing) return;
    setImporting(true);
    try {
      const { bulkImportLeads } = await import('../lib/leads');
      const res = await bulkImportLeads(importPreview.valid);
      pushToast({ type: 'success', title: 'Importación completada', description: `${res.created} leads creados${res.errors.length ? `, ${res.errors.length} errores` : ''}` });
      setShowImport(false);
      setImportPreview(null);
      setImportFile(null);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    } catch { pushToast({ type: 'error', title: 'Error importando' }); }
    finally { setImporting(false); }
  };

  const handleExport = () => {
    if (filtered.length === 0) return;
    downloadCsv(`leads-${todayStamp()}.csv`, toCsv(
      ['Nombre', 'Apellido', 'Email', 'Teléfono', 'Ciudad', 'Intención', 'Origen', 'Estado', 'Score', 'Tags', 'Asignado', 'Recibido'],
      filtered.map((l) => [
        l.name, l.last_name, l.email, l.phone ?? '', l.city ?? '',
        LEAD_INTENT_LABEL[l.intent], LEAD_SOURCE_LABEL[l.source], LEAD_STATUS_LABEL[l.status],
        l.score ?? 0, (l.tags ?? []).join('; '), l.agent ?? '', new Date(l.created_at).toLocaleDateString('es-AR'),
      ]),
    ));
  };

  const handleStatusChange = async (lead: LeadRow, status: LeadStatus) => {
    try {
      await updateLeadStatus(lead.id, status);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      pushToast({ type: 'success', title: 'Estado actualizado', description: `${lead.name} → ${LEAD_STATUS_LABEL[status]}` });
    } catch { pushToast({ type: 'error', title: 'No se pudo actualizar' }); }
  };

  const getKanbanColumns = () => STATUS_ORDER.map(status => ({
    status,
    leads: filtered.filter(l => l.status === status),
  }));

  const getScoreColor = (score: number) => score >= 70 ? 'success' : score >= 40 ? 'warning' : 'danger';

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2 className="page-title">Leads</h2>
          <p className="page-subtitle">Pipeline comercial y gestión de contactos.</p>
        </div>
        <div className="page-head-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="view-toggle" style={{ display: 'flex', border: '1px solid var(--bh-border)', borderRadius: '8px', overflow: 'hidden' }}>
            <button className={`btn btn--sm${view === 'table' ? ' btn--primary' : ' btn--ghost'}`} onClick={() => setView('table')}>
              <List size={15} />
            </button>
            <button className={`btn btn--sm${view === 'kanban' ? ' btn--primary' : ' btn--ghost'}`} onClick={() => setView('kanban')}>
              <Kanban size={15} />
            </button>
          </div>
          <Link href="/leads/nueva" className="btn btn--primary"><Plus size={16} /> Nuevo lead</Link>
          <button className="btn btn--secondary" onClick={handleExport} disabled={filtered.length === 0}><Download size={15} /> Exportar CSV</button>
          <label className="btn btn--secondary" style={{ cursor: 'pointer' }}>
            <Upload size={15} /> Importar CSV
            <input type="file" accept=".csv" onChange={handleImportFile} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {someSelected && (
        <div className="bulk-bar">
          <div className="bulk-info"><span>{selectedIds.size} seleccionado{selectedIds.size === 1 ? '' : 's'}</span><button className="btn btn--ghost btn--sm" onClick={clearSelection}>Limpiar</button></div>
          <div className="bulk-actions">
            <div className="dropdown-wrapper">
              <button className={`dropdown-trigger${bulkOp ? ' open' : ''}`} onClick={() => setBulkOp(bulkOp ? null : 'assign')}>
                <UserPlus size={15} /> Acciones <ChevronDown size={12} />
              </button>
              {bulkOp && (
                <ul className="dropdown-menu open" role="menu">
                  <li role="menuitem" onClick={() => setBulkOp('assign')}><UserPlus size={14} /> Auto-asignar</li>
                  <li role="menuitem" onClick={() => setBulkOp('trash')}><Trash2 size={14} /> Papelera</li>
                  <li role="menuitem" onClick={() => setBulkOp('recalc')}>📊 Recalcular score</li>
                  <li role="menuitem" onClick={() => setBulkOp('tags')}>🏷️ Gestionar tags</li>
                </ul>
              )}
            </div>
            {bulkOp && (
              <div className="bulk-confirm">
                <span>{bulkOp === 'assign' ? 'Auto-asignar' : bulkOp === 'trash' ? 'Mover a papelera' : bulkOp === 'recalc' ? 'Recalcular score' : 'Gestionar tags'} {selectedIds.size} lead{selectedIds.size === 1 ? '' : 's'}?</span>
                <button className="btn btn--secondary btn--sm" onClick={() => setBulkOp(null)}>Cancelar</button>
                <button className="btn btn--primary btn--sm" onClick={bulkOp === 'assign' ? runBulkAutoAssign : bulkOp === 'trash' ? runBulkTrash : bulkOp === 'recalc' ? runBulkRecalc : undefined} disabled={bulkBusy || bulkOp === 'tags'}>
                  {bulkBusy ? <Loader2 size={14} className="spin" /> : 'Confirmar'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="toolbar">
        <div className="toolbar-search"><Search size={15} /><input type="text" placeholder="Buscar por nombre, email o teléfono…" value={search} onInput={e => setSearch(e.currentTarget.value)} /></div>
        <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.currentTarget.value as 'todos' | LeadStatus)}>
          <option value="todos">Todos los estados</option>
          {(Object.keys(LEAD_STATUS_LABEL) as LeadStatus[]).map(s => <option key={s} value={s}>{LEAD_STATUS_LABEL[s]}</option>)}
        </select>
        <select className="select" value={intentFilter} onChange={e => setIntentFilter(e.currentTarget.value as 'todos' | LeadIntent)}>
          <option value="todos">Toda intención</option>
          {(Object.keys(LEAD_INTENT_LABEL) as LeadIntent[]).map(i => <option key={i} value={i}>{LEAD_INTENT_LABEL[i]}</option>)}
        </select>
      </div>

      {isPending && <div className="card placeholder-card"><Loader2 size={24} className="spin" /> Cargando leads…</div>}
      {isError && <div className="card placeholder-card">No se pudieron cargar los leads.</div>}

      {!isPending && !isError && view === 'table' && (
        <div className="card table-card">
          <table className="table">
            <thead><tr>
              <th style={{width: '44px'}}><input type="checkbox" className="table-select-all" checked={allSelected} onChange={toggleAll} aria-label="Seleccionar todos" /></th>
              <th>Contacto</th><th>Intención</th><th>Teléfono</th><th>Origen</th><th>Estado</th><th>Score</th><th>Tags</th><th>Asignado</th><th>Recibido</th>
            </tr></thead>
            <tbody>
              {filtered.map(l => {
                const isSelected = selectedIds.has(l.id);
                return <tr key={l.id} className={`row-click${isSelected ? ' selected' : ''}`} onClick={e => { if ((e.target as HTMLElement).closest('input,button,a,.icon-btn,select,.tag')) return; setLocation(`/leads/${l.id}`); }}>
                  <td><input type="checkbox" checked={isSelected} onChange={() => toggleOne(l.id)} onClick={e => e.stopPropagation()} aria-label={`Seleccionar ${l.name}`} /></td>
                  <td><div className="cell-property"><span className="cell-avatar">{(l.name[0]??'').toUpperCase()}</span><div><strong>{l.name} {l.last_name}</strong><span className="muted">{l.email}</span></div></div></td>
                  <td>{LEAD_INTENT_LABEL[l.intent]}</td>
                  <td className="muted">{l.phone ?? '—'}</td>
                  <td className="cap">{LEAD_SOURCE_LABEL[l.source]}</td>
                  <td onClick={e => e.stopPropagation()}><select className={`select select--sm badge-select badge--${LEAD_STATUS_TONE[l.status]}`} value={l.status} onChange={e => handleStatusChange(l, e.currentTarget.value as LeadStatus)}>{(Object.keys(LEAD_STATUS_LABEL) as LeadStatus[]).map(s => <option key={s} value={s}>{LEAD_STATUS_LABEL[s]}</option>)}</select></td>
                  <td><span className={`badge badge--${getScoreColor(l.score ?? 0)}`}>{l.score ?? 0}</span></td>
                  <td style={{maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                    {(l.tags ?? []).slice(0, 3).map(t => <span key={t} className="tag badge badge--neutral" style={{marginRight: '4px', fontSize: '11px'}}>{t}</span>)}
                    {(l.tags ?? []).length > 3 && <span className="badge badge--neutral" style={{fontSize: '11px'}}>+{(l.tags ?? []).length - 3}</span>}
                  </td>
                  <td className="muted">{l.agent ?? '—'}</td>
                  <td className="muted">{new Date(l.created_at).toLocaleDateString('es-AR')}</td>
                </tr>;
              })}
              {filtered.length === 0 && <tr><td colSpan={10} className="empty-cell">No hay leads que coincidan.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {!isPending && !isError && view === 'kanban' && (
        <div className="kanban-board">
          {getKanbanColumns().map(col => (
            <div key={col.status} className="kanban-column">
              <div className="kanban-column-header badge badge--{LEAD_STATUS_TONE[col.status]}" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '8px 8px 0 0', minWidth: '280px' }}>
                <span>{LEAD_STATUS_LABEL[col.status]}</span>
                <span className="kanban-count" style={{background: 'rgba(0,0,0,0.1)', padding: '2px 8px', borderRadius: '999px', fontSize: '12px'}}>{col.leads.length}</span>
              </div>
              <div className="kanban-column-body" style={{minHeight: '400px', minWidth: '280px', padding: '8px', background: 'var(--bh-bg-hover)', borderRadius: '0 0 8px 8px'}}>
                {col.leads.length === 0 && <div className="kanban-empty" style={{textAlign: 'center', color: 'var(--bh-text-tertiary)', padding: '24px'}}>Sin leads</div>}
                {col.leads.map(l => (
                  <div key={l.id} className="kanban-card" style={{background: 'var(--bh-bg-card)', border: '1px solid var(--bh-border)', borderRadius: '8px', padding: '12px', marginBottom: '8px', boxShadow: 'var(--bh-shadow-sm)', cursor: 'pointer'}} onClick={e => { if ((e.target as HTMLElement).closest('button,.tag,.tag-input')) return; setLocation(`/leads/${l.id}`); }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                      <span className="badge badge--{LEAD_STATUS_TONE[l.status]}" style={{fontSize: '11px'}}>{LEAD_STATUS_LABEL[l.status]}</span>
                      <span className={`badge badge--${getScoreColor(l.score ?? 0)}`} style={{fontSize: '11px'}}>{l.score ?? 0}</span>
                    </div>
                    <strong style={{display: 'block', marginBottom: '4px'}}>{l.name} {l.last_name}</strong>
                    <span className="muted" style={{fontSize: '12px', display: 'block', marginBottom: '4px'}}>{l.email}</span>
                    {l.phone && <span className="muted" style={{fontSize: '12px', display: 'block', marginBottom: '4px'}}>📞 {l.phone}</span>}
                    {l.tags?.length && <div style={{display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px'}}>{l.tags.map(t => <span key={t} className="tag badge badge--neutral" style={{fontSize: '10px', cursor: 'pointer'}} onClick={e => { e.stopPropagation(); setShowTagInput(l.id); setTagInput(t); }}>{t} <X size={10} /></span>)}</div>}
                    {(l.score ?? 0) < 30 && <div style={{marginTop: '8px', padding: '6px', background: 'var(--bh-danger-soft)', borderRadius: '6px', fontSize: '11px', color: 'var(--bh-danger)'}}><AlertTriangle size={12} /> Score bajo: priorizar contacto</div>}
                    <div style={{display: 'flex', gap: '4px', marginTop: '8px'}}>
                      <button className="btn btn--ghost btn--sm" style={{flex: 1}} onClick={e => { e.stopPropagation(); handleStatusChange(l, STATUS_ORDER[Math.min(STATUS_ORDER.indexOf(l.status) + 1, STATUS_ORDER.length - 1)]); }}><ChevronDown size={12} /> Avanzar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="modal-backdrop" onClick={() => { setShowImport(false); setImportPreview(null); }}>
          <div className="modal-card modal--large" onClick={e => e.stopPropagation()}>
            <div className="modal-head"><h3>Importar Leads desde CSV</h3><button className="icon-btn" onClick={() => { setShowImport(false); setImportPreview(null); }}><X size={20} /></button></div>
            <div className="modal-body">
              {importPreview ? (
                <>
                  <div className="import-summary" style={{display: 'flex', gap: '16px', marginBottom: '16px', padding: '12px', background: 'var(--bh-bg-hover)', borderRadius: '8px'}}>
                    <div className="stat"><strong>{importPreview.valid.length}</strong><span>Válidos</span></div>
                    <div className="stat" style={{color: 'var(--bh-danger)'}}><strong>{importPreview.errors.length}</strong><span>Errores</span></div>
                  </div>
                  {importPreview.errors.length > 0 && (
                    <details style={{marginBottom: '16px'}}><summary style={{cursor: 'pointer', color: 'var(--bh-danger)'}}>Ver errores ({importPreview.errors.length})</summary>
                    <ul style={{maxHeight: '200px', overflow: 'auto', marginTop: '8px', fontSize: '12px', color: 'var(--bh-danger)'}}>
                      {importPreview.errors.slice(0, 20).map((err, i) => <li key={i}>Fila {err.row}: {err.message}</li>)}
                    </ul></details>
                  )}
                  <div style={{maxHeight: '300px', overflow: 'auto', marginBottom: '16px', fontSize: '12px'}}>
                    <table className="table" style={{fontSize: '11px'}}>
                      <thead><tr><th>Nombre</th><th>Apellido</th><th>Email</th><th>Intención</th><th>Origen</th><th>Estado</th></tr></thead>
                      <tbody>{importPreview.valid.slice(0, 20).map((row: any, i: number) => <tr key={i}><td>{row.name}</td><td>{row.last_name}</td><td>{row.email}</td><td>{LEAD_INTENT_LABEL[row.intent as LeadIntent]}</td><td>{LEAD_SOURCE_LABEL[row.source as LeadSource]}</td><td>{LEAD_STATUS_LABEL[(row.status || 'nuevo') as LeadStatus]}</td></tr>)}</tbody>
                    </table>
                    {importPreview.valid.length > 20 && <p className="muted" style={{marginTop: '8px'}}>... y {importPreview.valid.length - 20} más</p>}
                  </div>
                  <div className="modal-actions" style={{marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                    <button className="btn btn--secondary" onClick={() => { setImportPreview(null); setImportFile(null); }}>Volver</button>
                    <button className="btn btn--primary" onClick={confirmImport} disabled={importing}>{importing ? <Loader2 size={14} className="spin" /> : 'Importar'}</button>
                  </div>
                </>
              ) : (
                <div style={{textAlign: 'center', padding: '32px'}}>
                  <Upload size={48} style={{color: 'var(--bh-text-tertiary)', marginBottom: '16px'}} />
                  <p>Arrastra un archivo CSV o haz clic para seleccionar</p>
                  <p className="muted" style={{fontSize: '12px', marginTop: '8px'}}>Columnas requeridas: name, last_name, email, intent, source<br/>Opcionales: phone, city, status, message</p>
                  <input type="file" accept=".csv" onChange={handleImportFile} style={{display: 'none'}} id="csv-import" />
                  <button className="btn btn--primary" style={{marginTop: '16px'}} onClick={() => document.getElementById('csv-import')?.click()}><Upload size={15} /> Seleccionar archivo</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tag input popover */}
      {showTagInput && (
        <div className="tag-popover" style={{position: 'fixed', zIndex: 1000, background: 'var(--bh-bg-card)', border: '1px solid var(--bh-border)', borderRadius: '8px', padding: '8px', boxShadow: 'var(--bh-shadow-lg)'}}>
          <input type="text" value={tagInput} onChange={e => setTagInput(e.currentTarget.value)} placeholder="Nuevo tag..." style={{width: '200px', marginBottom: '8px'}} />
          <div style={{display: 'flex', gap: '4px'}}>
            <button className="btn btn--primary btn--sm" onClick={() => { if (showTagInput && tagInput) { handleTagAction(showTagInput, tagInput, 'add'); setShowTagInput(null); setTagInput(''); } }}><Plus size={12} /> Agregar</button>
            <button className="btn btn--danger btn--sm" onClick={() => { if (showTagInput) { handleTagAction(showTagInput, tagInput, 'remove'); setShowTagInput(null); setTagInput(''); } }}><Trash2 size={12} /> Quitar</button>
          </div>
        </div>
      )}
    </div>
  );
}
