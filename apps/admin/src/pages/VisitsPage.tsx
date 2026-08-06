import { useEffect, useMemo, useState } from 'preact/hooks';
import { Calendar, CalendarClock, ChevronLeft, ChevronRight, Clock, MapPin, Plus, Search, X, QrCode, Loader2 } from 'lucide-preact';
import { supabaseUrl } from '../lib/supabase';
import { useAuthAccessToken } from '../lib/auth';
import {
  fetchVisits,
  fetchVisitsByDateRange,
  createVisit,
  updateVisit,
  type VisitRow,
  type VisitStatus,
  VISIT_STATUS_LABEL,
  MEETING_TYPE_LABEL,
  createRecurringVisit,
  type RecurrenceRule,
} from '../lib/visits';
import { fetchAgents } from '../lib/agents';
import { fetchProperties } from '../lib/properties';
import { fetchLeads } from '../lib/leads';
import { queryClient } from '../lib/query/client';
import { useQuery, useMutation } from '../lib/query/hooks';
import { pushToast } from '../store/app';

const VIEW_MODES = ['month', 'week', 'day'] as const;
type ViewMode = typeof VIEW_MODES[number];

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function VisitsPage() {
  const accessToken = useAuthAccessToken();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedVisit, setSelectedVisit] = useState<VisitRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | VisitStatus>('todos');
  const [agentFilter, setAgentFilter] = useState<string>('todos');
  
  // New features state
  const [showRecurring, setShowRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>({
    frequency: 'weekly',
    interval: 1,
    days_of_week: [],
  });
  const [showQrModal, setShowQrModal] = useState<string | null>(null);
  const [generatingQr, setGeneratingQr] = useState<string | null>(null);

  const { isPending: visitsPending } = useQuery<VisitRow[]>({
    queryKey: ['visits'],
    queryFn: fetchVisits,
  });

  const { data: agents } = useQuery({ queryKey: ['agents'], queryFn: fetchAgents });
  const { data: properties } = useQuery({ queryKey: ['properties'], queryFn: fetchProperties });
  const { data: leads } = useQuery({ queryKey: ['leads'], queryFn: fetchLeads });

  // Mutation for creating recurring visit
  const createRecurringMutation = useMutation({
    mutationFn: ({ visitId, rule }: { visitId: string; rule: RecurrenceRule }) => createRecurringVisit(visitId, rule),
    onSuccess: () => {
      pushToast({ type: 'success', title: 'Visita recurrente creada' });
      setShowRecurring(false);
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
    onError: (err) => pushToast({ type: 'error', title: 'Error', description: (err as Error).message }),
  });

  // QR code generation mutation
  const qrMutation = useMutation({
    mutationFn: async (visitId: string) => {
      if (!accessToken) throw new Error('No hay sesión activa');
      const res = await fetch(`${supabaseUrl}/functions/v1/qr-checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ visitId }),
      });
      if (!res.ok) throw new Error('Error generando QR');
      return res.json();
    },
    onSuccess: (_data, visitId) => {
      setShowQrModal(visitId);
      setGeneratingQr(null);
    },
    onError: (err) => {
      pushToast({ type: 'error', title: 'Error generando QR', description: (err as Error).message });
      setGeneratingQr(null);
    },
  });

  const handleGenerateQr = (visitId: string) => {
    setGeneratingQr(visitId);
    qrMutation.mutate(visitId);
  };

  const handleCreateRecurring = (visitId: string) => {
    createRecurringMutation.mutate({ visitId, rule: recurrenceRule });
  };

  useEffect(() => {
    document.title = 'Agenda de Visitas · BIENENHAUS';
    return () => {
      document.title = 'BIENENHAUS — Panel de Administración';
    };
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get date range for current view
  const { rangeStart, rangeEnd } = useMemo(() => {
    if (viewMode === 'month') {
      return { rangeStart: startOfMonth(currentDate), rangeEnd: endOfMonth(currentDate) };
    }
    if (viewMode === 'week') {
      return { rangeStart: startOfWeek(currentDate), rangeEnd: addDays(startOfWeek(currentDate), 6) };
    }
    return { rangeStart: currentDate, rangeEnd: currentDate };
  }, [viewMode, currentDate]);

  // Use date-range query for better performance
  const { data: visitsInRange, isPending: rangePending } = useQuery({
    queryKey: ['visits-range', formatDateKey(rangeStart), formatDateKey(rangeEnd), agentFilter],
    queryFn: () => fetchVisitsByDateRange(
      formatDateKey(rangeStart),
      formatDateKey(rangeEnd),
      agentFilter !== 'todos' ? agentFilter : undefined
    ),
    enabled: true,
  });

  const visits = visitsInRange ?? [];

  const filteredVisits = useMemo(() => {
    return visits.filter(v => {
      if (statusFilter !== 'todos' && v.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${v.title} ${v.lead_name ?? ''} ${v.property_title ?? ''} ${v.location ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [visits, search, statusFilter]);

  const navigate = (direction: 'prev' | 'next') => {
    const amount = viewMode === 'month' ? 1 : viewMode === 'week' ? 7 : 1;
    setCurrentDate(d => addDays(d, direction === 'next' ? amount : -amount));
  };

  const navigateToday = () => setCurrentDate(new Date());

  const openCreate = () => {
    setFormMode('create');
    setSelectedVisit(null);
    setShowForm(true);
  };

  const openEdit = (visit: VisitRow) => {
    setFormMode('edit');
    setSelectedVisit(visit);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedVisit(null);
  };

  // Calendar grid for month view
  const monthWeeks = useMemo(() => {
    if (viewMode !== 'month') return [];
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const firstDayOfWeek = start.getDay();
    const startDate = addDays(start, -firstDayOfWeek);
    const weeks: Date[][] = [];
    let cursor = startDate;
    while (cursor <= end) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(cursor));
        cursor = addDays(cursor, 1);
      }
      weeks.push(week);
    }
    return weeks;
  }, [currentDate]);

  // Week days for week/day view
  const weekDays = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate);
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    if (viewMode === 'day') {
      return [currentDate];
    }
    return [];
  }, [viewMode, currentDate]);

  return (
    <div className="page visits-page">
      <div className="page-head">
        <div>
          <h2 className="page-title">Agenda de Visitas</h2>
          <p className="page-subtitle">Gestioná las citas y visitas del equipo.</p>
        </div>
        <button className="btn btn--primary" onClick={openCreate}>
          <Plus size={16} /> Nueva visita
        </button>
      </div>

      <div className="visits-toolbar">
        <div className="toolbar-view">
          {VIEW_MODES.map(mode => (
            <button
              key={mode}
              className={`btn${viewMode === mode ? ' btn--primary' : ' btn--secondary'}`}
              onClick={() => setViewMode(mode)}
            >
              {mode === 'month' && <Calendar size={16} />}
              {mode === 'week' && <CalendarClock size={16} />}
              {mode === 'day' && <Clock size={16} />}
              <span>{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
            </button>
          ))}
        </div>

        <div className="toolbar-nav">
          <button className="btn btn--ghost" onClick={() => navigate('prev')}>
            <ChevronLeft size={16} />
          </button>
          <span className="current-period">
            {viewMode === 'month' && currentDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
            {viewMode === 'week' && `${startOfWeek(currentDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} - ${addDays(startOfWeek(currentDate), 6).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}`}
            {viewMode === 'day' && currentDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <button className="btn btn--ghost" onClick={() => navigate('next')}>
            <ChevronRight size={16} />
          </button>
          <button className="btn btn--secondary" onClick={navigateToday}>Hoy</button>
        </div>

        <div className="toolbar-filters">
          <div className="toolbar-search">
            <Search size={15} />
            <input
              type="text"
              placeholder="Buscar visita, cliente, propiedad..."
              value={search}
              onInput={e => setSearch(e.currentTarget.value)}
            />
          </div>
          <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.currentTarget.value as 'todos' | VisitStatus)}>
            <option value="todos">Todos los estados</option>
            {(Object.keys(VISIT_STATUS_LABEL) as VisitStatus[]).map(s => (
              <option key={s} value={s}>{VISIT_STATUS_LABEL[s]}</option>
            ))}
          </select>
          <select className="select" value={agentFilter} onChange={e => setAgentFilter(e.currentTarget.value)}>
            <option value="todos">Todos los agentes</option>
            {(agents ?? []).map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      {(visitsPending || rangePending) && <div className="card placeholder-card">Cargando visitas…</div>}

      {!visitsPending && !rangePending && (
        <>
          {viewMode === 'month' && (
            <div className="calendar-month">
              <div className="calendar-header-row">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                  <div key={d} className="calendar-day-header">{d}</div>
                ))}
              </div>
              <div className="calendar-grid">
                {monthWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="calendar-week">
                    {week.map((day, dIdx) => {
                      const dayVisits = filteredVisits.filter(v => isSameDay(new Date(v.starts_at), day));
                      const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                      const isToday = isSameDay(day, today);
                      return (
                        <div
                          key={dIdx}
                          className={`calendar-day${!isCurrentMonth ? ' other-month' : ''}${isToday ? ' today' : ''}`}
                        >
                          <span className="day-number">{day.getDate()}</span>
                          <div className="day-visits">
                            {dayVisits.slice(0, 3).map(v => (
                              <div key={v.id} className={`day-visit-chip visit-status-${v.status}`} onClick={() => openEdit(v)}>
                                <span className="day-visit-main">
                                  {v.starts_at && (
                                    <time>{new Date(v.starts_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</time>
                                  )}
                                  <span>{v.title}</span>
                                </span>
                                <button
                                  type="button"
                                  className="chip-qr-btn"
                                  title="Generar QR de check-in"
                                  aria-label={`QR de ${v.title}`}
                                  onClick={(e) => { e.stopPropagation(); handleGenerateQr(v.id); }}
                                >
                                  <QrCode size={12} />
                                </button>
                              </div>
                            ))}
                            {dayVisits.length > 3 && (
                              <div className="day-more" onClick={() => { setViewMode('day'); setCurrentDate(day); }}>
                                +{dayVisits.length - 3} más
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(viewMode === 'week' || viewMode === 'day') && (
            <div className="calendar-week-view">
              <div className="week-header">
                {weekDays.map((day, i) => (
                  <div key={i} className={`week-day-header${isSameDay(day, today) ? ' today' : ''}`}>
                    <span className="week-day-name">{day.toLocaleDateString('es-AR', { weekday: 'short' })}</span>
                    <span className="week-day-number">{day.getDate()}</span>
                  </div>
                ))}
              </div>
              <div className="week-grid">
                {weekDays.map((day, dIdx) => {
                  const dayVisits = filteredVisits.filter(v => isSameDay(new Date(v.starts_at), day));
                  return (
                    <div key={dIdx} className={`week-day-column${isSameDay(day, today) ? ' today' : ''}`}>
                      {dayVisits.map(v => (
                        <div
                          key={v.id}
                          className={`week-visit visit-status-${v.status}`}
                          onClick={() => openEdit(v)}
                        >
                          <div className="week-visit-head">
                            <time>{new Date(v.starts_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</time>
                            <button
                              type="button"
                              className="chip-qr-btn"
                              title="Generar QR de check-in"
                              aria-label={`QR de ${v.title}`}
                              onClick={(e) => { e.stopPropagation(); handleGenerateQr(v.id); }}
                            >
                              <QrCode size={12} />
                            </button>
                          </div>
                          <span className="visit-title">{v.title}</span>
                          {v.location && <span className="visit-location"><MapPin size={12} /> {v.location}</span>}
                          {v.meeting_type && <span className="visit-type">{MEETING_TYPE_LABEL[v.meeting_type]}</span>}
                        </div>
                      ))}
                      {dayVisits.length === 0 && <div className="week-empty">Sin visitas</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filteredVisits.length === 0 && !visitsPending && !rangePending && (
            <div className="card placeholder-card">
              <Calendar size={48} className="placeholder-icon" />
              <h3>No hay visitas</h3>
              <p>{search || statusFilter !== 'todos' ? 'Probá cambiar los filtros.' : 'Creá tu primera visita.'}</p>
            </div>
          )}
        </>
      )}

      {showForm && selectedVisit && (
        <VisitFormModal
          visit={selectedVisit}
          mode={formMode}
          agents={agents ?? []}
          properties={properties ?? []}
          leads={leads ?? []}
          onClose={handleCloseForm}
          onOpenRecurring={() => {
            setShowForm(false);
            setShowRecurring(true);
          }}
          onSubmit={async (values) => {
            try {
              if (formMode === 'create') {
                await createVisit(values);
                pushToast({ type: 'success', title: 'Visita creada' });
              } else {
                await updateVisit(selectedVisit!.id, values);
                pushToast({ type: 'success', title: 'Visita actualizada' });
              }
              handleCloseForm();
              await queryClient.invalidateQueries({ queryKey: ['visits'] });
            } catch (err) {
              pushToast({ type: 'error', title: 'Error', description: (err as Error).message });
            }
          }}
        />
      )}

      {showForm && !selectedVisit && (
        <VisitFormModal
          visit={null}
          mode="create"
          agents={agents ?? []}
          properties={properties ?? []}
          leads={leads ?? []}
          onClose={handleCloseForm}
          onSubmit={async (values) => {
            try {
              await createVisit(values);
              pushToast({ type: 'success', title: 'Visita creada' });
              handleCloseForm();
              await queryClient.invalidateQueries({ queryKey: ['visits'] });
            } catch (err) {
              pushToast({ type: 'error', title: 'Error', description: (err as Error).message });
            }
          }}
        />
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="modal-backdrop" onClick={() => setShowQrModal(null)} role="dialog" aria-modal="true">
          <div className="modal-container modal--medium" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowQrModal(null)}><X size={20} /></button>
            <div className="modal-content" style={{ textAlign: 'center', padding: '24px' }}>
              <h3>Código QR para Check-in</h3>
              <p className="muted" style={{ marginBottom: '16px' }}>Escaneá este código al llegar a la visita</p>
              {generatingQr === showQrModal ? (
                <div style={{ padding: '24px' }}><Loader2 size={32} className="spin" /></div>
              ) : (
                <img
                  src={`${supabaseUrl}/functions/v1/qr-checkin?visitId=${encodeURIComponent(showQrModal)}`}
                  alt="QR Check-in"
                  style={{ maxWidth: '256px', border: '1px solid var(--bh-border)', borderRadius: '8px' }}
                />
              )}
              <p className="muted" style={{ marginTop: '12px', fontSize: '12px' }}>
                Código: <code>{showQrModal}</code>
              </p>
              <div className="modal-actions" style={{ marginTop: '16px' }}>
                <button className="btn btn--primary" onClick={() => setShowQrModal(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recurring Visit Modal */}
      {showRecurring && selectedVisit && (
        <div className="modal-backdrop" onClick={() => setShowRecurring(false)} role="dialog" aria-modal="true">
          <div className="modal-container modal--medium" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowRecurring(false)}><X size={20} /></button>
            <div className="modal-content">
              <h2>Crear Visita Recurrente</h2>
              <form onSubmit={e => { e.preventDefault(); handleCreateRecurring(selectedVisit.id); }}>
                <div className="form-grid">
                  <label className="field">
                    <span>Frecuencia</span>
                    <select value={recurrenceRule.frequency} onChange={e => setRecurrenceRule(r => ({ ...r, frequency: e.currentTarget.value as RecurrenceRule['frequency'] }))}>
                      <option value="daily">Diaria</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensual</option>
                      <option value="yearly">Anual</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Cada</span>
                    <input type="number" min="1" max="12" value={recurrenceRule.interval} onChange={e => setRecurrenceRule(r => ({ ...r, interval: Number(e.currentTarget.value) || 1 }))} />
                  </label>
                  {recurrenceRule.frequency === 'weekly' && (
                    <label className="field field--wide">
                      <span>Días de la semana</span>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, i) => (
                          <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', border: '1px solid var(--bh-border)', borderRadius: '6px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={recurrenceRule.days_of_week?.includes(i)} onChange={e => setRecurrenceRule(r => ({ ...r, days_of_week: e.currentTarget.checked ? [...(r.days_of_week ?? []), i] : (r.days_of_week ?? []).filter((d: number) => d !== i) }))} />
                            {day}
                          </label>
                        ))}
                      </div>
                    </label>
                  )}
                  {recurrenceRule.frequency === 'monthly' && (
                    <label className="field">
                      <span>Día del mes</span>
                      <input type="number" min="1" max="31" value={recurrenceRule.day_of_month ?? 1} onChange={e => setRecurrenceRule(r => ({ ...r, day_of_month: Number(e.currentTarget.value) || 1 }))} />
                    </label>
                  )}
                  <label className="field field--wide">
                    <span>Fecha fin (opcional)</span>
                    <input type="date" value={recurrenceRule.end_date ?? ''} onChange={e => setRecurrenceRule(r => ({ ...r, end_date: e.currentTarget.value || undefined }))} />
                  </label>
                  <label className="field">
                    <span>Máx. ocurrencias (opcional)</span>
                    <input type="number" min="1" value={recurrenceRule.count ?? ''} onChange={e => setRecurrenceRule(r => ({ ...r, count: e.currentTarget.value ? Number(e.currentTarget.value) : undefined }))} placeholder="Sin límite" />
                  </label>
                </div>
                <div className="form-actions" style={{ marginTop: '16px' }}>
                  <button type="button" className="btn btn--ghost" onClick={() => setShowRecurring(false)}>Cancelar</button>
                  <button type="submit" className="btn btn--primary" disabled={createRecurringMutation.isPending}>
                    {createRecurringMutation.isPending ? <Loader2 size={14} className="spin" /> : 'Crear recurrencia'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Visit Form Modal Component
function VisitFormModal({
  visit,
  mode,
  agents,
  properties,
  leads,
  onClose,
  onOpenRecurring,
  onSubmit,
}: {
  visit: VisitRow | null;
  mode: 'create' | 'edit';
  agents: { id: string; name: string }[];
  properties: { id: string; title: string }[];
  leads: { id: string; name: string; last_name: string; email: string }[];
  onClose: () => void;
  onOpenRecurring?: () => void;
  onSubmit: (values: any) => Promise<void>;
}) {
  const [values, setValues] = useState({
    lead_id: visit?.lead_id ?? '',
    property_id: visit?.property_id ?? '',
    agent_id: visit?.agent_id ?? '',
    title: visit?.title ?? '',
    description: visit?.description ?? '',
    starts_at: visit?.starts_at ? visit.starts_at.slice(0, 16) : new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    ends_at: visit?.ends_at ? visit.ends_at.slice(0, 16) : new Date(Date.now() + 7200000).toISOString().slice(0, 16),
    status: visit?.status ?? 'programada',
    location: visit?.location ?? '',
    meeting_type: visit?.meeting_type ?? 'presencial',
    meeting_link: visit?.meeting_link ?? '',
    notes: visit?.notes ?? '',
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(values);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string) => (e: Event) => {
    const target = e.currentTarget as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    setValues(v => ({ ...v, [key]: value }));
  };

  const handleCloseForm = () => {
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleCloseForm} role="dialog" aria-modal="true">
      <div className="modal-container modal--medium" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={handleCloseForm}><X size={20} /></button>
        <div className="modal-content">
          <h2>{mode === 'create' ? 'Nueva visita' : 'Editar visita'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="field field--wide">
                <span>Título *</span>
                <input type="text" value={values.title} onChange={handleChange('title')} required />
              </label>
              <label className="field">
                <span>Agente *</span>
                <select value={values.agent_id} onChange={handleChange('agent_id')} required>
                  <option value="">Seleccionar agente</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Estado</span>
                <select value={values.status} onChange={handleChange('status')}>
                  {(Object.keys(VISIT_STATUS_LABEL) as VisitStatus[]).map(s => <option key={s} value={s}>{VISIT_STATUS_LABEL[s]}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Tipo</span>
                <select value={values.meeting_type} onChange={handleChange('meeting_type')}>
                  <option value="presencial">Presencial</option>
                  <option value="virtual">Virtual</option>
                  <option value="telefono">Teléfono</option>
                </select>
              </label>
              <label className="field field--wide">
                <span>Inicio *</span>
                <input type="datetime-local" value={values.starts_at} onChange={handleChange('starts_at')} required />
              </label>
              <label className="field field--wide">
                <span>Fin *</span>
                <input type="datetime-local" value={values.ends_at} onChange={handleChange('ends_at')} required />
              </label>
              <label className="field field--wide">
                <span>Lead</span>
                <select value={values.lead_id} onChange={handleChange('lead_id')}>
                  <option value="">Sin lead</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.name} {l.last_name} - {l.email}</option>)}
                </select>
              </label>
              <label className="field field--wide">
                <span>Propiedad</span>
                <select value={values.property_id} onChange={handleChange('property_id')}>
                  <option value="">Sin propiedad</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </label>
              <label className="field field--wide">
                <span>Ubicación</span>
                <input type="text" value={values.location} onChange={handleChange('location')} placeholder="Dirección o punto de encuentro" />
              </label>
              <label className="field field--wide">
                <span>Link de reunión (si es virtual)</span>
                <input type="url" value={values.meeting_link} onChange={handleChange('meeting_link')} placeholder="https://zoom.us/... o https://meet.google.com/..." />
              </label>
              <label className="field field--wide">
                <span>Descripción</span>
                <textarea value={values.description} onChange={handleChange('description')} rows={3} placeholder="Detalles de la visita..." />
              </label>
              <label className="field field--wide">
                <span>Notas internas</span>
                <textarea value={values.notes} onChange={handleChange('notes')} rows={2} placeholder="Notas para el equipo..." />
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn--ghost" onClick={() => onClose()}>Cancelar</button>
              {mode === 'edit' && onOpenRecurring && (
                <button type="button" className="btn btn--secondary" onClick={onOpenRecurring}>
                  Repetir visita
                </button>
              )}
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}