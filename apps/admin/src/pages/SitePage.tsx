import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  CONTENT_KEY_LABELS,
  IMAGE_SETTINGS,
  SECTION_KEYS,
  SECTION_LABELS,
  contentFieldsFor,
  deleteSiteImage,
  fetchSiteContent,
  fetchSiteSettings,
  genericFields,
  isListField,
  listMetaFor,
  settingFieldsFor,
  updateSiteSetting,
  uploadSiteImage,
  upsertSiteContent,
  type ContentSection,
  type FieldMeta,
  type ListMeta,
  type SiteContentRow,
  type SiteSettingRow,
} from '../lib/site';
import { queryClient } from '../lib/query/client';
import { useQuery } from '../lib/query/hooks';
import { pushToast } from '../store/app';

interface DraftEntry {
  id: string | null;
  value: Record<string, unknown>;
  isActive: boolean;
}

type DraftKey = string;

function fieldInputValue(value: unknown): string {
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value;
  return '';
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldMeta;
  value: unknown;
  onChange: (v: string) => void;
}) {
  const raw = fieldInputValue(value);
  if (field.type === 'textarea') {
    return (
      <label className="field field--textarea">
        <span className="field__label">{field.label}</span>
        <textarea
          rows={3}
          value={raw}
          onInput={(e) => onChange((e.currentTarget as HTMLTextAreaElement).value)}
          className="field__input field__input--textarea"
        />
      </label>
    );
  }
  if (field.type === 'boolean') {
    const checked = raw === 'true';
    return (
      <label className="field field--boolean">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.currentTarget.checked ? 'true' : 'false')}
          className="field__input field__input--checkbox"
        />
        <span className="field__label">{field.label}</span>
      </label>
    );
  }
  return (
    <label className="field">
      <span className="field__label">{field.label}</span>
      <input
        type={field.type === 'number' ? 'number' : 'text'}
        value={raw}
        onInput={(e) => onChange((e.currentTarget as HTMLInputElement).value)}
        className="field__input"
      />
    </label>
  );
}

function ActiveToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="switch">
      <input
        type="checkbox"
        className="switch__input"
        checked={checked}
        onChange={(e) => onChange((e.currentTarget as HTMLInputElement).checked)}
      />
      <span className="switch__slider"></span>
    </label>
  );
}

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
    <div className="site-image-field">
      {url ? (
        <div className="site-image-preview">
          <img src={url} alt="Vista previa" />
          <button
            type="button"
            className="btn btn--danger btn--sm"
            onClick={() => {
              onChange('');
              void deleteSiteImage(url);
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg> Quitar
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg> {uploading ? 'Subiendo…' : 'Subir imagen'}
        </button>
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

  const updateItem = (i: number, key: string, v: string) => {
    const next = [...list];
    const current = next[i] ?? {};
    next[i] = { ...current, [key]: v };
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
    <div className="site-list">
      {list.length === 0 && <p className="site-list-empty">No hay items todavía.</p>}
      {list.map((item, i) => (
        <div className="site-list-item" key={i}>
          <div className="site-list-item-head">
            <span>
              {meta.itemLabel} {i + 1}
            </span>
            <div className="site-list-item-actions">
              <button type="button" className="icon-btn" title="Subir" onClick={() => moveItem(i, -1)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6" /></svg>
              </button>
              <button type="button" className="icon-btn" title="Bajar" onClick={() => moveItem(i, 1)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              <button
                type="button"
                className="icon-btn icon-btn--danger"
                title="Eliminar"
                onClick={() => removeItem(i)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
          <div className="form-grid">
            {meta.fields.map((f) => (
              <FieldInput
                key={f.key}
                field={f}
                value={item[f.key]}
                onChange={(v) => updateItem(i, f.key, v)}
              />
            ))}
          </div>
        </div>
      ))}
      <button type="button" className="btn btn--secondary btn--sm" onClick={() => onChange([...list, {}])}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
        Agregar {meta.itemLabel.toLowerCase()}
      </button>
    </div>
  );
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
  onFieldChange: (key: string, v: string) => void;
  onToggleActive: (v: boolean) => void;
}) {
  return (
    <div className={`site-row${isActive ? '' : ' is-inactive'}`}>
      <div className="site-row-head">
        <h4>{heading}</h4>
        <div className="site-row-active">
          <ActiveToggle checked={isActive} onChange={onToggleActive} />
          <span>{isActive ? 'Activado' : 'Desactivado'}</span>
        </div>
      </div>
      <div className="form-grid">
        {fields.map((f) => (
          <FieldInput key={f.key} field={f} value={value[f.key]} onChange={(v) => onFieldChange(f.key, v)} />
        ))}
      </div>
    </div>
  );
}

export function SitePage() {
  const locale = 'es';
  const contentQ = useQuery<SiteContentRow[]>({ queryKey: ['site-content'], queryFn: fetchSiteContent });
  const settingsQ = useQuery<SiteSettingRow[]>({ queryKey: ['site-settings'], queryFn: fetchSiteSettings });

  const [drafts, setDrafts] = useState<Record<DraftKey, DraftEntry>>({});
  const [baseline, setBaseline] = useState<Record<DraftKey, DraftEntry>>({});
  const [savingGroup, setSavingGroup] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    document.title = 'Sitio Web · BIENENHAUS';
    return () => {
      document.title = 'BIENENHAUS — Panel de Administración';
    };
  }, []);

  useEffect(() => {
    if (!contentQ.data) return;
    const normalizeValue = (v: Record<string, unknown>) =>
      Array.isArray(v) ? { items: v } : { ...v };
    const base: Record<DraftKey, DraftEntry> = {};
    for (const r of contentQ.data) {
      base[`${r.locale}|${r.section}|${r.key}`] = {
        id: r.id,
        value: normalizeValue(r.value),
        isActive: r.is_active,
      };
    }
    setBaseline(base);
    setDrafts((prev) => {
      const next: Record<DraftKey, DraftEntry> = {};
      for (const [k, entry] of Object.entries(base)) {
        next[k] = prev[k] ?? { ...entry };
      }
      return next;
    });
  }, [contentQ.data]);

  const isEntryDirty = (dk: DraftKey, entry: DraftEntry): boolean => {
    const b = baseline[dk];
    if (!b) return true;
    return JSON.stringify(entry.value) !== JSON.stringify(b.value) || entry.isActive !== b.isActive;
  };

  const setEntry = (dk: DraftKey, patch: Partial<DraftEntry>) => {
    setDrafts((d) => ({ ...d, [dk]: { ...(d[dk] ?? { id: null, value: {}, isActive: true }), ...patch } }));
  };

  const setField = (dk: DraftKey) => (key: string, v: string) => {
    setDrafts((d) => {
      const current = d[dk] ?? { id: null, value: {}, isActive: true };
      const value = { ...current.value };
      value[key] = typeof current.value[key] === 'number' ? Number(v) : v;
      return { ...d, [dk]: { ...current, value } };
    });
  };

  const saveSection = async (section: ContentSection) => {
    setSavingGroup(`c-${section}`);
    try {
      const dirty: { dk: DraftKey; entry: DraftEntry }[] = [];
      for (const [dk, entry] of Object.entries(drafts)) {
        if (!dk.includes(`|${section}|`)) continue;
        if (isEntryDirty(dk, entry)) dirty.push({ dk, entry });
      }
      for (const { dk, entry } of dirty) {
        const [loc, sec, key] = dk.split('|');
        await upsertSiteContent({
          id: entry.id,
          section: sec as ContentSection,
          key,
          locale: loc,
          value: entry.value,
          is_active: entry.isActive,
        });
      }
      await queryClient.invalidateQueries({ queryKey: ['site-content'] });
      pushToast({
        type: 'success',
        title: dirty.length > 0 ? 'Sección guardada' : 'Sin cambios pendientes',
        description: dirty.length > 0 ? `${SECTION_LABELS[section]} (${dirty.length} campo${dirty.length === 1 ? '' : 's'})` : undefined,
      });
    } catch {
      pushToast({ type: 'error', title: 'No se pudo guardar la sección' });
    } finally {
      setSavingGroup(null);
    }
  };

  const settingsDirty = useMemo(() => {
    return (settingsQ.data ?? []).filter((s) => {
      const entry = drafts[`s:${s.id}`] ?? { id: s.id, value: s.value, isActive: true };
      return JSON.stringify(entry.value) !== JSON.stringify(s.value);
    });
  }, [drafts, settingsQ.data]);

  const settingsMap = useMemo(() => new Map((settingsQ.data ?? []).map(s => [s.key, s])), [settingsQ.data]);

  const saveSettings = async () => {
    setSavingGroup('settings');
    try {
      for (const s of settingsDirty) {
        const entry = drafts[`s:${s.id}`];
        if (entry) await updateSiteSetting(s.id, entry.value);
      }
      await queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      pushToast({
        type: 'success',
        title: settingsDirty.length > 0 ? 'Ajustes guardados' : 'Sin cambios pendientes',
      });
    } catch {
      pushToast({ type: 'error', title: 'No se pudieron guardar los ajustes' });
    } finally {
      setSavingGroup(null);
    }
  };

  const setSettingField = (id: string) => (key: string, v: string) => {
    setDrafts((d) => {
      const current = d[`s:${id}`] ?? { id, value: { value: '' }, isActive: true };
      const value = { ...current.value, [key]: v };
      return { ...d, [`s:${id}`]: { ...current, value } };
    });
  };

  const buildPreviewPayload = () => {
    const content: Record<string, Record<string, Record<string, unknown>>> = {};
    for (const [dk, entry] of Object.entries(drafts)) {
      if (!dk.includes('|')) continue;
      const [loc, section, key] = dk.split('|');
      if (!entry.isActive) continue;
      if (loc !== locale && loc !== 'es') continue;
      const target = (content[section] ??= {});
      const existing = target[key];
      if (loc === locale || !existing) target[key] = entry.value;
    }
    const settings: Record<string, Record<string, unknown>> = {};
    for (const s of settingsQ.data ?? []) {
      const entry = drafts[`s:${s.id}`] ?? { value: s.value };
      settings[s.key] = entry.value;
    }
    return { locale, content, settings };
  };

  const sendPreview = () => {
    const iframe = previewRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage({ type: 'bh-site-preview', payload: buildPreviewPayload() }, '*');
  };

  useEffect(() => {
    if (!showPreview) return;
    const t = setTimeout(sendPreview, 150);
    return () => clearTimeout(t);
  }, [showPreview]);

  useEffect(() => {
    const iframe = previewRef.current;
    if (!iframe || !showPreview) return;
    const onLoad = () => setTimeout(sendPreview, 100);
    iframe.addEventListener('load', onLoad);
    return () => iframe.removeEventListener('load', onLoad);
  }, [showPreview]);

  const sectionDirtyCount = (section: ContentSection) => {
    let count = 0;
    for (const [dk, entry] of Object.entries(drafts)) {
      if (!dk.includes(`|${section}|`)) continue;
      if (isEntryDirty(dk, entry)) count += 1;
    }
    return count;
  };

  const renderSectionContent = (section: ContentSection) => {
    const rows = SECTION_KEYS[section] ?? [];
    const dirtyCount = sectionDirtyCount(section);
    return (
      <section key={section} className="card site-section">
        <div className="site-section-head">
          <div>
            <h3>{SECTION_LABELS[section]}</h3>
            <p>
              {dirtyCount > 0
                ? `${dirtyCount} campo${dirtyCount === 1 ? '' : 's'} sin guardar`
                : 'Sin cambios pendientes'}
            </p>
          </div>
          <button
            className="btn btn--primary"
            onClick={() => saveSection(section)}
            disabled={savingGroup !== null || dirtyCount === 0}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/></svg>
            {savingGroup === `c-${section}` ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
        <div className="site-section-body">
          {rows.map((key) => {
            const dk = `${locale}|${section}|${key}`;
            const entry = drafts[dk] ?? { id: null, value: {}, isActive: true };
            const heading = CONTENT_KEY_LABELS[key] ?? key;
            if (isListField(section, key)) {
              const meta = listMetaFor(section, key)!;
              return (
                <div className={`site-row${entry.isActive ? '' : ' is-inactive'}`} key={key}>
                  <div className="site-row-head">
                    <h4>{heading}</h4>
                    <div className="site-row-active">
                      <ActiveToggle
                        checked={entry.isActive}
                        onChange={(v) => setEntry(dk, { isActive: v })}
                      />
                      <span>{entry.isActive ? 'Activado' : 'Desactivado'}</span>
                    </div>
                  </div>
                  <ListEditor
                    meta={meta}
                    items={entry.value.items ?? entry.value}
                    onChange={(items) => {
                      setEntry(dk, { value: { ...entry.value, items } });
                    }}
                  />
                </div>
              );
            }
            const fields = contentFieldsFor(section, key) ?? genericFields(entry.value);
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
  };

  const SETTINGS_GROUPS = [
    {
      id: 'hero-video',
      label: '🎬 Hero Video',
      icon: '🎬',
      description: 'Configuración del video principal del Hero (sección principal de la landing)',
      keys: ['hero_video_url', 'hero_video_title', 'hero_video_autoplay', 'hero_video_muted', 'hero_video_poster'],
    },
    {
      id: 'hero-images',
      label: 'Imágenes del Hero',
      icon: '🖼️',
      description: 'Imagen de fondo y poster del video del Hero',
      keys: ['hero_background', 'hero_video_poster'],
    },
    {
      id: 'contact',
      label: 'Datos de Contacto',
      icon: '📞',
      description: 'Información de contacto visible en la landing',
      keys: ['contact_whatsapp', 'contact_whatsapp_alt', 'contact_email', 'contact_phone', 'contact_address', 'contact_hours'],
    },
    {
      id: 'social',
      label: 'Redes Sociales',
      icon: '🌐',
      description: 'Links a redes sociales (Instagram, Facebook, YouTube, TikTok, LinkedIn, WhatsApp)',
      keys: ['social'],
    },
    {
      id: 'company',
      label: 'Empresa',
      icon: '🏢',
      description: 'Datos legales y nombre de la empresa',
      keys: ['site_name', 'cri', 'contact_address'],
    },
    {
      id: 'stats',
      label: 'Estadísticas del Hero',
      icon: '📊',
      description: 'Números que se muestran en la barra de estadísticas del Hero',
      keys: ['stats'],
    },
    {
      id: 'features',
      label: 'Funcionalidades',
      icon: '⚙️',
      description: 'Activar/desactivar funcionalidades avanzadas',
      keys: ['ml_enabled', 'contact_whatsapp_alt', 'hero_video_autoplay', 'hero_video_muted'],
    },
  ] as const;

  const renderSettingsContent = () => {
    const dirtyCount = settingsDirty.length;

    return (
      <section className="card site-section settings-section">
        <div className="site-section-head">
          <div>
            <h3>⚙️ Configuración del Sitio</h3>
            <p>
              {dirtyCount > 0
                ? `${dirtyCount} campo${dirtyCount === 1 ? '' : 's'} sin guardar`
                : 'Sin cambios pendientes'}
            </p>
          </div>
          <button
            className="btn btn--primary"
            onClick={saveSettings}
            disabled={savingGroup !== null || dirtyCount === 0}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/></svg>
            {savingGroup === 'settings' ? 'Guardando…' : 'Guardar todos los ajustes'}
          </button>
        </div>
        <div className="site-section-body settings-body">
          {SETTINGS_GROUPS.map((group) => {
            const groupKeys = group.keys.filter(k => settingsMap.has(k));
            if (groupKeys.length === 0) return null;

            const groupDirtyCount = groupKeys.filter(k => settingsDirty.some(s => s.key === k)).length;

            return (
              <details key={group.id} className="settings-group" open>
                <summary className="settings-group-header">
                  <div className="settings-group-title">
                    <span className="settings-group-icon" aria-hidden="true">{group.icon}</span>
                    <div>
                      <h4>{group.label}</h4>
                      <p className="settings-group-desc">{group.description}</p>
                    </div>
                  </div>
                  {groupDirtyCount > 0 && (
                    <span className="settings-group-badge">{groupDirtyCount} pendiente{groupDirtyCount > 1 ? 's' : ''}</span>
                  )}
                </summary>
                <div className="settings-group-body">
                  {groupKeys.map((key) => {
                    const s = settingsMap.get(key);
                    if (!s) return null;
                    const entry = drafts[`s:${s.id}`] ?? { id: s.id, value: s.value, isActive: true };
                    const fields = settingFieldsFor(s.key) ?? genericFields(s.value);
                    const isImage = s.key in IMAGE_SETTINGS;

                    return (
                      <div key={s.id} className="site-row">
                        <div className="site-row-label">
                          <h4>{s.description ?? s.key}</h4>
                        </div>
                        <div className="site-row-field">
                          {isImage ? (
                            <ImageInput value={entry.value.value} onChange={(url) => setSettingField(s.id)('value', url)} />
                          ) : (
                            <div className="form-grid">
                              {fields.map((f) => (
                                <FieldInput
                                  key={f.key}
                                  field={f}
                                  value={entry.value[f.key]}
                                  onChange={(v) => setSettingField(s.id)(f.key, v)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>
      </section>
    );
  };

  // ===== RETURN JSX =====
  return (
    <div className="site-page">
      <div className="page-head">
        <div>
          <h2 className="page-title">Sitio Web</h2>
          <p className="page-subtitle">Gestioná el contenido y la configuración de la landing.</p>
        </div>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => setShowPreview(true)}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg> Vista previa
        </button>
      </div>

      {(Object.keys(SECTION_KEYS) as ContentSection[]).map((section) => renderSectionContent(section))}
      {renderSettingsContent()}

      {showPreview && (
        <div className="modal-backdrop" onClick={() => setShowPreview(false)}>
          <div className="modal-card modal--large" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Vista previa</h3>
              <button className="icon-btn" onClick={() => setShowPreview(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              <iframe
                ref={previewRef}
                src="/"
                title="Vista previa"
                style={{ width: '100%', height: '600px', border: 'none' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}