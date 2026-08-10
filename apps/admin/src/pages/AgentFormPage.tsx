import { useEffect, useState } from 'preact/hooks';
import { ArrowLeft, Calendar, DollarSign, Save, Shield } from 'lucide-preact';
import { Link, useLocation, useRoute } from 'wouter-preact';
import {
    type AgentCommission,
    type AgentFormValues,
    type AgentPermissions,
    type AgentSchedule,
    createAgent,
    deleteAgentPhoto,
    fetchAgent,
    toFormValues,
    updateAgent,
    updateAgentCommission,
    updateAgentPermissions,
    updateAgentSchedule,
    uploadAgentPhoto,
} from '../lib/agents';
import { queryClient } from '../lib/query/client';
import { pushToast } from '../store/app';
import styles from './AgentFormPage.module.css';


const EMPTY: AgentFormValues = {
    name: '',
    email: '',
    phone: '',
    matricula: '',
    role: '',
    bio: '',
    specialties: '',
    linkedin: '',
    instagram: '',
    whatsapp: '',
    is_active: true,
    sort_order: '0',
    photo_url: '',
};

const DEFAULT_PERMISSIONS: AgentPermissions = {
    can_view_leads: true,
    can_edit_leads: true,
    can_view_properties: true,
    can_edit_properties: false,
    can_view_visits: true,
    can_manage_visits: true,
    can_view_ml: true,
    can_manage_ml: false,
    can_view_reports: false,
    can_manage_agents: false,
    can_manage_settings: false,
};

const DEFAULT_COMMISSION: AgentCommission = {
    sale_percentage: 50,
    rental_percentage: 100,
};

const DEFAULT_SCHEDULE: AgentSchedule[] = [
    { day_of_week: 1, start_time: '09:00', end_time: '18:00', is_available: true },
    { day_of_week: 2, start_time: '09:00', end_time: '18:00', is_available: true },
    { day_of_week: 3, start_time: '09:00', end_time: '18:00', is_available: true },
    { day_of_week: 4, start_time: '09:00', end_time: '18:00', is_available: true },
    { day_of_week: 5, start_time: '09:00', end_time: '18:00', is_available: true },
    { day_of_week: 6, start_time: '10:00', end_time: '14:00', is_available: true },
    { day_of_week: 0, start_time: '09:00', end_time: '13:00', is_available: false },
];

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function AgentFormPage() {
    const [, setLocation] = useLocation();
    const [, params] = useRoute('/agentes/:id');
    const id = params?.id && params.id !== 'nueva' ? params.id : null;

    const [values, setValues] = useState<AgentFormValues>(EMPTY);
    const [loading, setLoading] = useState(id !== null);
    const [loadError, setLoadError] = useState('');
    const [saving, setSaving] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState('');

    const isEdit = id !== null;

    const [permissions, setPermissions] = useState<AgentPermissions>(DEFAULT_PERMISSIONS);
    const [commission, setCommission] = useState<AgentCommission>(DEFAULT_COMMISSION);
    const [schedule, setSchedule] = useState<AgentSchedule[]>(DEFAULT_SCHEDULE);

    useEffect(() => {
        document.title = `${isEdit ? 'Editar' : 'Nuevo'} agente · BIENENHAUS`;
        return () => {
            document.title = 'BIENENHAUS — Panel de Administración';
        };
    }, [isEdit]);

    useEffect(() => {
        if (!id) return;
        let alive = true;
        fetchAgent(id)
            .then((a) => {
                if (!alive) return;
                setValues(toFormValues(a));
                setPhotoPreview(a.photo_url ?? '');
                if (a.permissions) setPermissions(a.permissions);
                if (a.commission) setCommission(a.commission);
                if (a.schedule) setSchedule(a.schedule);
            })
            .catch((e: unknown) => {
                if (!alive) return;
                setLoadError(e instanceof Error ? e.message : 'No se pudo cargar el agente.');
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, [id]);

    const set = (key: keyof AgentFormValues, transform?: (raw: string) => string) => (e: Event) => {
        const raw = (e.currentTarget as HTMLInputElement).value;
        setValues((v) => ({ ...v, [key]: transform ? transform(raw) : raw }));
    };

    const canSave = values.name.trim() !== '' && values.email.trim() !== '';

    const handlePhotoChange = (e: Event) => {
        const file = (e.currentTarget as HTMLInputElement).files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            pushToast({ type: 'error', title: 'El archivo debe ser una imagen' });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            pushToast({ type: 'error', title: 'La imagen no puede superar los 5 MB' });
            return;
        }
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleRemovePhoto = async () => {
        const oldUrl = values.photo_url;
        setPhotoFile(null);
        setPhotoPreview('');
        setValues((v) => ({ ...v, photo_url: '' }));
        if (oldUrl && oldUrl.includes('/agent-photos/')) {
            await deleteAgentPhoto(oldUrl);
        }
    };

    const handleSubmit = async () => {
        if (!canSave) return;
        setSaving(true);
        try {
            let photoUrl = values.photo_url;
            if (photoFile) {
                const prevUrl = values.photo_url;
                photoUrl = await uploadAgentPhoto(photoFile);
                if (
                    isEdit &&
                    prevUrl &&
                    prevUrl !== photoUrl &&
                    prevUrl.includes('/agent-photos/')
                ) {
                    await deleteAgentPhoto(prevUrl);
                }
            }
            const payload = { ...values, photo_url: photoUrl };
            if (isEdit) {
                await updateAgent(id, payload);
                await updateAgentPermissions(id, permissions);
                await updateAgentCommission(id, commission);
                await updateAgentSchedule(id, schedule);
                pushToast({
                    type: 'success',
                    title: 'Agente actualizado',
                    description: values.name,
                });
            } else {
                const newId = await createAgent(payload);
                pushToast({ type: 'success', title: 'Agente creado', description: values.name });
                setLocation(`/agentes/${newId}`);
                return;
            }
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['agents-full'] }),
                queryClient.invalidateQueries({ queryKey: ['agents'] }),
            ]);
        } catch {
            pushToast({
                type: 'error',
                title: `No se pudo ${isEdit ? 'guardar' : 'crear'} el agente`,
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page">
            <div className="page-head">
                <div>
                    <h2 className="page-title">{isEdit ? 'Editar agente' : 'Nuevo agente'}</h2>
                    <p className="page-subtitle">
                        {isEdit ? 'Actualizá los datos del asesor.' : 'Datos del nuevo asesor.'}
                    </p>
                </div>
                <Link href="/agentes" className="btn btn--secondary">
                    <ArrowLeft size={16} /> Volver
                </Link>
            </div>

            {loadError && (
                <div className="card placeholder-card">
                    <h3>No se pudo abrir el agente</h3>
                    <p>{loadError}</p>
                    <Link href="/agentes" className="btn btn--secondary">
                        Volver al listado
                    </Link>
                </div>
            )}

            {!loadError && loading && <div className="card placeholder-card">Cargando…</div>}

            {!loadError && !loading && (
                <div className="card form-card">
                    <section className="form-section">
                        <div className="form-section-head">
                            <h3>Foto de perfil</h3>
                            <p>
                                JPG, PNG o WebP de hasta 5 MB. Si no subís foto, se muestra la
                                inicial del nombre.
                            </p>
                        </div>
                        <div className={styles['photo-picker']}>
                            <span className={styles['photo-picker-preview']} aria-hidden="true">
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Vista previa" />
                                ) : (
                                    (values.name[0] ?? '').toUpperCase()
                                )}
                            </span>
                            <div className={styles['photo-picker-actions']}>
                                <label className="btn btn--secondary">
                                    {photoPreview ? 'Cambiar foto' : 'Subir foto'}
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp,image/gif"
                                        onChange={handlePhotoChange}
                                        hidden
                                    />
                                </label>
                                {photoPreview && (
                                    <button className="btn btn--ghost" onClick={handleRemovePhoto}>
                                        Quitar foto
                                    </button>
                                )}
                                <span className={`muted ${styles['photo-picker-note']}`}>
                                    {photoFile
                                        ? `${photoFile.name} (listo para subir)`
                                        : 'Sin archivo seleccionado'}
                                </span>
                            </div>
                        </div>
                    </section>

                    <section className="form-section">
                        <div className="form-section-head">
                            <h3>Datos personales</h3>
                            <p>Información que se muestra en la landing.</p>
                        </div>
                        <div className="form-grid">
                            <label className="field">
                                <span>Nombre *</span>
                                <input type="text" value={values.name} onInput={set('name')} />
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
                                <span>Rol</span>
                                <input
                                    type="text"
                                    value={values.role}
                                    placeholder="Ej: Asesor senior"
                                    onInput={set('role')}
                                />
                            </label>
                            <label className="field">
                                <span>Matrícula</span>
                                <input
                                    type="text"
                                    value={values.matricula}
                                    placeholder="N° registro profesional"
                                    onInput={set('matricula')}
                                />
                            </label>
                            <label className="field field--wide">
                                <span>Biografía</span>
                                <textarea
                                    rows={3}
                                    value={values.bio}
                                    onInput={(e) =>
                                        setValues((v) => ({
                                            ...v,
                                            bio: (e.currentTarget as HTMLTextAreaElement).value,
                                        }))
                                    }
                                />
                            </label>
                            <label className="field field--wide">
                                <span>Especialidades</span>
                                <input
                                    type="text"
                                    value={values.specialties}
                                    placeholder="Separadas por coma, ej: Barrios cerrados, Inversión, Alquileres"
                                    onInput={set('specialties')}
                                />
                            </label>
                        </div>
                    </section>

                    {/* Permisos */}
                    <section className="form-section">
                        <div className="form-section-head">
                            <h3>
                                <Shield size={16} /> Permisos del agente
                            </h3>
                            <p>Qué módulos y acciones puede acceder este agente en el panel.</p>
                        </div>
                        <div className="form-grid">
                            <label className="field field--wide">
                                <span className="switch-row">
                                    <input
                                        type="checkbox"
                                        className="switch"
                                        checked={permissions.can_view_leads}
                                        onChange={(e) =>
                                            setPermissions((p) => ({
                                                ...p,
                                                can_view_leads: e.currentTarget.checked,
                                            }))
                                        }
                                    />
                                    Ver leads
                                </span>
                            </label>
                            <label className="field field--wide">
                                <span className="switch-row">
                                    <input
                                        type="checkbox"
                                        className="switch"
                                        checked={permissions.can_edit_leads}
                                        onChange={(e) =>
                                            setPermissions((p) => ({
                                                ...p,
                                                can_edit_leads: e.currentTarget.checked,
                                            }))
                                        }
                                    />
                                    Editar leads
                                </span>
                            </label>
                            <label className="field field--wide">
                                <span className="switch-row">
                                    <input
                                        type="checkbox"
                                        className="switch"
                                        checked={permissions.can_view_properties}
                                        onChange={(e) =>
                                            setPermissions((p) => ({
                                                ...p,
                                                can_view_properties: e.currentTarget.checked,
                                            }))
                                        }
                                    />
                                    Ver propiedades
                                </span>
                            </label>
                            <label className="field field--wide">
                                <span className="switch-row">
                                    <input
                                        type="checkbox"
                                        className="switch"
                                        checked={permissions.can_edit_properties}
                                        onChange={(e) =>
                                            setPermissions((p) => ({
                                                ...p,
                                                can_edit_properties: e.currentTarget.checked,
                                            }))
                                        }
                                    />
                                    Editar propiedades
                                </span>
                            </label>
                            <label className="field field--wide">
                                <span className="switch-row">
                                    <input
                                        type="checkbox"
                                        className="switch"
                                        checked={permissions.can_view_visits}
                                        onChange={(e) =>
                                            setPermissions((p) => ({
                                                ...p,
                                                can_view_visits: e.currentTarget.checked,
                                            }))
                                        }
                                    />
                                    Ver visitas
                                </span>
                            </label>
                            <label className="field field--wide">
                                <span className="switch-row">
                                    <input
                                        type="checkbox"
                                        className="switch"
                                        checked={permissions.can_manage_visits}
                                        onChange={(e) =>
                                            setPermissions((p) => ({
                                                ...p,
                                                can_manage_visits: e.currentTarget.checked,
                                            }))
                                        }
                                    />
                                    Gestionar visitas
                                </span>
                            </label>
                            <label className="field field--wide">
                                <span className="switch-row">
                                    <input
                                        type="checkbox"
                                        className="switch"
                                        checked={permissions.can_view_ml}
                                        onChange={(e) =>
                                            setPermissions((p) => ({
                                                ...p,
                                                can_view_ml: e.currentTarget.checked,
                                            }))
                                        }
                                    />
                                    Ver Mercado Libre
                                </span>
                            </label>
                            <label className="field field--wide">
                                <span className="switch-row">
                                    <input
                                        type="checkbox"
                                        className="switch"
                                        checked={permissions.can_manage_ml}
                                        onChange={(e) =>
                                            setPermissions((p) => ({
                                                ...p,
                                                can_manage_ml: e.currentTarget.checked,
                                            }))
                                        }
                                    />
                                    Gestionar Mercado Libre
                                </span>
                            </label>
                            <label className="field field--wide">
                                <span className="switch-row">
                                    <input
                                        type="checkbox"
                                        className="switch"
                                        checked={permissions.can_view_reports}
                                        onChange={(e) =>
                                            setPermissions((p) => ({
                                                ...p,
                                                can_view_reports: e.currentTarget.checked,
                                            }))
                                        }
                                    />
                                    Ver reportes
                                </span>
                            </label>
                            <label className="field field--wide">
                                <span className="switch-row">
                                    <input
                                        type="checkbox"
                                        className="switch"
                                        checked={permissions.can_manage_agents}
                                        onChange={(e) =>
                                            setPermissions((p) => ({
                                                ...p,
                                                can_manage_agents: e.currentTarget.checked,
                                            }))
                                        }
                                    />
                                    Gestionar agentes
                                </span>
                            </label>
                            <label className="field field--wide">
                                <span className="switch-row">
                                    <input
                                        type="checkbox"
                                        className="switch"
                                        checked={permissions.can_manage_settings}
                                        onChange={(e) =>
                                            setPermissions((p) => ({
                                                ...p,
                                                can_manage_settings: e.currentTarget.checked,
                                            }))
                                        }
                                    />
                                    Gestionar configuración
                                </span>
                            </label>
                        </div>
                    </section>

                    {/* Comisión */}
                    <section className="form-section">
                        <div className="form-section-head">
                            <h3>
                                <DollarSign size={16} /> Configuración de comisiones
                            </h3>
                            <p>Porcentajes y montos fijos por tipo de operación.</p>
                        </div>
                        <div className="form-grid">
                            <label className="field">
                                <span>% Venta</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={commission.sale_percentage}
                                    onChange={(e) =>
                                        setCommission((c) => ({
                                            ...c,
                                            sale_percentage: Number(e.currentTarget.value) || 0,
                                        }))
                                    }
                                />
                            </label>
                            <label className="field">
                                <span>% Alquiler</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={commission.rental_percentage}
                                    onChange={(e) =>
                                        setCommission((c) => ({
                                            ...c,
                                            rental_percentage: Number(e.currentTarget.value) || 0,
                                        }))
                                    }
                                />
                            </label>
                            <label className="field">
                                <span>Fijo por venta (USD)</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={commission.fixed_per_sale ?? 0}
                                    onChange={(e) =>
                                        setCommission((c) => ({
                                            ...c,
                                            fixed_per_sale:
                                                Number(e.currentTarget.value) || undefined,
                                        }))
                                    }
                                    placeholder="Opcional"
                                />
                            </label>
                            <label className="field">
                                <span>Fijo por alquiler (USD)</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={commission.fixed_per_rental ?? 0}
                                    onChange={(e) =>
                                        setCommission((c) => ({
                                            ...c,
                                            fixed_per_rental:
                                                Number(e.currentTarget.value) || undefined,
                                        }))
                                    }
                                    placeholder="Opcional"
                                />
                            </label>
                            <label className="field">
                                <span>Comisión mínima (USD)</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={commission.min_commission ?? 0}
                                    onChange={(e) =>
                                        setCommission((c) => ({
                                            ...c,
                                            min_commission:
                                                Number(e.currentTarget.value) || undefined,
                                        }))
                                    }
                                    placeholder="Opcional"
                                />
                            </label>
                            <label className="field">
                                <span>Tope máximo (USD)</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={commission.max_commission ?? 0}
                                    onChange={(e) =>
                                        setCommission((c) => ({
                                            ...c,
                                            max_commission:
                                                Number(e.currentTarget.value) || undefined,
                                        }))
                                    }
                                    placeholder="Opcional"
                                />
                            </label>
                        </div>
                    </section>

                    {/* Horarios */}
                    <section className="form-section">
                        <div className="form-section-head">
                            <h3>
                                <Calendar size={16} /> Horarios de atención
                            </h3>
                            <p>Días y horas en que el agente está disponible para visitas.</p>
                        </div>
                        <div
                            className="schedule-grid"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                gap: '12px',
                            }}
                        >
                            {DAYS.map((_day, idx) => {
                                const daySchedule = schedule.find((s) => s.day_of_week === idx) || {
                                    day_of_week: idx,
                                    start_time: '09:00',
                                    end_time: '18:00',
                                    is_available: idx !== 0,
                                };
                                return (
                                    <div
                                        key={idx}
                                        className="schedule-day"
                                        style={{
                                            border: '1px solid var(--bh-border)',
                                            borderRadius: '8px',
                                            padding: '12px',
                                            background: 'var(--bh-bg-card)',
                                        }}
                                    >
                                        <label
                                            className="switch-row"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                marginBottom: '8px',
                                                fontWeight: 600,
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                className="switch"
                                                checked={daySchedule.is_available}
                                                onChange={(e) =>
                                                    setSchedule((s) =>
                                                        s.map((s) =>
                                                            s.day_of_week === idx
                                                                ? {
                                                                      ...s,
                                                                      is_available:
                                                                          e.currentTarget.checked,
                                                                  }
                                                                : s,
                                                        ),
                                                    )
                                                }
                                            />
                                            {DAYS[idx]}
                                        </label>
                                        {daySchedule.is_available && (
                                            <div className="form-grid" style={{ marginTop: '8px' }}>
                                                <label className="field">
                                                    <span>Inicio</span>
                                                    <input
                                                        type="time"
                                                        value={daySchedule.start_time}
                                                        onChange={(e) =>
                                                            setSchedule((s) =>
                                                                s.map((s) =>
                                                                    s.day_of_week === idx
                                                                        ? {
                                                                              ...s,
                                                                              start_time:
                                                                                  e.currentTarget
                                                                                      .value,
                                                                          }
                                                                        : s,
                                                                ),
                                                            )
                                                        }
                                                    />
                                                </label>
                                                <label className="field">
                                                    <span>Fin</span>
                                                    <input
                                                        type="time"
                                                        value={daySchedule.end_time}
                                                        onChange={(e) =>
                                                            setSchedule((s) =>
                                                                s.map((s) =>
                                                                    s.day_of_week === idx
                                                                        ? {
                                                                              ...s,
                                                                              end_time:
                                                                                  e.currentTarget
                                                                                      .value,
                                                                          }
                                                                        : s,
                                                                ),
                                                            )
                                                        }
                                                    />
                                                </label>
                                                <label className="field field--wide">
                                                    <span className="switch-row">
                                                        <input
                                                            type="checkbox"
                                                            className="switch"
                                                            checked={
                                                                !!daySchedule.break_start &&
                                                                !!daySchedule.break_end
                                                            }
                                                            onChange={(e) =>
                                                                setSchedule((s) =>
                                                                    s.map((s) =>
                                                                        s.day_of_week === idx
                                                                            ? {
                                                                                  ...s,
                                                                                  break_start: e
                                                                                      .currentTarget
                                                                                      .checked
                                                                                      ? '13:00'
                                                                                      : undefined,
                                                                                  break_end: e
                                                                                      .currentTarget
                                                                                      .checked
                                                                                      ? '14:00'
                                                                                      : undefined,
                                                                              }
                                                                            : s,
                                                                    ),
                                                                )
                                                            }
                                                        />
                                                        Pausa (13:00-14:00)
                                                    </span>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <div className="form-actions">
                        <Link href="/agentes" className="btn btn--secondary">
                            Cancelar
                        </Link>
                        <button
                            type="button"
                            className="btn btn--primary"
                            onClick={handleSubmit}
                            disabled={saving || !canSave}
                        >
                            {saving ? (
                                'Guardando…'
                            ) : (
                                <>
                                    <Save size={16} /> Guardar
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
