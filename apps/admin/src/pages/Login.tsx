import { useState, useEffect } from 'preact/hooks';
import { useLocation } from 'wouter-preact';
import { supabase } from '../lib/supabase';
import { authSession, authMustChangePassword } from '../store/app';

const RATE_LIMIT_KEY = 'bh_login_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function getAttempts(): { count: number; lastAttempt: number } {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { count: 0, lastAttempt: 0 };
}

function saveAttempts(count: number) {
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ count, lastAttempt: Date.now() }));
}

function clearAttempts() {
  localStorage.removeItem(RATE_LIMIT_KEY);
}

function isLocked(): boolean {
  const { count, lastAttempt } = getAttempts();
  if (count < MAX_ATTEMPTS) return false;
  return Date.now() - lastAttempt < LOCKOUT_MS;
}

function getLockoutRemainingMs(): number {
  const { lastAttempt } = getAttempts();
  return Math.max(0, LOCKOUT_MS - (Date.now() - lastAttempt));
}

function formatLockoutTime(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
}

export function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockout, setLockout] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  useEffect(() => {
    if (authSession.value) {
      setLocation('/', { replace: true });
    }
  }, [authSession.value]);

  // Check lockout on mount
  useEffect(() => {
    if (isLocked()) {
      setLockout(true);
      const remaining = getLockoutRemainingMs();
      setLockoutRemaining(remaining);
      const interval = setInterval(() => {
        const rem = getLockoutRemainingMs();
        setLockoutRemaining(rem);
        if (rem <= 0) {
          setLockout(false);
          clearInterval(interval);
        }
      }, 10000);
      return () => clearInterval(interval);
    }
  }, []);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    if (isLocked()) {
      const remaining = getLockoutRemainingMs();
      setError(`Demasiados intentos. Probá de nuevo en ${formatLockoutTime(remaining)}.`);
      setLockout(true);
      setLockoutRemaining(remaining);
      return;
    }

    setError('');
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        const { count } = getAttempts();
        const newCount = count + 1;
        saveAttempts(newCount);
        
        if (newCount >= MAX_ATTEMPTS) {
          setLockout(true);
          setLockoutRemaining(LOCKOUT_MS);
          setError(`Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.`);
        } else {
          const remaining = MAX_ATTEMPTS - newCount;
          setError(`Credenciales incorrectas. Te quedan ${remaining} intento${remaining > 1 ? 's' : ''}.`);
        }
        return;
      }
      
      // Success - clear attempts
      clearAttempts();
      if (authMustChangePassword.value) {
        window.location.href = import.meta.env.BASE_URL + '#/cambiar-contrasena';
      } else {
        window.location.href = import.meta.env.BASE_URL + '#/';
      }
    } catch {
      setError('Error inesperado al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  // Countdown for lockout display
  useEffect(() => {
    if (!lockout) return;
    const interval = setInterval(() => {
      const rem = getLockoutRemainingMs();
      setLockoutRemaining(rem);
      if (rem <= 0) {
        setLockout(false);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockout]);

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

        {lockout && (
          <p className="login-lockout">
            Cuenta bloqueada. Probá de nuevo en <strong id="lockout-timer">{formatLockoutTime(lockoutRemaining)}</strong>.
          </p>
        )}

        <button className="btn btn--primary btn--block" type="submit" disabled={loading || lockout}>
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
