import { useEffect, useState } from 'preact/hooks';
import { Loader2, Plus, Trash2, Unlock } from 'lucide-preact';
import {
  fetchAdminUsers,
  inviteAdminUser,
  removeAdminUser,
  resetAdminUserPassword,
  toggleAdminUserActive,
  type AdminUserRow,
  type AdminRole,
  ROLE_LABEL,
  updateAdminUserRole,
} from '../lib/adminUsers';
import { queryClient } from '../lib/query/client';
import { useMutation, useQuery } from '../lib/query/hooks';
import { pushToast } from '../store/app';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

export function AdminUsersPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', full_name: '', role: 'staff' as AdminRole });

  const { data, isPending, isError } = useQuery<AdminUserRow[]>({
    queryKey: ['admin-users'],
    queryFn: fetchAdminUsers,
  });

  useEffect(() => {
    document.title = 'Usuarios Admin · BIENENHAUS';
    return () => {
      document.title = 'BIENENHAUS — Panel de Administración';
    };
  }, []);

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  const inviteMutation = useMutation({
    mutationFn: () => inviteAdminUser({ email: inviteForm.email, full_name: inviteForm.full_name, role: inviteForm.role }),
    onSuccess: () => {
      pushToast({
        type: 'success',
        title: 'Invitación enviada',
        description: `${inviteForm.full_name} (${inviteForm.email}) — Rol: ${ROLE_LABEL[inviteForm.role]}`,
      });
      setInviteOpen(false);
      setInviteForm({ email: '', full_name: '', role: 'staff' });
      invalidateAll();
    },
    onError: (err) => {
      pushToast({ type: 'error', title: 'No se pudo invitar', description: (err as Error).message });
    },
  });

  const handleInviteSubmit = (e: Event) => {
    e.preventDefault();
    if (!inviteForm.email.trim() || !inviteForm.full_name.trim()) return;
    inviteMutation.mutate();
  };

  const handleToggleActive = async (user: AdminUserRow) => {
    try {
      await toggleAdminUserActive(user.id, !user.is_active);
      pushToast({
        type: 'success',
        title: user.is_active ? 'Usuario desactivado' : 'Usuario activado',
        description: user.email,
      });
      invalidateAll();
    } catch {
      pushToast({ type: 'error', title: 'No se pudo actualizar el usuario' });
    }
  };

  const handleRoleChange = async (user: AdminUserRow, newRole: AdminRole) => {
    try {
      await updateAdminUserRole(user.id, newRole);
      pushToast({
        type: 'success',
        title: 'Rol actualizado',
        description: `${user.email} → ${ROLE_LABEL[newRole]}`,
      });
      invalidateAll();
    } catch {
      pushToast({ type: 'error', title: 'No se pudo actualizar el rol' });
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      const res = await resetAdminUserPassword(email);
      if (res.link) {
        await navigator.clipboard.writeText(res.link);
        pushToast({ type: 'success', title: 'Link de recuperación copiado al portapapeles' });
      } else {
        pushToast({ type: 'success', title: 'Link de recuperación generado' });
      }
    } catch {
      pushToast({ type: 'error', title: 'No se pudo generar el link' });
    }
  };

  const handleRemove = async (email: string) => {
    if (!window.confirm(`¿Eliminar usuario ${email}? Esta acción no se puede deshacer.`)) return;
    try {
      await removeAdminUser(email);
      pushToast({ type: 'success', title: 'Usuario eliminado', description: email });
      invalidateAll();
    } catch {
      pushToast({ type: 'error', title: 'No se pudo eliminar el usuario' });
    }
  };

  const currentUserId = (() => {
    try {
      const session = JSON.parse(localStorage.getItem('supabase.auth.token') ?? '{}');
      return session.user?.id;
    } catch {
      return null;
    }
  })();

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2 className="page-title">Usuarios de Administración</h2>
          <p className="page-subtitle">
            Gestioná quién tiene acceso al panel y con qué permisos.
          </p>
        </div>
        <button className="btn btn--primary" onClick={() => setInviteOpen(true)}>
          <Plus size={16} /> Invitar usuario
        </button>
      </div>

      {isPending && <div className="card placeholder-card">Cargando usuarios…</div>}
      {isError && <div className="card placeholder-card">No se pudieron cargar los usuarios.</div>}

      {!isPending && !isError && (
        <div className="card table-card">
          <table className="table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Último acceso</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="cell-user">
                      <span className="user-avatar" aria-hidden="true">
                        {(u.full_name[0] ?? u.email[0] ?? 'U').toUpperCase()}
                      </span>
                      <div>
                        <strong>{u.full_name}</strong>
                        <span className="muted">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select
                      className="select select--sm"
                      value={u.role}
                      onChange={(e) => handleRoleChange(u, (e.currentTarget as HTMLSelectElement).value as AdminRole)}
                      disabled={u.id === currentUserId}
                    >
                      {(['super_admin', 'admin', 'staff', 'viewer'] as AdminRole[]).map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <label className="switch-row">
                      <input
                        type="checkbox"
                        className="switch"
                        checked={u.is_active}
                        onChange={() => handleToggleActive(u)}
                        disabled={u.id === currentUserId}
                      />
                      <span>{u.is_active ? 'Activo' : 'Inactivo'}</span>
                    </label>
                  </td>
                  <td className="muted">{formatDate(u.last_login_at)}</td>
                  <td className="muted">{formatDate(u.created_at)}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-btn"
                        title="Resetear contraseña"
                        onClick={() => handleResetPassword(u.email)}
                      >
                        <Unlock size={14} />
                      </button>
                      <button
                        className="icon-btn icon-btn--danger"
                        title="Eliminar usuario"
                        disabled={u.id === currentUserId}
                        onClick={() => handleRemove(u.email)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(data ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-cell">
                    No hay usuarios de administración.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {inviteOpen && (
        <div className="modal-overlay" onClick={() => setInviteOpen(false)} role="dialog" aria-modal="true" aria-labelledby="invite-title">
          <div className="modal-container modal--small" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setInviteOpen(false)} aria-label="Cerrar">
              <i className="fas fa-times" aria-hidden="true"></i>
            </button>
            <div className="modal-content">
              <h2 id="invite-title">Invitar nuevo usuario</h2>
              <p className="muted">Recibirá un email para definir su contraseña y acceder al panel.</p>
              <form onSubmit={handleInviteSubmit}>
                <div className="form-grid">
                  <label className="field field--wide">
                    <span>Email *</span>
                    <input
                      type="email"
                      value={inviteForm.email}
                      placeholder="usuario@ejemplo.com"
                      onInput={(e) => setInviteForm({ ...inviteForm, email: (e.currentTarget as HTMLInputElement).value })}
                      required
                    />
                  </label>
                  <label className="field field--wide">
                    <span>Nombre completo *</span>
                    <input
                      type="text"
                      value={inviteForm.full_name}
                      placeholder="Juan Pérez"
                      onInput={(e) => setInviteForm({ ...inviteForm, full_name: (e.currentTarget as HTMLInputElement).value })}
                      required
                    />
                  </label>
                  <label className="field field--wide">
                    <span>Rol *</span>
                    <select
                      className="select"
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({ ...inviteForm, role: (e.currentTarget as HTMLSelectElement).value as AdminRole })}
                    >
                      <option value="staff">Staff (gestión diaria)</option>
                      <option value="admin">Admin (gestión + configuración)</option>
                      <option value="viewer">Viewer (solo lectura)</option>
                    </select>
                  </label>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn--ghost" onClick={() => setInviteOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn--primary" disabled={inviteMutation.isPending}>
                    {inviteMutation.isPending ? <Loader2 size={16} className="spin" /> : 'Enviar invitación'}
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