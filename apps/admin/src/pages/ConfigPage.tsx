// ============================================================
// ConfigPage — panel unificado de configuración
// Pestañas: Usuarios · Mercado Libre · Sitio Web · Idiomas · Versiones
// ============================================================
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import {
    Check,
    ChevronDown,
    ChevronUp,
    Copy,
    Eye,
    EyeOff,
    Globe,
    History,
    KeyRound,
    Languages,
    type LucideIcon,
    Plus,
    RefreshCw,
    RotateCcw,
    Save,
    Trash2,
    Upload,
    UserPlus,
    Users,
    X,
    Zap,
} from 'lucide-preact';
import type { ComponentChildren } from 'preact';
import {
    ADMIN_ROLE_LABEL,
    type AdminRole,
    type AdminUserRow,
    fetchAdminUsers,
    fetchMyUserId,
    inviteAdminUser,
    removeAdminUser,
    resetAdminUserPassword,
    updateAdminUser,
} from '../lib/admin';
import { fetchMlSettings, setMlAppId, setMlDefaults } from '../lib/ml';
import { queryClient } from '../lib/query/client';
import { useMutation, useQuery } from '../lib/query/hooks';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { pushToast } from '../store/app';
import {
    CONTENT_KEY_LABELS,
    contentFieldsFor,
    type ContentSection,
    deleteSiteImage,
    fetchSiteContent,
    fetchSiteSettings,
    fetchSiteSettingsVersions,
    type FieldMeta,
    genericFields,
    isListField,
    type ListMeta,
    listMetaFor,
    LOCALES,
    restoreSiteSettingsVersion,
    SECTION_KEYS,
    SECTION_LABELS,
    settingFieldsFor,
    type SiteContentRow,
    type SiteSettingRow,
    type SiteSettingsVersionRow,
    uploadSiteImage,
    upsertSiteContent,
    upsertSiteSettingWithVersion,
} from '../lib/site';
import { validateSetting } from '../lib/site-validation';
import { Button, IconButton, Spinner } from '@bienenhaus/ui';
import styles from './ConfigPage.module.css';

// ============================================================
// Utils + tipos compartidos
// ============================================================

type IconCmp = LucideIcon;

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

function fieldInputValue(value: unknown): string {
    if (typeof value === 'number') return String(value);
    if (typeof value === 'string') return value;
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return '';
}

/** Normaliza el valor jsonb: las listas pueden venir como array plano o {items:[...]}. */
function normalizeValue(value: unknown): Record<string, unknown> {
    if (Array.isArray(value)) return { items: value };
    if (value && typeof value === 'object') return { ...(value as Record<string, unknown>) };
    return {};
}

function Modal({
    title,
    onClose,
    children,
}: {
    title: string;
    onClose: () => void;
    children: ComponentChildren;
}) {
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-head">
                    <h3>{title}</h3>
                    <button
                        type="button"
                        className="modal-close"
                        onClick={onClose}
                        aria-label="Cerrar"
                    >
                        <X size={16} strokeWidth={2} />
                    </button>
                </div>
                <div className="modal-body">{children}</div>
            </div>
        </div>
    );
}

// ============================================================
// FieldEditor — inputs por tipo de campo (text, textarea, number, boolean, image)
// ============================================================

function ImageInput({ value, onChange }: { value: unknown; onChange: (url: string) => void }) {
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const url = typeof value === 'string' ? value : '';

    const handleFile = async (file: File | undefined) => {
        if (!file) return;
        setUploading(true);
        try {
            const publicUrl = await uploadSiteImage(file);
            onChange(publicUrl);
        } catch {
            pushToast({ type: 'error', title: 'No se pudo subir la imagen' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className={styles['image-field']}>
            {url ? (
                <div className={styles['image-preview']}>
                    <img src={url} alt="Vista previa" />
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                            onChange('');
                            void deleteSiteImage(url);
                        }}
                    >
                        <Trash2 size={13} /> Quitar
                    </Button>
                </div>
            ) : (
                <Button
                    variant="secondary"
                    size="sm"
                    disabled={uploading}
                    onClick={() => inputRef.current?.click()}
                >
                    <Upload size={14} /> {uploading ? 'Subiendo…' : 'Subir imagen'}
                </Button>
            )}
            <input
                type="file"
                ref={inputRef}
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                style={{ display: 'none' }}
                onChange={(e) => {
                    handleFile(e.currentTarget.files?.[0]);
                    e.currentTarget.value = '';
                }}
            />
        </div>
    );
}

function FieldInput({
    field,
    value,
    onChange,
}: {
    field: FieldMeta;
    value: unknown;
    onChange: (raw: string) => void;
}) {
    const raw = fieldInputValue(value);

    if (field.type === 'textarea') {
        return (
            <label className="field">
                <span>{field.label}</span>
                <textarea
                    rows={3}
                    value={raw}
                    onInput={(e) => onChange((e.currentTarget as HTMLTextAreaElement).value)}
                />
            </label>
        );
    }

    if (field.type === 'boolean') {
        const checked = value === true || raw === 'true';
        return (
            <label className={styles['boolean-field']}>
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.currentTarget.checked ? 'true' : 'false')}
                />
                <span>{field.label}</span>
            </label>
        );
    }

    if (field.type === 'image') {
        return <ImageInput value={value} onChange={onChange} />;
    }

    return (
        <label className="field">
            <span>{field.label}</span>
            <input
                type={field.type === 'number' ? 'number' : 'text'}
                value={raw}
                onInput={(e) => onChange((e.currentTarget as HTMLInputElement).value)}
            />
        </label>
    );
}

// ============================================================
// ListEditor — campos repetibles (stats, features, items, steps, info)
// ============================================================

function ListEditor({
    meta,
    items,
    onChange,
}: {
    meta: ListMeta;
    items: unknown;
    onChange: (items: Record<string, unknown>[]) => void;
}) {
    const list = (Array.isArray(items) ? items : []).filter(
        (x): x is Record<string, unknown> => !!x && typeof x === 'object',
    );

    const updateItem = (i: number, key: string, raw: string) => {
        const next = [...list];
        const current = next[i] ?? {};
        const prevType = typeof current[key];
        next[i] = {
            ...current,
            [key]:
                prevType === 'number'
                    ? raw === ''
                        ? null
                        : Number(raw)
                    : prevType === 'boolean'
                      ? raw === 'true'
                      : raw,
        };
        onChange(next);
    };

    const removeItem = (i: number) => onChange(list.filter((_, j) => j !== i));

    const moveItem = (i: number, dir: -1 | 1) => {
        const j = i + dir;
        if (j < 0 || j >= list.length) return;
        const next = [...list];
        const [item] = next.splice(i, 1);
        next.splice(j, 0, item);
        onChange(next);
    };

    return (
        <div className={styles['list-editor']}>
            {list.length === 0 && <p className={styles['list-empty']}>No hay items todavía.</p>}
            {list.map((item, i) => (
                <div className={styles['list-item']} key={i}>
                    <div className={styles['list-item-head']}>
                        <span>
                            {meta.itemLabel} {i + 1}
                        </span>
                        <div className={styles['list-item-actions']}>
                            <IconButton
                                variant="ghost"
                                title="Subir"
                                aria-label="Subir"
                                onClick={() => moveItem(i, -1)}
                            >
                                <ChevronUp size={14} />
                            </IconButton>
                            <IconButton
                                variant="ghost"
                                title="Bajar"
                                aria-label="Bajar"
                                onClick={() => moveItem(i, 1)}
                            >
                                <ChevronDown size={14} />
                            </IconButton>
                            <IconButton
                                variant="danger"
                                title="Eliminar"
                                aria-label="Eliminar"
                                onClick={() => removeItem(i)}
                            >
                                <Trash2 size={13} />
                            </IconButton>
                        </div>
                    </div>
                    <div className="form-grid">
                        {meta.fields.map((f) => (
                            <FieldInput
                                key={f.key}
                                field={f}
                                value={item[f.key]}
                                onChange={(raw) => updateItem(i, f.key, raw)}
                            />
                        ))}
                    </div>
                </div>
            ))}
            <Button
                variant="secondary"
                size="sm"
                onClick={() => onChange([...list, {}])}
            >
                <Plus size={14} /> Agregar {meta.itemLabel.toLowerCase()}
            </Button>
        </div>
    );
}

// ============================================================
// ContentEditor — edita site_content para un locale dado
// ============================================================

interface ContentDraft {
    id: string | null;
    value: Record<string, unknown>;
    isActive: boolean;
}

function ContentRowEditor({
    heading,
    fields,
    value,
    isActive,
    onFieldChange,
    onToggleActive,
}: {
    heading: string;
    fields: FieldMeta[];
    value: Record<string, unknown>;
    isActive: boolean;
    onFieldChange: (key: string, raw: string) => void;
    onToggleActive: (v: boolean) => void;
}) {
    return (
        <div className={`${styles['content-row']}${isActive ? '' : ` ${styles['is-inactive']}`}`}>
            <div className={styles['content-row-head']}>
                <h4>{heading}</h4>
                <label className={styles['boolean-field']}>
                    <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => onToggleActive(e.currentTarget.checked)}
                    />
                    <span>{isActive ? 'Activado' : 'Desactivado'}</span>
                </label>
            </div>
            <div className="form-grid">
                {fields.map((f) => (
                    <FieldInput
                        key={f.key}
                        field={f}
                        value={value[f.key]}
                        onChange={(raw) => onFieldChange(f.key, raw)}
                    />
                ))}
            </div>
        </div>
    );
}

function ContentEditor({ locale, onSaved }: { locale: string; onSaved: () => void }) {
    const contentQ = useQuery<SiteContentRow[]>({
        queryKey: ['site-content'],
        queryFn: fetchSiteContent,
    });
    const [drafts, setDrafts] = useState<Record<string, ContentDraft>>({});
    const [baseline, setBaseline] = useState<Record<string, ContentDraft>>({});
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        if (!contentQ.data) return;
        const base: Record<string, ContentDraft> = {};
        const esRows = new Map<string, SiteContentRow>();
        const locRows = new Map<string, SiteContentRow>();
        for (const r of contentQ.data) {
            const k = `${r.section}|${r.key}`;
            if (r.locale === 'es-AR') esRows.set(k, r);
            if (r.locale === locale) locRows.set(k, r);
        }
        const allKeys = new Set([...esRows.keys(), ...locRows.keys()]);
        for (const k of allKeys) {
            const row = locRows.get(k) ?? esRows.get(k);
            base[k] = {
                id: row?.id ?? null,
                value: normalizeValue(row?.value),
                isActive: row?.is_active ?? true,
            };
        }
        setBaseline(base);
        setDrafts((prev) => {
            const next: Record<string, ContentDraft> = {};
            for (const [k, entry] of Object.entries(base)) {
                next[k] = prev[k] ?? { ...entry };
            }
            return next;
        });
    }, [contentQ.data, locale]);

    const isDirty = (dk: string, entry: ContentDraft): boolean => {
        const b = baseline[dk];
        if (!b) return true;
        return (
            JSON.stringify(entry.value) !== JSON.stringify(b.value) || entry.isActive !== b.isActive
        );
    };

    const setEntry = (dk: string, patch: Partial<ContentDraft>) => {
        setDrafts((d) => ({
            ...d,
            [dk]: { ...(d[dk] ?? { id: null, value: {}, isActive: true }), ...patch },
        }));
    };

    const setField = (dk: string) => (key: string, raw: string) => {
        setDrafts((d) => {
            const current = d[dk] ?? { id: null, value: {}, isActive: true };
            const value = { ...current.value };
            value[key] = typeof current.value[key] === 'number' ? Number(raw) : raw;
            return { ...d, [dk]: { ...current, value } };
        });
    };

    const saveSection = async (section: ContentSection) => {
        setSaving(`c-${section}`);
        try {
            const dirty: { dk: string; entry: ContentDraft }[] = [];
            for (const [dk, entry] of Object.entries(drafts)) {
                if (!dk.startsWith(`${section}|`)) continue;
                if (isDirty(dk, entry)) dirty.push({ dk, entry });
            }
            for (const { dk, entry } of dirty) {
                const key = dk.split('|')[1];
                await upsertSiteContent({
                    id: entry.id,
                    section,
                    key,
                    locale,
                    value: entry.value,
                    is_active: entry.isActive,
                });
            }
            await queryClient.invalidateQueries({ queryKey: ['site-content'] });
            onSaved();
            pushToast({
                type: 'success',
                title: dirty.length > 0 ? 'Sección guardada' : 'Sin cambios pendientes',
                description:
                    dirty.length > 0
                        ? `${SECTION_LABELS[section]} (${dirty.length} campo${dirty.length === 1 ? '' : 's'})`
                        : undefined,
            });
        } catch {
            pushToast({ type: 'error', title: 'No se pudo guardar la sección' });
        } finally {
            setSaving(null);
        }
    };

    const sectionDirtyCount = (section: ContentSection) => {
        let count = 0;
        for (const [dk, entry] of Object.entries(drafts)) {
            if (!dk.startsWith(`${section}|`)) continue;
            if (isDirty(dk, entry)) count += 1;
        }
        return count;
    };

    return (
        <div className={styles['editor-body']}>
            {(Object.keys(SECTION_KEYS) as ContentSection[]).map((section) => {
                const rows = SECTION_KEYS[section] ?? [];
                const dirtyCount = sectionDirtyCount(section);
                return (
                    <section key={section} className="card">
                        <div className="site-section-head">
                            <div>
                                <h3>{SECTION_LABELS[section]}</h3>
                                <p className="muted">
                                    {dirtyCount > 0
                                        ? `${dirtyCount} campo${dirtyCount === 1 ? '' : 's'} sin guardar`
                                        : 'Sin cambios pendientes'}
                                </p>
                            </div>
                            <Button
                                onClick={() => saveSection(section)}
                                disabled={saving !== null || dirtyCount === 0}
                            >
                                {saving === `c-${section}` ? (
                                    <Spinner size="sm" inline color="inherit" />
                                ) : (
                                    <Save size={15} />
                                )}
                                Guardar
                            </Button>
                        </div>
                        <div className={styles['editor-body']}>
                            {rows.map((key) => {
                                const dk = `${section}|${key}`;
                                const entry = drafts[dk] ?? { id: null, value: {}, isActive: true };
                                const heading = CONTENT_KEY_LABELS[key] ?? key;
                                if (isListField(section, key)) {
                                    const meta = listMetaFor(section, key);
                                    if (!meta) return null;
                                    return (
                                        <div
                                            key={key}
                                            className={`${styles['content-row']}${entry.isActive ? '' : ` ${styles['is-inactive']}`}`}
                                        >
                                            <div className={styles['content-row-head']}>
                                                <h4>{heading}</h4>
                                                <label className={styles['boolean-field']}>
                                                    <input
                                                        type="checkbox"
                                                        checked={entry.isActive}
                                                        onChange={(e) =>
                                                            setEntry(dk, {
                                                                isActive: e.currentTarget.checked,
                                                            })
                                                        }
                                                    />
                                                    <span>
                                                        {entry.isActive
                                                            ? 'Activado'
                                                            : 'Desactivado'}
                                                    </span>
                                                </label>
                                            </div>
                                            <ListEditor
                                                meta={meta}
                                                items={entry.value.items ?? entry.value}
                                                onChange={(items) => {
                                                    setEntry(dk, {
                                                        value: { ...entry.value, items },
                                                    });
                                                }}
                                            />
                                        </div>
                                    );
                                }
                                const fields =
                                    contentFieldsFor(section, key) ?? genericFields(entry.value);
                                return (
                                    <ContentRowEditor
                                        key={key}
                                        heading={heading}
                                        fields={fields}
                                        value={entry.value}
                                        isActive={entry.isActive}
                                        onFieldChange={setField(dk)}
                                        onToggleActive={(v) => setEntry(dk, { isActive: v })}
                                    />
                                );
                            })}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}

// ============================================================
// SettingsEditor — edita site_settings (locale base es-AR) con validación + versionado
// ============================================================

interface SettingDraft {
    value: Record<string, unknown>;
    value_type: SiteSettingRow['value_type'];
    is_public: boolean;
}

function SettingsEditor({ onSaved }: { onSaved: () => void }) {
    const settingsQ = useQuery<SiteSettingRow[]>({
        queryKey: ['site-settings'],
        queryFn: fetchSiteSettings,
    });
    const [drafts, setDrafts] = useState<Record<string, SettingDraft>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!settingsQ.data) return;
        setDrafts((prev) => {
            const next: Record<string, SettingDraft> = {};
            for (const row of settingsQ.data) {
                next[row.key] = prev[row.key] ?? {
                    value: { ...row.value },
                    value_type: row.value_type,
                    is_public: row.is_public,
                };
            }
            return next;
        });
    }, [settingsQ.data]);

    const isDirty = (row: SiteSettingRow): boolean => {
        const d = drafts[row.key];
        if (!d) return false;
        return (
            JSON.stringify(d.value) !== JSON.stringify(row.value) || d.is_public !== row.is_public
        );
    };

    const setField = (key: string, field: FieldMeta) => (raw: string) => {
        setDrafts((d) => {
            const current = d[key] ?? {
                value: { [field.key]: '' },
                value_type: 'json' as const,
                is_public: true,
            };
            const value = { ...current.value };
            if (field.type === 'boolean') value[field.key] = raw === 'true';
            else if (field.type === 'number') value[field.key] = raw === '' ? null : Number(raw);
            else value[field.key] = raw;
            return { ...d, [key]: { ...current, value } };
        });
    };

    const togglePublic = (key: string) => {
        setDrafts((d) => {
            const current = d[key];
            if (!current) return d;
            return { ...d, [key]: { ...current, is_public: !current.is_public } };
        });
    };

    const validateDraft = (d: SettingDraft): { valid: boolean; error?: string } => {
        if (d.value_type === 'json') return validateSetting(d.value, 'json');
        return validateSetting(d.value['value'], d.value_type);
    };

    const save = async () => {
        const dirty = (settingsQ.data ?? []).filter(isDirty);
        if (dirty.length === 0) {
            pushToast({ type: 'info', title: 'Sin cambios pendientes' });
            return;
        }
        for (const row of dirty) {
            const d = drafts[row.key];
            if (!d) continue;
            const check = validateDraft(d);
            if (!check.valid) {
                pushToast({
                    type: 'error',
                    title: `Error en «${row.key}»`,
                    description: check.error,
                });
                return;
            }
        }
        setSaving(true);
        try {
            for (const row of dirty) {
                const d = drafts[row.key];
                if (!d) continue;
                await upsertSiteSettingWithVersion(row.key, d.value, {
                    value_type: d.value_type,
                    is_public: d.is_public,
                    locale: 'es-AR',
                });
            }
            await queryClient.invalidateQueries({ queryKey: ['site-settings'] });
            await queryClient.invalidateQueries({ queryKey: ['site-settings-versions'] });
            onSaved();
            pushToast({
                type: 'success',
                title: 'Ajustes guardados',
                description: `${dirty.length} ajuste${dirty.length === 1 ? '' : 's'} actualizado${dirty.length === 1 ? '' : 's'} con versión`,
            });
        } catch (e) {
            pushToast({
                type: 'error',
                title: 'No se pudieron guardar los ajustes',
                description: (e as Error).message,
            });
        } finally {
            setSaving(false);
        }
    };

    const dirtyCount = (settingsQ.data ?? []).filter(isDirty).length;

    return (
        <section className="card">
            <div className="site-section-head">
                <div>
                    <h3>Ajustes del sitio</h3>
                    <p className="muted">
                        {dirtyCount > 0
                            ? `${dirtyCount} ajuste${dirtyCount === 1 ? '' : 's'} sin guardar`
                            : 'Sin cambios pendientes'}
                    </p>
                </div>
                <Button
                    onClick={() => void save()}
                    disabled={saving || dirtyCount === 0}
                >
                    {saving ? <Spinner size="sm" inline color="inherit" /> : <Save size={15} />}
                    Guardar ajustes
                </Button>
            </div>
            <div className={styles['editor-body']}>
                {settingsQ.isPending && <div className="placeholder-card">Cargando ajustes…</div>}
                {(settingsQ.data ?? []).map((row) => {
                    const d = drafts[row.key];
                    if (!d) return null;
                    const fields = settingFieldsFor(row.key) ?? genericFields(row.value);
                    const isImage = fields.some((f) => f.type === 'image');
                    return (
                        <div
                            key={row.id}
                            className={`${styles['content-row']}${isDirty(row) ? '' : ''}`}
                        >
                            <div className={styles['content-row-head']}>
                                <h4>{row.description ?? row.key}</h4>
                                <label className={styles['boolean-field']}>
                                    <input
                                        type="checkbox"
                                        checked={d.is_public}
                                        onChange={() => togglePublic(row.key)}
                                    />
                                    <span>Público</span>
                                </label>
                            </div>
                            {isImage ? (
                                <div className="form-grid">
                                    {fields.map((f) => (
                                        <FieldInput
                                            key={f.key}
                                            field={f}
                                            value={d.value[f.key]}
                                            onChange={(raw) => setField(row.key, f)(raw)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="form-grid">
                                    {fields.map((f) => (
                                        <FieldInput
                                            key={f.key}
                                            field={f}
                                            value={d.value[f.key]}
                                            onChange={(raw) => setField(row.key, f)(raw)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
                {(settingsQ.data ?? []).length === 0 && !settingsQ.isPending && (
                    <p className="muted">No hay ajustes configurados todavía.</p>
                )}
            </div>
        </section>
    );
}

// ============================================================
// PreviewPane — vista previa de la landing
// ============================================================

function PreviewPane({ previewKey, onClose }: { previewKey: number; onClose: () => void }) {
    const base =
        import.meta.env.VITE_LANDING_URL ?? (import.meta.env.DEV ? 'http://localhost:5174' : '/');
    const href = `${base}${base.endsWith('/') ? '' : '/'}?v=${previewKey}`;
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-card modal--large" onClick={(e) => e.stopPropagation()}>
                <div className="modal-head">
                    <h3>Vista previa de la landing</h3>
                    <button
                        type="button"
                        className="modal-close"
                        onClick={onClose}
                        aria-label="Cerrar"
                    >
                        <X size={16} strokeWidth={2} />
                    </button>
                </div>
                <div className="modal-body" style={{ padding: 0 }}>
                    <iframe
                        key={href}
                        src={href}
                        title="Vista previa de la landing"
                        className={styles['preview-frame']}
                    />
                </div>
            </div>
        </div>
    );
}

// ============================================================
// UsersTab — usuarios del panel (original de ConfigPage)
// ============================================================

function UsersTab() {
    const usersQ = useQuery<AdminUserRow[]>({
        queryKey: ['admin-users'],
        queryFn: fetchAdminUsers,
    });
    const [myId, setMyId] = useState<string | null>(null);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [linkModal, setLinkModal] = useState<{ title: string; link: string } | null>(null);
    const [inviteForm, setInviteForm] = useState({
        email: '',
        full_name: '',
        role: 'staff' as AdminRole,
    });
    const [removeTarget, setRemoveTarget] = useState<string | null>(null);

    useEffect(() => {
        void fetchMyUserId()
            .then(setMyId)
            .catch(() => {});
    }, []);

    const invalidateUsers = () => {
        void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    };

    const myRow = (usersQ.data ?? []).find((u) => u.id === myId) ?? null;
    const isSuperAdmin = myRow?.role === 'super_admin';

    const inviteMutation = useMutation({
        mutationFn: () =>
            inviteAdminUser({
                email: inviteForm.email.trim(),
                full_name: inviteForm.full_name.trim(),
                role: inviteForm.role,
            }),
        onSuccess: (res) => {
            setInviteOpen(false);
            setInviteForm({ email: '', full_name: '', role: 'staff' });
            invalidateUsers();
            if (res.link) {
                setLinkModal({ title: 'Enlace de acceso', link: res.link });
            } else {
                pushToast({ type: 'success', title: 'Usuario invitado' });
            }
        },
        onError: (err) => {
            pushToast({
                type: 'error',
                title: 'No se pudo invitar',
                description: (err as Error).message,
            });
        },
    });

    const roleMutation = useMutation({
        mutationFn: ({ id, role }: { id: string; role: AdminRole }) =>
            updateAdminUser(id, { role }),
        onSuccess: () => {
            invalidateUsers();
            pushToast({ type: 'success', title: 'Rol actualizado' });
        },
        onError: (err) => {
            pushToast({
                type: 'error',
                title: 'No se pudo actualizar el rol',
                description: (err as Error).message,
            });
        },
    });

    const activeMutation = useMutation({
        mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
            updateAdminUser(id, { is_active }),
        onSuccess: () => {
            invalidateUsers();
            pushToast({ type: 'success', title: 'Estado actualizado' });
        },
        onError: (err) => {
            pushToast({
                type: 'error',
                title: 'No se pudo actualizar el estado',
                description: (err as Error).message,
            });
        },
    });

    const resetMutation = useMutation({
        mutationFn: (email: string) => resetAdminUserPassword(email),
        onSuccess: (res) => {
            if (res.link) {
                setLinkModal({ title: 'Enlace de restablecimiento', link: res.link });
            } else {
                pushToast({ type: 'success', title: 'Enlace enviado por email' });
            }
        },
        onError: (err) => {
            pushToast({
                type: 'error',
                title: 'No se pudo generar el enlace',
                description: (err as Error).message,
            });
        },
    });

    const removeMutation = useMutation({
        mutationFn: (email: string) => removeAdminUser(email),
        onSuccess: () => {
            invalidateUsers();
            pushToast({ type: 'success', title: 'Usuario eliminado' });
        },
        onError: (err) => {
            pushToast({
                type: 'error',
                title: 'No se pudo eliminar',
                description: (err as Error).message,
            });
        },
    });

    const copyLink = () => {
        if (linkModal) {
            void navigator.clipboard.writeText(linkModal.link);
            pushToast({ type: 'info', title: 'Enlace copiado' });
        }
    };

    return (
        <>
            <section className="card">
                <div className="site-section-head">
                    <div>
                        <h3>Usuarios del panel</h3>
                        <p className="muted">
                            {isSuperAdmin
                                ? 'Creá accesos, cambiá roles y revocá permisos.'
                                : 'Solo los super admins pueden modificar usuarios.'}
                        </p>
                    </div>
                    {isSuperAdmin && (
                        <Button onClick={() => setInviteOpen(true)}>
                            <UserPlus size={16} /> Invitar usuario
                        </Button>
                    )}
                </div>

                {usersQ.isPending && <div className="placeholder-card">Cargando usuarios…</div>}

                {!usersQ.isPending && (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Usuario</th>
                                <th>Rol</th>
                                <th>Activo</th>
                                <th>Último acceso</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(usersQ.data ?? []).map((u) => (
                                <tr key={u.id}>
                                    <td>
                                        <strong>{u.full_name}</strong>
                                        <span className="muted"> {u.email}</span>
                                    </td>
                                    <td>
                                        <select
                                            className="select select--sm"
                                            value={u.role}
                                            disabled={!isSuperAdmin}
                                            onChange={(e) => {
                                                const role = (e.currentTarget as HTMLSelectElement)
                                                    .value as AdminRole;
                                                roleMutation.mutate({ id: u.id, role });
                                            }}
                                        >
                                            {(Object.keys(ADMIN_ROLE_LABEL) as AdminRole[]).map(
                                                (r) => (
                                                    <option key={r} value={r}>
                                                        {ADMIN_ROLE_LABEL[r]}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </td>
                                    <td>
                                        <input
                                            type="checkbox"
                                            className="switch"
                                            checked={u.is_active}
                                            disabled={!isSuperAdmin}
                                            aria-label={`Activar ${u.email}`}
                                            onChange={(e) =>
                                                activeMutation.mutate({
                                                    id: u.id,
                                                    is_active: (e.currentTarget as HTMLInputElement)
                                                        .checked,
                                                })
                                            }
                                        />
                                    </td>
                                    <td className="muted">{formatDate(u.last_login_at)}</td>
                                    <td>
                                        {isSuperAdmin && (
                                            <div className="row-actions">
                                                <IconButton
                                                    variant="ghost"
                                                    title="Restablecer contraseña"
                                                    aria-label="Restablecer contraseña"
                                                    onClick={() => resetMutation.mutate(u.email)}
                                                >
                                                    <KeyRound size={14} />
                                                </IconButton>
                                                <IconButton
                                                    variant="danger"
                                                    title="Eliminar usuario"
                                                    aria-label="Eliminar usuario"
                                                    disabled={u.id === myId}
                                                    onClick={() => setRemoveTarget(u.email)}
                                                >
                                                    <Trash2 size={14} />
                                                </IconButton>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            {inviteOpen && (
                <Modal title="Invitar usuario" onClose={() => setInviteOpen(false)}>
                    <div className="form-grid">
                        <label className="field">
                            <span>Nombre completo</span>
                            <input
                                type="text"
                                value={inviteForm.full_name}
                                onInput={(e) =>
                                    setInviteForm((f) => ({
                                        ...f,
                                        full_name: (e.currentTarget as HTMLInputElement).value,
                                    }))
                                }
                            />
                        </label>
                        <label className="field">
                            <span>Email</span>
                            <input
                                type="email"
                                value={inviteForm.email}
                                onInput={(e) =>
                                    setInviteForm((f) => ({
                                        ...f,
                                        email: (e.currentTarget as HTMLInputElement).value,
                                    }))
                                }
                            />
                        </label>
                        <label className="field">
                            <span>Rol</span>
                            <select
                                className="select"
                                value={inviteForm.role}
                                onChange={(e) =>
                                    setInviteForm((f) => ({
                                        ...f,
                                        role: (e.currentTarget as HTMLSelectElement)
                                            .value as AdminRole,
                                    }))
                                }
                            >
                                {(Object.keys(ADMIN_ROLE_LABEL) as AdminRole[]).map((r) => (
                                    <option key={r} value={r}>
                                        {ADMIN_ROLE_LABEL[r]}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <div className="modal-actions">
                        <Button variant="secondary" onClick={() => setInviteOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            disabled={
                                inviteMutation.isPending ||
                                !inviteForm.email.trim() ||
                                !inviteForm.full_name.trim()
                            }
                            onClick={() => inviteMutation.mutate()}
                        >
                            {inviteMutation.isPending ? (
                                <Spinner size="sm" inline color="inherit" />
                            ) : (
                                <UserPlus size={15} />
                            )}
                            Invitar
                        </Button>
                    </div>
                </Modal>
            )}

            {linkModal && (
                <Modal title={linkModal.title} onClose={() => setLinkModal(null)}>
                    <p className="muted">
                        Enviá este enlace al usuario. Lo abre para definir su contraseña.
                    </p>
                    <div className={styles['link-box']}>
                        <code>{linkModal.link}</code>
                        <IconButton
                            variant="ghost"
                            title="Copiar enlace"
                            aria-label="Copiar enlace"
                            onClick={copyLink}
                        >
                            <Copy size={14} />
                        </IconButton>
                    </div>
                    <div className="modal-actions">
                        <Button onClick={() => setLinkModal(null)}>Listo</Button>
                    </div>
                </Modal>
            )}

            <ConfirmDialog
                open={removeTarget !== null}
                title="Eliminar acceso"
                message={removeTarget ? `¿Eliminar el acceso de ${removeTarget}?` : ''}
                confirmLabel="Eliminar"
                danger
                onConfirm={() => {
                    if (removeTarget) removeMutation.mutate(removeTarget);
                    setRemoveTarget(null);
                }}
                onCancel={() => setRemoveTarget(null)}
            />
        </>
    );
}

// ============================================================
// MLTab — integración Mercado Libre (original de ConfigPage)
// ============================================================

function MLTab() {
    const settingsQ = useQuery({ queryKey: ['ml-settings'], queryFn: fetchMlSettings });
    const [appIdDraft, setAppIdDraft] = useState('');
    const [defaultsDraft, setDefaultsDraft] = useState({
        category_id: '',
        listing_type_id: 'gold_pro',
        condition: 'used',
    });
    const [clientSecretDraft, setClientSecretDraft] = useState('');
    const [showClientSecret, setShowClientSecret] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!settingsQ.data) return;
        setAppIdDraft(settingsQ.data.app_id);
        setDefaultsDraft(settingsQ.data.defaults);
        setClientSecretDraft(settingsQ.data.client_secret ?? '');
    }, [settingsQ.data]);

    const invalidateMlSettings = () => {
        void queryClient.invalidateQueries({ queryKey: ['ml-settings'] });
        void queryClient.invalidateQueries({ queryKey: ['ml-overview'] });
    };

    const save = async () => {
        setSaving(true);
        try {
            await setMlAppId(appIdDraft.trim());
            await setMlDefaults(defaultsDraft);
            if (clientSecretDraft.trim()) {
                await upsertSiteSettingWithVersion(
                    'ml_client_secret',
                    { value: clientSecretDraft.trim() },
                    {
                        value_type: 'json',
                        is_public: false,
                        locale: 'es-AR',
                    },
                );
            }
            pushToast({ type: 'success', title: 'Configuración de ML guardada' });
            invalidateMlSettings();
        } catch {
            pushToast({ type: 'error', title: 'No se pudo guardar la configuración' });
        } finally {
            setSaving(false);
        }
    };

    const dirtyAppId = appIdDraft.trim() !== (settingsQ.data?.app_id ?? '');
    const dirtyDefaults =
        defaultsDraft.category_id !== settingsQ.data?.defaults.category_id ||
        defaultsDraft.listing_type_id !== settingsQ.data?.defaults.listing_type_id ||
        defaultsDraft.condition !== settingsQ.data?.defaults.condition;
    const dirtyClientSecret = clientSecretDraft.trim() !== (settingsQ.data?.client_secret ?? '');

    return (
        <section className="card">
            <div className="site-section-head">
                <div>
                    <h3>Integración Mercado Libre</h3>
                    <p className="muted">
                        Identificación de la app y valores por defecto para publicar. La conexión y
                        la cola se administran en la sección «Mercado Libre».
                    </p>
                </div>
                <Button
                    onClick={() => void save()}
                    disabled={saving || (!dirtyAppId && !dirtyDefaults && !dirtyClientSecret)}
                >
                    {saving ? <Spinner size="sm" inline color="inherit" /> : <Save size={15} />}
                    Guardar
                </Button>
            </div>

            <div className="form-grid">
                <label className="field">
                    <span>ID de aplicación (client_id)</span>
                    <input
                        type="text"
                        placeholder="Ej: 1234567890123456"
                        value={appIdDraft}
                        onInput={(e) => setAppIdDraft((e.currentTarget as HTMLInputElement).value)}
                    />
                </label>
                <label className="field">
                    <span>Client Secret</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                            type={showClientSecret ? 'text' : 'password'}
                            placeholder="Ingresá el client_secret"
                            value={clientSecretDraft}
                            onInput={(e) =>
                                setClientSecretDraft((e.currentTarget as HTMLInputElement).value)
                            }
                            style={{ flex: 1 }}
                        />
                        <IconButton
                            variant="ghost"
                            onClick={() => setShowClientSecret(!showClientSecret)}
                            aria-label={showClientSecret ? 'Ocultar secret' : 'Mostrar secret'}
                        >
                            {showClientSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                        </IconButton>
                    </div>
                    <p className="muted" style={{ marginTop: '4px', fontSize: '12px' }}>
                        Se guarda encriptado (AES-256-GCM). Solo visible en esta vista.
                    </p>
                </label>
                <label className="field">
                    <span>Category ID (opcional)</span>
                    <input
                        type="text"
                        placeholder="Ej: MLA1459"
                        value={defaultsDraft.category_id}
                        onInput={(e) =>
                            setDefaultsDraft((d) => ({
                                ...d,
                                category_id: (e.currentTarget as HTMLInputElement).value,
                            }))
                        }
                    />
                </label>
                <label className="field">
                    <span>Listing type</span>
                    <select
                        className="select"
                        value={defaultsDraft.listing_type_id}
                        onChange={(e) =>
                            setDefaultsDraft((d) => ({
                                ...d,
                                listing_type_id: (e.currentTarget as HTMLSelectElement).value,
                            }))
                        }
                    >
                        <option value="gold_pro">Gold Pro</option>
                        <option value="gold_special">Gold Special</option>
                        <option value="gold">Gold</option>
                        <option value="silver">Silver</option>
                        <option value="bronze">Bronze</option>
                        <option value="free">Free</option>
                    </select>
                </label>
                <label className="field">
                    <span>Condición</span>
                    <select
                        className="select"
                        value={defaultsDraft.condition}
                        onChange={(e) =>
                            setDefaultsDraft((d) => ({
                                ...d,
                                condition: (e.currentTarget as HTMLSelectElement).value,
                            }))
                        }
                    >
                        <option value="new">A estrenar / Nuevo</option>
                        <option value="used">Usado</option>
                    </select>
                </label>
            </div>
        </section>
    );
}

// ============================================================
// VersionsTab — historial de versiones de ajustes + restore + comparar
// ============================================================

function VersionsTab({ onRestored }: { onRestored: () => void }) {
    const versionsQ = useQuery<SiteSettingsVersionRow[]>({
        queryKey: ['site-settings-versions'],
        queryFn: () => fetchSiteSettingsVersions(50),
    });
    const settingsQ = useQuery<SiteSettingRow[]>({
        queryKey: ['site-settings'],
        queryFn: fetchSiteSettings,
    });
    const [restoreTarget, setRestoreTarget] = useState<SiteSettingsVersionRow | null>(null);
    const [restoring, setRestoring] = useState(false);
    const [compareTarget, setCompareTarget] = useState<SiteSettingsVersionRow | null>(null);

    const doRestore = async () => {
        if (!restoreTarget) return;
        setRestoring(true);
        try {
            await restoreSiteSettingsVersion(restoreTarget);
            await queryClient.invalidateQueries({ queryKey: ['site-settings'] });
            await queryClient.invalidateQueries({ queryKey: ['site-settings-versions'] });
            onRestored();
            pushToast({
                type: 'success',
                title: 'Versión restaurada',
                description: `${restoreTarget.changed_keys.length} ajuste${restoreTarget.changed_keys.length === 1 ? '' : 's'} restaurado${restoreTarget.changed_keys.length === 1 ? '' : 's'}`,
            });
        } catch (e) {
            pushToast({
                type: 'error',
                title: 'No se pudo restaurar',
                description: (e as Error).message,
            });
        } finally {
            setRestoring(false);
            setRestoreTarget(null);
        }
    };

    const currentByKey = new Map((settingsQ.data ?? []).map((s) => [s.key, s]));

    return (
        <section className="card">
            <div className="site-section-head">
                <div>
                    <h3>Historial de versiones</h3>
                    <p className="muted">
                        Cada guardado de ajustes crea una versión con su snapshot. Podés comparar o
                        restaurar.
                    </p>
                </div>
            </div>

            {versionsQ.isPending && <div className="placeholder-card">Cargando versiones…</div>}

            {!versionsQ.isPending && (
                <table className="table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Cambios</th>
                            <th>Autor</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(versionsQ.data ?? []).map((v) => (
                            <tr key={v.id}>
                                <td className="muted">{formatDate(v.created_at)}</td>
                                <td>
                                    <strong>{v.change_summary ?? 'Cambio de ajustes'}</strong>
                                    <br />
                                    <span className="muted">
                                        {v.changed_keys.map((k) => `«${k}»`).join(', ')}
                                    </span>
                                </td>
                                <td className="muted">
                                    {v.changed_by ? formatId(v.changed_by) : '—'}
                                </td>
                                <td>
                                    <div className="row-actions">
                                        <IconButton
                                            variant="ghost"
                                            title="Comparar con actual"
                                            aria-label="Comparar con actual"
                                            onClick={() => setCompareTarget(v)}
                                        >
                                            <Eye size={14} />
                                        </IconButton>
                                        <IconButton
                                            variant="ghost"
                                            title="Restaurar esta versión"
                                            aria-label="Restaurar esta versión"
                                            onClick={() => setRestoreTarget(v)}
                                        >
                                            <RotateCcw size={14} />
                                        </IconButton>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {compareTarget && (
                <Modal title="Comparar versión" onClose={() => setCompareTarget(null)}>
                    <p className="muted">
                        Snapshot del {formatDate(compareTarget.created_at)} vs. ajustes actuales.
                    </p>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Clave</th>
                                <th>Antes</th>
                                <th>Actual</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(compareTarget.snapshot).map(([key, entry]) => {
                                const before = JSON.stringify(entry.value, null, 1);
                                const after = JSON.stringify(
                                    currentByKey.get(key)?.value ?? null,
                                    null,
                                    1,
                                );
                                const changed = before !== after;
                                return (
                                    <tr key={key}>
                                        <td>
                                            <strong>{key}</strong>
                                            {changed && (
                                                <span className={styles['diff-badge']}>
                                                    <Check size={10} /> cambió
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <pre className={styles['diff-pre']}>{before}</pre>
                                        </td>
                                        <td>
                                            <pre className={styles['diff-pre']}>{after}</pre>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div className="modal-actions">
                        <Button onClick={() => setCompareTarget(null)}>Cerrar</Button>
                    </div>
                </Modal>
            )}

            <ConfirmDialog
                open={restoreTarget !== null}
                title="Restaurar versión"
                message={
                    restoreTarget
                        ? `¿Restaurar los ajustes del ${formatDate(restoreTarget.created_at)}? Los valores actuales se reemplazarán y se creará una versión nueva.`
                        : ''
                }
                confirmLabel="Restaurar"
                danger
                onConfirm={() => void doRestore()}
                onCancel={() => setRestoreTarget(null)}
            />
            {restoring && <div className="placeholder-card">Restaurando…</div>}
        </section>
    );
}

function formatId(id: string): string {
    return id.slice(0, 8);
}

// ============================================================
// ConfigPage — pestañas
// ============================================================

type TabId = 'users' | 'ml' | 'site' | 'i18n' | 'versions';

const TABS: { id: TabId; label: string; icon: IconCmp }[] = [
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'ml', label: 'Mercado Libre', icon: Zap },
    { id: 'site', label: 'Sitio Web', icon: Globe },
    { id: 'i18n', label: 'Idiomas', icon: Languages },
    { id: 'versions', label: 'Versiones', icon: History },
];

function I18nTab({ onSaved }: { onSaved: () => void }) {
    const [locale, setLocale] = useState('en-US');
    const [copying, setCopying] = useState(false);
    const contentQ = useQuery<SiteContentRow[]>({
        queryKey: ['site-content'],
        queryFn: fetchSiteContent,
    });

    const copyFromEs = async () => {
        setCopying(true);
        try {
            const rows = contentQ.data ?? [];
            const esRows = rows.filter((r) => r.locale === 'es-AR');
            const locKeys = new Set(
                rows.filter((r) => r.locale === locale).map((r) => `${r.section}|${r.key}`),
            );
            let created = 0;
            for (const r of esRows) {
                const k = `${r.section}|${r.key}`;
                if (locKeys.has(k)) continue;
                await upsertSiteContent({
                    section: r.section,
                    key: r.key,
                    locale,
                    value: r.value,
                    is_active: r.is_active,
                });
                created += 1;
            }
            await queryClient.invalidateQueries({ queryKey: ['site-content'] });
            onSaved();
            pushToast({
                type: 'success',
                title: created > 0 ? 'Contenido copiado' : 'Sin novedades',
                description:
                    created > 0
                        ? `${created} campo${created === 1 ? '' : 's'} copiado${created === 1 ? '' : 's'} desde es-AR`
                        : 'El idioma ya tiene todo el contenido de es-AR.',
            });
        } catch (e) {
            pushToast({
                type: 'error',
                title: 'No se pudo copiar el contenido',
                description: (e as Error).message,
            });
        } finally {
            setCopying(false);
        }
    };

    return (
        <div className={styles['tab-stack']}>
            <section className="card">
                <div className="site-section-head">
                    <div>
                        <h3>Traducciones de la landing</h3>
                        <p className="muted">
                            Editá el contenido por idioma. Las claves sin traducción muestran el
                            contenido de es-AR como fallback.
                        </p>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={() => void copyFromEs()}
                        disabled={copying}
                    >
                        {copying ? <Spinner size="sm" inline color="inherit" /> : <RefreshCw size={15} />}
                        Copiar desde es-AR
                    </Button>
                </div>
                <div className="form-grid">
                    <label className="field">
                        <span>Idioma</span>
                        <select
                            className="select"
                            value={locale}
                            onChange={(e) =>
                                setLocale((e.currentTarget as HTMLSelectElement).value)
                            }
                        >
                            {LOCALES.filter((l) => l.code !== 'es-AR').map((l) => (
                                <option key={l.code} value={l.code}>
                                    {l.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </section>
            <ContentEditor key={locale} locale={locale} onSaved={onSaved} />
        </div>
    );
}

function SiteTab({ onSaved }: { onSaved: () => void }) {
    return (
        <div className={styles['tab-stack']}>
            <SettingsEditor onSaved={onSaved} />
            <ContentEditor locale="es-AR" onSaved={onSaved} />
        </div>
    );
}

export function ConfigPage() {
    const [activeTab, setActiveTab] = useState<TabId>('users');
    const [previewKey, setPreviewKey] = useState(0);
    const [showPreview, setShowPreview] = useState(false);
    const bumpPreview = useCallback(() => setPreviewKey((k) => k + 1), []);

    useEffect(() => {
        document.title = 'Configuración · BIENENHAUS';
        return () => {
            document.title = 'BIENENHAUS — Panel de Administración';
        };
    }, []);

    return (
        <div className="page">
            <div className="page-head">
                <div>
                    <h2 className="page-title">Configuración</h2>
                    <p className="page-subtitle">
                        Usuarios del panel, integraciones y contenido de la landing.
                    </p>
                </div>
                <Button variant="secondary" onClick={() => setShowPreview(true)}>
                    <Eye size={15} /> Vista previa
                </Button>
            </div>

            <div className={styles['tabs']} role="tablist">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === t.id}
                        className={`${styles['tab']}${activeTab === t.id ? ` ${styles['tab-active']}` : ''}`}
                        onClick={() => setActiveTab(t.id)}
                    >
                        <t.icon size={15} />
                        {t.label}
                    </button>
                ))}
            </div>

            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'ml' && <MLTab />}
            {activeTab === 'site' && <SiteTab onSaved={bumpPreview} />}
            {activeTab === 'i18n' && <I18nTab onSaved={bumpPreview} />}
            {activeTab === 'versions' && <VersionsTab onRestored={bumpPreview} />}

            {showPreview && (
                <PreviewPane previewKey={previewKey} onClose={() => setShowPreview(false)} />
            )}
        </div>
    );
}
