import { useEffect, useState } from 'preact/hooks';
import { Copy, KeyRound, Loader2, Save, Trash2, UserPlus, X } from 'lucide-preact';
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

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

function Modal({
    title,
    onClose,
    children,
}: {
    title: string;
    onClose: () => void;
    children: preact.ComponentChildren;
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

export function ConfigPage() {
    const usersQ = useQuery<AdminUserRow[]>({
        queryKey: ['admin-users'],
        queryFn: fetchAdminUsers,
    });
    const settingsQ = useQuery({ queryKey: ['ml-settings'], queryFn: fetchMlSettings });

    const [myId, setMyId] = useState<string | null>(null);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [linkModal, setLinkModal] = useState<{ title: string; link: string } | null>(null);
    const [inviteForm, setInviteForm] = useState({
        email: '',
        full_name: '',
        role: 'staff' as AdminRole,
    });

    const [appIdDraft, setAppIdDraft] = useState('');
    const [defaultsDraft, setDefaultsDraft] = useState({
        category_id: '',
        listing_type_id: 'gold_pro',
        condition: 'used',
    });
    const [savingMl, setSavingMl] = useState(false);
    const [removeTarget, setRemoveTarget] = useState<string | null>(null);

    useEffect(() => {
        document.title = 'Configuración · BIENENHAUS';
        return () => {
            document.title = 'BIENENHAUS — Panel de Administración';
        };
    }, []);

    useEffect(() => {
        void fetchMyUserId()
            .then(setMyId)
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!settingsQ.data) return;
        setAppIdDraft(settingsQ.data.app_id);
        setDefaultsDraft(settingsQ.data.defaults);
    }, [settingsQ.data]);

    const invalidateUsers = () => {
        void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    };

    const myRow = (usersQ.data ?? []).find((u) => u.id === myId) ?? null;
    const isSuperAdmin = myRow?.role === 'super_admin';

    const invalidateMlSettings = () => {
        void queryClient.invalidateQueries({ queryKey: ['ml-settings'] });
        void queryClient.invalidateQueries({ queryKey: ['ml-overview'] });
    };

    const saveMlConfig = async () => {
        setSavingMl(true);
        try {
            await setMlAppId(appIdDraft.trim());
            await setMlDefaults(defaultsDraft);
            pushToast({ type: 'success', title: 'Configuración de ML guardada' });
            invalidateMlSettings();
        } catch {
            pushToast({ type: 'error', title: 'No se pudo guardar la configuración' });
        } finally {
            setSavingMl(false);
        }
    };

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

    const dirtyAppId = appIdDraft.trim() !== (settingsQ.data?.app_id ?? '');
    const dirtyDefaults =
        defaultsDraft.category_id !== settingsQ.data?.defaults.category_id ||
        defaultsDraft.listing_type_id !== settingsQ.data?.defaults.listing_type_id ||
        defaultsDraft.condition !== settingsQ.data?.defaults.condition;

    return (
        <div className="page">
            <div className="page-head">
                <div>
                    <h2 className="page-title">Configuración</h2>
                    <p className="page-subtitle">
                        Usuarios del panel y ajustes de integraciones del sistema.
                    </p>
                </div>
            </div>

            <section className="card">
                <div className="site-section-head">
                    <div>
                        <h3>Usuarios del panel</h3>
                        <p>
                            {isSuperAdmin
                                ? 'Creá accesos, cambiá roles y revocá permisos.'
                                : 'Solo los super admins pueden modificar usuarios.'}
                        </p>
                    </div>
                    {isSuperAdmin && (
                        <button className="btn btn--primary" onClick={() => setInviteOpen(true)}>
                            <UserPlus size={16} /> Invitar usuario
                        </button>
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
                                                <button
                                                    type="button"
                                                    className="icon-btn"
                                                    title="Restablecer contraseña"
                                                    onClick={() => resetMutation.mutate(u.email)}
                                                >
                                                    <KeyRound size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="icon-btn icon-btn--danger"
                                                    title="Eliminar usuario"
                                                    disabled={u.id === myId}
                                                    onClick={() => setRemoveTarget(u.email)}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            <section className="card">
                <div className="site-section-head">
                    <div>
                        <h3>Integración Mercado Libre</h3>
                        <p>
                            Identificación de la app y valores por defecto para publicar. La
                            conexión y la cola se administran en la sección «Mercado Libre».
                        </p>
                    </div>
                    <button
                        className="btn btn--primary"
                        onClick={saveMlConfig}
                        disabled={savingMl || (!dirtyAppId && !dirtyDefaults)}
                    >
                        {savingMl ? <Loader2 size={15} className="spin" /> : <Save size={15} />}
                        Guardar
                    </button>
                </div>

                <div className="form-grid">
                    <label className="field">
                        <span>ID de aplicación (client_id)</span>
                        <input
                            type="text"
                            placeholder="Ej: 1234567890123456"
                            value={appIdDraft}
                            onInput={(e) =>
                                setAppIdDraft((e.currentTarget as HTMLInputElement).value)
                            }
                        />
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
                        <button
                            type="button"
                            className="btn btn--secondary"
                            onClick={() => setInviteOpen(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className="btn btn--primary"
                            disabled={
                                inviteMutation.isPending ||
                                !inviteForm.email.trim() ||
                                !inviteForm.full_name.trim()
                            }
                            onClick={() => inviteMutation.mutate()}
                        >
                            {inviteMutation.isPending ? (
                                <Loader2 size={15} className="spin" />
                            ) : (
                                <UserPlus size={15} />
                            )}
                            Invitar
                        </button>
                    </div>
                </Modal>
            )}

            {linkModal && (
                <Modal title={linkModal.title} onClose={() => setLinkModal(null)}>
                    <p className="muted">
                        Enviá este enlace al usuario. Lo abre para definir su contraseña.
                    </p>
                    <div className="link-box">
                        <code>{linkModal.link}</code>
                        <button
                            type="button"
                            className="icon-btn"
                            title="Copiar enlace"
                            onClick={copyLink}
                        >
                            <Copy size={14} />
                        </button>
                    </div>
                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn btn--primary"
                            onClick={() => setLinkModal(null)}
                        >
                            Listo
                        </button>
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
        </div>
    );
}
