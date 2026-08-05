import { useState, useEffect } from 'preact/hooks';
import { useLocation } from 'wouter-preact';
import { supabase } from '../lib/supabase';
import { authSession, authMustChangePassword } from '../store/app';

export function ChangePassword() {
  const [, setLocation] = useLocation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authMustChangePassword.value) {
      setLocation('/', { replace: true });
    }
  }, [authMustChangePassword.value]);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('La nueva contraseña debe ser diferente a la actual.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Update the admin_users table to clear the flag
      const userEmail = authSession.value?.user?.email;
      if (userEmail) {
        const { error: updateFlagError } = await supabase
          .from('admin_users')
          .update({ must_change_password: false })
          .eq('email', userEmail);
        
        if (updateFlagError) {
          console.error('Error updating must_change_password flag:', updateFlagError);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = import.meta.env.BASE_URL + '#/';
      }, 1500);
    } catch {
      setError('Error inesperado al cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <span className="sidebar-logo" aria-hidden="true">
            B
          </span>
          <div>
            <strong>BIENENHAUS</strong>
            <span>Panel de Administración</span>
          </div>
        </div>

        <h1>Cambiar contraseña</h1>
        <p className="login-hint">
          Tu primera contraseña debe ser cambiada antes de continuar.
        </p>

        <label className="field">
          <span>Contraseña actual</span>
          <input
            type="password"
            value={currentPassword}
            placeholder="••••••••"
            required
            onInput={(e) => setCurrentPassword((e.currentTarget as HTMLInputElement).value)}
            disabled={loading}
          />
        </label>

        <label className="field">
          <span>Nueva contraseña</span>
          <input
            type="password"
            value={newPassword}
            placeholder="••••••••"
            required
            minLength={8}
            onInput={(e) => setNewPassword((e.currentTarget as HTMLInputElement).value)}
            disabled={loading}
          />
        </label>

        <label className="field">
          <span>Confirmar nueva contraseña</span>
          <input
            type="password"
            value={confirmPassword}
            placeholder="••••••••"
            required
            onInput={(e) => setConfirmPassword((e.currentTarget as HTMLInputElement).value)}
            disabled={loading}
          />
        </label>

        {error && <p className="login-error">{error}</p>}

        {success && <p className="login-success">Contraseña actualizada correctamente. Redirigiendo…</p>}

        <button className="btn btn--primary btn--block" type="submit" disabled={loading}>
          {loading ? 'Actualizando…' : 'Cambiar contraseña'}
        </button>
      </form>
    </div>
  );
}