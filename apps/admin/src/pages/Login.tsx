import { useState } from 'preact/hooks';
import { useLocation } from 'wouter-preact';
import { supabase } from '../lib/supabase';
import { authSession } from '../store/app';

export function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError('Credenciales incorrectas. Verificá email y contraseña.');
        return;
      }
      // Debug: log that sign in was successful
      console.log('Login successful, navigating to /admin');
      window.location.href = '/admin';
    } catch {
      setError('Error inesperado al iniciar sesión.');
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

        <h1>Iniciar sesión</h1>
        <p className="login-hint">
          {authSession.value
            ? 'Ya tenés una sesión activa.'
            : 'Ingresá con tu usuario del panel.'}
        </p>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            placeholder="admin@bienenhaus.com"
            required
            onInput={(e) => setEmail((e.currentTarget as HTMLInputElement).value)}
          />
        </label>

        <label className="field">
          <span>Contraseña</span>
          <input
            type="password"
            value={password}
            placeholder="••••••••"
            required
            onInput={(e) => setPassword((e.currentTarget as HTMLInputElement).value)}
          />
        </label>

        {error && <p className="login-error">{error}</p>}

        <button className="btn btn--primary btn--block" type="submit" disabled={loading}>
          {loading ? 'Ingresando…' : 'Entrar'}
        </button>

        <p className="login-legal">
          Primer acceso: usá las credenciales del seed. El sistema te pedirá cambiar la
          contraseña.
        </p>
      </form>
    </div>
  );
}
