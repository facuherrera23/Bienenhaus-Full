import { useEffect, useState } from 'preact/hooks';
import { ArrowLeft, Save } from 'lucide-preact';
import { Link, useLocation } from 'wouter-preact';
import {
    type AgentOption,
    createLead,
    fetchAgents,
    LEAD_INTENT_LABEL,
    LEAD_SOURCE_LABEL,
    LEAD_STATUS_LABEL,
    type LeadFormValues,
    type LeadIntent,
    type LeadSource,
    type LeadStatus,
} from '../lib/leads';
import { queryClient } from '../lib/query/client';
import { useQuery } from '../lib/query/hooks';
import { pushToast } from '../store/app';
import { Button } from '@bienenhaus/ui';

export function LeadFormPage() {
    const [, setLocation] = useLocation();
    const [values, setValues] = useState<LeadFormValues>({
        name: '',
        last_name: '',
        email: '',
        phone: '',
        city: '',
        intent: 'otro',
        source: 'landing_form',
        status: 'nuevo',
        assigned_to: '',
        message: '',
    });
    const [saving, setSaving] = useState(false);

    const { data: agents } = useQuery<AgentOption[]>({
        queryKey: ['agents'],
        queryFn: fetchAgents,
    });

    useEffect(() => {
        document.title = 'Nuevo lead · BIENENHAUS';
        return () => {
            document.title = 'BIENENHAUS — Panel de Administración';
        };
    }, []);

    const set = (key: keyof LeadFormValues) => (e: Event) => {
        setValues((v) => ({ ...v, [key]: (e.currentTarget as HTMLInputElement).value }));
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const canSave =
        values.name.trim() !== '' &&
        values.last_name.trim() !== '' &&
        values.email.trim() !== '' &&
        emailRegex.test(values.email);

    const handleSubmit = async () => {
        if (!canSave) return;
        setSaving(true);
        try {
            const id = await createLead(values);
            await queryClient.invalidateQueries({ queryKey: ['leads'] });
            pushToast({
                type: 'success',
                title: 'Lead creado',
                description: `${values.name} ${values.last_name}`,
            });
            setLocation(`/leads/${id}`);
        } catch {
            pushToast({ type: 'error', title: 'No se pudo crear el lead' });
            setSaving(false);
        }
    };

    return (
        <div className="page">
            <div className="page-head">
                <div>
                    <h2 className="page-title">Nuevo lead</h2>
                    <p className="page-subtitle">
                        Carga manual de un contacto recibido fuera de la landing.
                    </p>
                </div>
                <Link href="/leads">
                    <Button variant="secondary">
                        <ArrowLeft size={16} /> Volver
                    </Button>
                </Link>
            </div>

            <div className="card form-card">
                <section className="form-section">
                    <div className="form-section-head">
                        <h3>Contacto</h3>
                        <p>Datos obligatorios: nombre, apellido y email.</p>
                    </div>
                    <div className="form-grid">
                        <label className="field">
                            <span>Nombre *</span>
                            <input type="text" value={values.name} onInput={set('name')} />
                        </label>
                        <label className="field">
                            <span>Apellido *</span>
                            <input
                                type="text"
                                value={values.last_name}
                                onInput={set('last_name')}
                            />
                        </label>
                        <label className="field">
                            <span>Email *</span>
                            <input type="email" value={values.email} onInput={set('email')} />
                        </label>
                        <label className="field">
                            <span>Teléfono</span>
                            <input type="text" value={values.phone} onInput={set('phone')} />
                        </label>
                        <label className="field">
                            <span>Ciudad</span>
                            <input type="text" value={values.city} onInput={set('city')} />
                        </label>
                    </div>
                </section>

                <section className="form-section">
                    <div className="form-section-head">
                        <h3>Contexto</h3>
                        <p>Intención, origen y estado inicial del contacto.</p>
                    </div>
                    <div className="form-grid">
                        <label className="field">
                            <span>Intención</span>
                            <select
                                className="select"
                                value={values.intent}
                                onChange={set('intent')}
                            >
                                {(Object.keys(LEAD_INTENT_LABEL) as LeadIntent[]).map((i) => (
                                    <option key={i} value={i}>
                                        {LEAD_INTENT_LABEL[i]}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="field">
                            <span>Origen</span>
                            <select
                                className="select"
                                value={values.source}
                                onChange={set('source')}
                            >
                                {(Object.keys(LEAD_SOURCE_LABEL) as LeadSource[]).map((s) => (
                                    <option key={s} value={s}>
                                        {LEAD_SOURCE_LABEL[s]}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="field">
                            <span>Estado</span>
                            <select
                                className="select"
                                value={values.status}
                                onChange={set('status')}
                            >
                                {(Object.keys(LEAD_STATUS_LABEL) as LeadStatus[]).map((s) => (
                                    <option key={s} value={s}>
                                        {LEAD_STATUS_LABEL[s]}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="field">
                            <span>Asignado a</span>
                            <select
                                className="select"
                                value={values.assigned_to}
                                onChange={set('assigned_to')}
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
                            <span>Mensaje</span>
                            <textarea
                                rows={4}
                                value={values.message}
                                placeholder="Mensaje original del contacto…"
                                onInput={(e) =>
                                    setValues((v) => ({
                                        ...v,
                                        message: (e.currentTarget as HTMLTextAreaElement).value,
                                    }))
                                }
                            />
                        </label>
                    </div>
                </section>

                <div className="form-actions">
                    <Link href="/leads">
                        <Button variant="ghost">Cancelar</Button>
                    </Link>
                    <Button onClick={handleSubmit} disabled={saving || !canSave}>
                        <Save size={16} /> {saving ? 'Creando…' : 'Crear lead'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
