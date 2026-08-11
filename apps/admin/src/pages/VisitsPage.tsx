import { useState, useMemo, useCallback } from 'preact/hooks';
import {
    Calendar,
    CalendarClock,
    Clock,
    ChevronLeft,
    ChevronRight,
    Search,
    QrCode,
    X,
    Loader2,
} from 'lucide-preact';
import { supabaseUrl } from '../lib/supabase';
import { useAuthAccessToken } from '../lib/auth';
import {
    fetchVisits,
    fetchVisitsByDateRange,
    VISIT_STATUS_LABEL,
    type VisitStatus,
} from '../lib/visits';
import { fetchAgents } from '../lib/agents';
import { useQuery } from '../lib/query/hooks';
import { pushToast } from '../store/app';
import styles from './VisitsPage.module.css';

const VIEW_MODES = ['month', 'week', 'day'] as const;
type ViewMode = (typeof VIEW_MODES)[number];

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
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function VisitsPage() {
    const accessToken = useAuthAccessToken();
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showQrModal, setShowQrModal] = useState<string | null>(null);
    const [generatingQr, setGeneratingQr] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'todos' | VisitStatus>('todos');
    const [agentFilter, setAgentFilter] = useState('todos');

    const { isPending: visitsPending } = useQuery({
        queryKey: ['visits'],
        queryFn: () => fetchVisits(),
    });

    const { data: agents } = useQuery({
        queryKey: ['agents', 'active'],
        queryFn: () => fetchAgents(),
    });

    const [rangeStart, rangeEnd] = useMemo(() => {
        if (viewMode === 'month') {
            const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            end.setHours(23, 59, 59, 999);
            return [start, end];
        }
        if (viewMode === 'week') {
            const start = startOfWeek(currentDate);
            const end = addDays(start, 6);
            end.setHours(23, 59, 59, 999);
            return [start, end];
        }
        const start = new Date(currentDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(currentDate);
        end.setHours(23, 59, 59, 999);
        return [start, end];
    }, [viewMode, currentDate]);

    const { data: rangeVisits, isPending: rangePending } = useQuery({
        queryKey: ['visits', 'range', formatDateKey(rangeStart), formatDateKey(rangeEnd)],
        queryFn: () => fetchVisitsByDateRange(formatDateKey(rangeStart), formatDateKey(rangeEnd)),
    });

    const navigate = useCallback((dir: 'prev' | 'next') => {
        setCurrentDate((prev) => {
            const d = new Date(prev);
            if (viewMode === 'month') {
                d.setMonth(d.getMonth() + (dir === 'next' ? 1 : -1));
            } else {
                d.setDate(d.getDate() + (dir === 'next' ? (viewMode === 'week' ? 7 : 1) : (viewMode === 'week' ? -7 : -1)));
            }
            return d;
        });
    }, [viewMode]);

    const navigateToday = useCallback(() => setCurrentDate(new Date()), []);

    const monthWeeks = useMemo(() => {
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const weeks: Date[][] = [];
        let cursor = startOfWeek(start);
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

    const filteredVisits = useMemo(() => {
        let list = rangeVisits ?? [];
        if (search) {
            const q = search.toLowerCase();
            list = list.filter((v) =>
                v.title.toLowerCase().includes(q) ||
                v.property_title?.toLowerCase().includes(q) ||
                v.lead_name?.toLowerCase().includes(q) ||
                v.agent_name?.toLowerCase().includes(q),
            );
        }
        if (statusFilter !== 'todos') {
            list = list.filter((v) => v.status === statusFilter);
        }
        if (agentFilter !== 'todos') {
            list = list.filter((v) => v.agent_id === agentFilter);
        }
        return list;
    }, [rangeVisits, search, statusFilter, agentFilter]);

    const handleGenerateQr = useCallback(async (visitId: string) => {
        setGeneratingQr(visitId);
        try {
            const res = await fetch(`${supabaseUrl}/functions/v1/qr-checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + accessToken },
                body: JSON.stringify({ visit_id: visitId }),
            });
            if (!res.ok) throw new Error('Error generando QR');
            const data = await res.json();
            setShowQrModal(data.code);
        } catch {
            pushToast({ type: 'error', title: 'No se pudo generar QR' });
        } finally {
            setGeneratingQr(null);
        }
    }, [accessToken]);

    const renderMonthView = () => (
        <div className={styles['calendar-month']}>
            <div className={styles['calendar-header-row']}>
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => (
                    <div key={d} className={styles['calendar-day-header']}>
                        {d}
                    </div>
                ))}
            </div>
            <div className={styles['calendar-grid']}>
                {monthWeeks.map((week, wIdx) => (
                    <div key={wIdx} className={styles['calendar-week']}>
                        {week.map((day, dIdx) => {
                            const dayVisits = filteredVisits.filter((v) =>
                                isSameDay(new Date(v.starts_at), day),
                            );
                            const isCurrentMonth =
                                day.getMonth() === currentDate.getMonth();
                            const isToday = isSameDay(day, new Date());
                            return (
                                <div
                                    key={dIdx}
                                    className={styles['calendar-day'] + (!isCurrentMonth ? ' ' + styles['other-month'] : '') + (isToday ? ' ' + styles['today'] : '')}
                                >
                                    <span className={styles['day-number']}>
                                        {day.getDate()}
                                    </span>
                                    <div className={styles['day-visits']}>
                                        {dayVisits.slice(0, 3).map((v) => (
                                            <div
                                                key={v.id}
                                                className={styles['day-visit-chip'] + ' visit-status-' + v.status}
                                                 
                                            >
                                                <span className="day-visit-main">
                                                    {v.starts_at && (
                                                        <time>
                                                            {new Date(v.starts_at).toLocaleTimeString('es-AR', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </time>
                                                    )}
                                                    <span>{v.title}</span>
                                                </span>
                                                <button
                                                    type="button"
                                                    className="chip-qr-btn"
                                                    title="Generar QR de check-in"
                                                    aria-label={'QR de ' + v.title}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleGenerateQr(v.id);
                                                    }}
                                                >
                                                    <QrCode size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        {dayVisits.length > 3 && (
                                            <div
                                                className={styles['day-more']}
                                                onClick={() => {
                                                    setViewMode('day');
                                                    setCurrentDate(day);
                                                }}
                                            >
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
    );

    const renderWeekView = () => (
        <div className={styles['calendar-week-view']}>
            <div className={styles['week-header']}>
                {weekDays.map((day, i) => (
                    <div
                        key={i}
                        className={styles['week-day-header'] + (isSameDay(day, new Date()) ? ' ' + styles['today'] : '')}
                    >
                        <span className={styles['week-day-name']}>
                            {day.toLocaleDateString('es-AR', { weekday: 'short' })}
                        </span>
                        <span className={styles['week-day-number']}>{day.getDate()}</span>
                    </div>
                ))}
            </div>
            <div className={styles['week-grid']}>
                {weekDays.map((day, dIdx) => {
                    const dayVisits = filteredVisits.filter((v) =>
                        isSameDay(new Date(v.starts_at), day),
                    );
                    return (
                        <div
                            key={dIdx}
                            className={styles['week-day-column'] + (isSameDay(day, new Date()) ? ' ' + styles['today'] : '')}
                        >
                            {dayVisits.map((v) => (
                                <div
                                    key={v.id}
                                    className={styles['week-visit'] + ' visit-status-' + v.status}
                                     
                                >
                                    <time>{formatTime(v.starts_at)}</time>
                                    <strong>{v.title}</strong>
                                    <span className="muted">{v.location}</span>
                                    <button
                                        type="button"
                                        className="chip-qr-btn"
                                        title="Generar QR de check-in"
                                        aria-label={'QR de ' + v.title}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleGenerateQr(v.id);
                                        }}
                                    >
                                        <QrCode size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderDayView = () => (
        <div className={styles['calendar-day-view']}>
            <div className={styles['day-header']}>
                <span className={styles['day-name']}>
                    {currentDate.toLocaleDateString('es-AR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    })}
                </span>
            </div>
            <div className={styles['day-grid']}>
                {weekDays.map((day, dIdx) => {
                    const dayVisits = filteredVisits.filter((v) =>
                        isSameDay(new Date(v.starts_at), day),
                    );
                    return (
                        <div
                            key={dIdx}
                            className={styles['day-column'] + (isSameDay(day, new Date()) ? ' ' + styles['today'] : '')}
                        >
                            {dayVisits.map((v) => (
                                <div
                                    key={v.id}
                                    className={styles['day-visit'] + ' visit-status-' + v.status}
                                     
                                >
                                    <time>{formatTime(v.starts_at)}</time>
                                    <strong>{v.title}</strong>
                                    <span className="muted">{v.location}</span>
                                    <button
                                        type="button"
                                        className="chip-qr-btn"
                                        title="Generar QR de check-in"
                                        aria-label={'QR de ' + v.title}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleGenerateQr(v.id);
                                        }}
                                    >
                                        <QrCode size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className={'page ' + styles['visits-page']}>
            <div className="page-head">
                <div>
                    <h2 className="page-title">Agenda de Visitas</h2>
                    <p className="page-subtitle">Gestioná las citas y visitas del equipo.</p>
                </div>
            </div>

            <div className={styles['visits-toolbar']}>
                <div className={styles['toolbar-view']}>
                    {VIEW_MODES.map((mode) => (
                        <button
                            key={mode}
                            className={'btn' + (viewMode === mode ? ' btn--primary' : ' btn--secondary')}
                            onClick={() => setViewMode(mode)}
                        >
                            {mode === 'month' && <Calendar size={16} />}
                            {mode === 'week' && <CalendarClock size={16} />}
                            {mode === 'day' && <Clock size={16} />}
                            <span>{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
                        </button>
                    ))}
                </div>

                <div className={styles['toolbar-nav']}>
                    <button className="btn btn--ghost" onClick={() => navigate('prev')}>
                        <ChevronLeft size={16} />
                    </button>
                    <span className={styles['current-period']}>
                        {viewMode === 'month' &&
                            currentDate.toLocaleDateString('es-AR', {
                                month: 'long',
                                year: 'numeric',
                            })}
                        {viewMode === 'week' &&
                            startOfWeek(currentDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) + ' - ' + addDays(startOfWeek(currentDate), 6).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {viewMode === 'day' &&
                            currentDate.toLocaleDateString('es-AR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                    </span>
                    <button className="btn btn--ghost" onClick={() => navigate('next')}>
                        <ChevronRight size={16} />
                    </button>
                    <button className="btn btn--secondary" onClick={navigateToday}>
                        Hoy
                    </button>
                </div>

                <div className="toolbar-filters">
                    <div className="toolbar-search">
                        <Search size={15} />
                        <input
                            type="text"
                            placeholder="Buscar visita, cliente, propiedad..."
                            value={search}
                            onInput={(e) => setSearch(e.currentTarget.value)}
                        />
                    </div>
                    <select
                        className="select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.currentTarget.value as 'todos' | VisitStatus)}
                    >
                        <option value="todos">Todos los estados</option>
                        {(Object.keys(VISIT_STATUS_LABEL) as VisitStatus[]).map((s) => (
                            <option key={s} value={s}>
                                {VISIT_STATUS_LABEL[s]}
                            </option>
                        ))}
                    </select>
                    <select
                        className="select"
                        value={agentFilter}
                        onChange={(e) => setAgentFilter(e.currentTarget.value)}
                    >
                        <option value="todos">Todos los agentes</option>
                        {(agents ?? []).map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {(visitsPending || rangePending) && (
                <div className="card placeholder-card">Cargando visitas…</div>
            )}

            {!visitsPending && !rangePending && (
                <>
                    {viewMode === 'month' && renderMonthView()}
                    {viewMode === 'week' && renderWeekView()}
                    {viewMode === 'day' && renderDayView()}
                </>
            )}

            {showQrModal && (
                <div className="modal-backdrop" onClick={() => setShowQrModal(null)}>
                    <div className="modal-card modal--large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <h3>QR de Check-in</h3>
                            <button className="icon-btn" onClick={() => setShowQrModal(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {generatingQr === showQrModal ? (
                                <div className="ml-center"><Loader2 size={32} className="spin" /> Generando QR...</div>
                            ) : (
                                <div className="qr-display">
                                    <img src={supabaseUrl + '/functions/v1/qr-checkin/' + showQrModal} alt="QR Check-in" />
                                    <p className="muted">Escaneá este código en la app del agente</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}