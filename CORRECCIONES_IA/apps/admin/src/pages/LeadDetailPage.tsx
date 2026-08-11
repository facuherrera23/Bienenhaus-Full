import { useEffect, useState } from 'preact/hooks';
import { ArrowLeft, MessageSquare, Save } from 'lucide-preact';
import { Link, useRoute } from 'wouter-preact';
import {
    type AgentOption,
    fetchAgents,
    fetchLead,
    LEAD_INTENT_LABEL,
    LEAD_SOURCE_LABEL,
    LEAD_STATUS_LABEL,
    LEAD_STATUS_TONE,
    type LeadDetail,
    type LeadStatus,
    updateLead,
} from '../lib/leads';
import { queryClient } from '../lib/query/client';
import { useQuery } from '../lib/query/hooks';
import { pushToast } from '../store/app';
import styles from './LeadDetailPage.module.css';


export function LeadDetailPage() {
    const [, params] = useRoute('/leads/:id');
    const id = params?.id ?? '';

    const [lead, setLead] = useState<LeadDetail | null>(null);
    const [status, setStatus] = useState<LeadStatus>('nuevo');
    const [notes, setNotes] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [phone, setPhone] = useState('');
    const [city, setCity] = useState('');
    const [loadError, setLoadError] = useState('');
    const [saving, setSaving] = useState(false);

    const { data: agents } = useQuery<AgentOption[]>({
        queryKey: ['agents'],
        queryFn: fetchAgents,
    });

    useEffect(() => {
        document.title = 'Lead · BIENENHAUS';
        return () => {
            document.title = 'BIENENHAUS — Panel de Administración';
        };
    }, []);

    useEffect(() => {
        let alive = true;
        fetchLead(id)
            .then((l) => {
                if (!alive) return;
                setLead(l);
                setStatus(l.status);
                setNotes(l.notes ?? '');
                setAssignedTo(l.assigned_to ?? '');
                setPhone(l.phone ?? '');
                setCity(l.city ?? '');
            })
            .catch((e: unknown) => {
                if (!alive) return;
                setLoadError(e instanceof Error ? e.message : 'No se pudo cargar el lead.');
            });
        return () => {
            alive = false;
        };
    }, [id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateLead(id, {
                status,
                notes: notes.trim() || null,
                assigned_to: assignedTo || null,
                phone: phone.trim() || null,
                city: city.trim() || null,
            });
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['leads'] }),
                queryClient.invalidateQueries({ queryKey: ['lead', id] }),
            ]);
            pushToast({
                type: 'success',
                title: 'Cambios guardados',
                description: `${lead?.name} ${lead?.last_name}`,
            });
        } catch {
            pushToast({ type: 'error', title: 'No se pudieron guardar los cambios' });
        } finally {
            setSaving(false);
        }
    };

    const openWhatsApp = (lead: LeadDetail) => {
        const leadPhone = lead.phone ?? phone;
        if (!leadPhone.trim()) return;
        const clean = leadPhone.replace(/\D/g, '');
        const waPhone = clean.startsWith('54') ? clean : `54${clean}`;
        const prop = lead.property_title
            ? `por tu interés en "${lead.property_title}"`
            : 'por tu consulta';
        const text = `Hola ${lead.name}, te contactamos desde BIENENHAUS ${prop}. ¿En qué podemos ayudarte?`;
        window.open(
            `https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`,
            '_blank',
            'noopener,noreferrer',
        );
    };

    return (
        <div className="page">
            <div className="page-head">
                <div>
                    <h2 className="page-title">Detalle del lead</h2>
                    <p className="page-subtitle">
                        Información de contacto y seguimiento comercial.
                    </p>
                </div>
                <div style="display:flex; gap:8px; align-items:center;">
                    <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => openWhatsApp(lead!)}
                        disabled={!phone.trim()}
                        title={phone.trim() ? 'Abrir WhatsApp' : 'El lead no tiene teléfono'}
                    >
                        <MessageSquare size={16} /> WhatsApp
                    </button>
                    <Link href="/leads" className="btn btn--secondary">
                        <ArrowLeft size={16} /> Volver
                    </Link>
                </div>
            </div>

            {loadError && (
                <div className="card placeholder-card">
                    <h3>No se pudo abrir el lead</h3>
                    <p>{loadError}</p>
                    <Link href="/leads" className="btn btn--secondary">
                        Volver al listado
                    </Link>
                </div>
            )}

            {!loadError && !lead && <div className="card placeholder-card">Cargando…</div>}

            {!loadError && lead && (
                <div className={styles['lead-detail']}>
                    <div className={styles['lead-hero']}>
                        <span className={styles['lead-avatar']} aria-hidden="true">
                            {(lead.name[0] ?? '').toUpperCase()}
                        </span>
                        <div className={styles['lead-hero-info']}>
                            <h3>
                                {lead.name} {lead.last_name}
                            </h3>
                            <p>
                                {LEAD_INTENT_LABEL[lead.intent]} · {LEAD_SOURCE_LABEL[lead.source]}{' '}
                                · Recibido {new Date(lead.created_at).toLocaleDateString('es-AR')}
                            </p>
                        </div>
                        <span className={`badge badge--${LEAD_STATUS_TONE[lead.status]}`}>
                            {LEAD_STATUS_LABEL[lead.status]}
                        </span>
                    </div>

                    <div className={styles['lead-grid']}>
                        <section className="form-section">
                            <div className="form-section-head">
                                <h3>Contacto</h3>
                                <p>
                                    Datos del lead.{' '}
                                    {lead.property_title
                                        ? `Interesado en: ${lead.property_title}`
                                        : ''}
                                </p>
                            </div>
                            <div className="form-grid">
                                <label className="field">
                                    <span>Email</span>
                                    <input type="email" value={lead.email} readOnly />
                                </label>
                                <label className="field">
                                    <span>Teléfono</span>
                                    <input
                                        type="text"
                                        value={phone}
                                        onInput={(e) =>
                                            setPhone((e.currentTarget as HTMLInputElement).value)
                                        }
                                    />
                                </label>
                                <label className="field">
                                    <span>Ciudad</span>
                                    <input
                                        type="text"
                                        value={city}
                                        onInput={(e) =>
                                            setCity((e.currentTarget as HTMLInputElement).value)
                                        }
                                    />
                                </label>
                                <label className="field field--wide">
                                    <span>Mensaje</span>
                                    <textarea rows={4} value={lead.message ?? ''} readOnly />
                                </label>
                            </div>
                        </section>

                        <section className="form-section">
                            <div className="form-section-head">
                                <h3>Seguimiento</h3>
                                <p>Estado actual y agente responsable.</p>
                            </div>
                            <div className="form-grid">
                                <label className="field">
                                    <span>Estado</span>
                                    <select
                                        className="select"
                                        value={status}
                                        onChange={(e) =>
                                            setStatus(
                                                (e.currentTarget as HTMLSelectElement)
                                                    .value as LeadStatus,
                                            )
                                        }
                                    >
                                        {(Object.keys(LEAD_STATUS_LABEL) as LeadStatus[]).map(
                                            (s) => (
                                                <option key={s} value={s}>
                                                    {LEAD_STATUS_LABEL[s]}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </label>
                                <label className="field">
                                    <span>Asignado a</span>
                                    <select
                                        className="select"
                                        value={assignedTo}
                                        onChange={(e) =>
                                            setAssignedTo(
                                                (e.currentTarget as HTMLSelectElement).value,
                                            )
                                        }
                                    >
                                        <option value="">Sin asignar</option>
                                        {(agents ?? []).map((a) => (
                                            <option key={a.id} value={a.id}>
                                                {a.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="field field--wide">
                                    <span>Notas internas</span>
                                    <textarea
                                        rows={5}
                                        value={notes}
                                        placeholder="Anotaciones del seguimiento…"
                                        onInput={(e) =>
                                            setNotes((e.currentTarget as HTMLTextAreaElement).value)
                                        }
                                    />
                                </label>
                            </div>
                        </section>
                    </div>

                    <div className="form-actions">
                        <Link href="/leads" className="btn btn--ghost">
                            Cancelar
                        </Link>
                        <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
                            <Save size={16} /> {saving ? 'Guardando…' : 'Guardar cambios'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
