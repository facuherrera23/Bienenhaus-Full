import { useEffect, useState } from 'preact/hooks';
import { useLocation } from 'wouter-preact';
import { AlertTriangle } from 'lucide-preact';
import { supabase } from '../lib/supabase';
import { authMustChangePassword, authSession } from '../store/app';

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

function formatCountdown(ms: number): string {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
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
                    setError(
                        `Credenciales incorrectas. Te quedan ${remaining} intento${remaining > 1 ? 's' : ''}.`,
                    );
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
                    <div className="login-lockout" role="alert" aria-live="assertive">
                        <span className="login-lockout__icon" aria-hidden="true">
                            <AlertTriangle size={18} strokeWidth={2.25} />
                        </span>
                        <div className="login-lockout__body">
                            <strong className="login-lockout__title">Cuenta bloqueada</strong>
                            <span className="login-lockout__text">
                                Probá de nuevo en{' '}
                                <span
                                    className="login-lockout__timer"
                                    aria-label={`Tiempo restante: ${formatCountdown(lockoutRemaining)}`}
                                >
                                    {formatCountdown(lockoutRemaining)}
                                </span>
                            </span>
                        </div>
                    </div>
                )}

                <button
                    className="btn btn--primary btn--block"
                    type="submit"
                    disabled={loading || lockout}
                >
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
