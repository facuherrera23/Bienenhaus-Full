// apps/admin/src/pages/Login.tsx
import { useEffect, useState } from 'preact/hooks';
import { useLocation } from 'wouter-preact';
import { AlertTriangle, Lock, Mail } from 'lucide-preact';
import { Button, FormField, Input, Spinner } from '@bienenhaus/ui';
import { supabase } from '../lib/supabase';
import { authMustChangePassword, authSession } from '../store/app';
import styles from '../styles/Login.module.css';

const RATE_LIMIT_KEY = 'bh_login_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function getAttempts(): { count: number; lastAttempt: number } {
    try {
        const stored = localStorage.getItem(RATE_LIMIT_KEY);
        if (stored) return JSON.parse(stored);
    } catch {
        // JSON corrupto en localStorage: se ignora y se devuelven 0 intentos
    }
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
    const [lockoutProgress, setLockoutProgress] = useState(100);

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
            setLockoutProgress((remaining / LOCKOUT_MS) * 100);

            const interval = setInterval(() => {
                const rem = getLockoutRemainingMs();
                setLockoutRemaining(rem);
                setLockoutProgress((rem / LOCKOUT_MS) * 100);
                if (rem <= 0) {
                    setLockout(false);
                    clearInterval(interval);
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, []);

    // Countdown for lockout display
    useEffect(() => {
        if (!lockout) return;
        const interval = setInterval(() => {
            const rem = getLockoutRemainingMs();
            setLockoutRemaining(rem);
            setLockoutProgress((rem / LOCKOUT_MS) * 100);
            if (rem <= 0) {
                setLockout(false);
                clearInterval(interval);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [lockout]);

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
                    setLockoutProgress(100);
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

    return (
        <div className={styles.loginPage}>
            {/* Partículas flotantes */}
            <div className={styles.particles} aria-hidden="true">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className={styles.particle} />
                ))}
            </div>

            {/* Glow de fondo */}
            <div className={styles.loginGlow} aria-hidden="true" />

            {/* Formulario */}
            <form className={styles.loginCard} onSubmit={handleSubmit}>
                {/* Brand */}
                <div className={styles.loginBrand}>
                    <span className={styles.logoIcon} aria-hidden="true">
                        B
                    </span>
                    <div>
                        <strong>BIENENHAUS</strong>
                        <span>Panel de Administración</span>
                    </div>
                </div>

                <h1>Iniciar sesión</h1>
                <p className={styles.loginHint}>
                    {authSession.value
                        ? 'Ya tenés una sesión activa.'
                        : 'Ingresá con tu usuario del panel.'}
                </p>

                {/* Email */}
                <label className={styles.field}>
                    <span>Email</span>
                    <div className={styles.inputWrapper}>
                        <FormField
                            label="Email"
                            error={error}
                        >
                            <Input
                                type="email"
                                placeholder=" "
                                value={email}
                                onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                                disabled={loading || lockout}
                            />
                            <Mail size={18} className={styles.inputIcon} />
                            <label>admin@bienenhaus.com</label>
                        </FormField>
                    </div>
                </label>

                {/* Password */}
                <label className={styles.field}>
                    <span>Contraseña</span>
                    <div className={styles.inputWrapper}>
                        <FormField
                            label="Contraseña"
                            error={error}
                        >
                            <Input
                                type="password"
                                placeholder=" "
                                value={password}
                                onInput={(e) =>
                                    setPassword((e.target as HTMLInputElement).value)
                                }
                                disabled={loading || lockout}
                            />
                            <Lock size={18} className={styles.inputIcon} />
                            <label>••••••••</label>
                        </FormField>
                    </div>
                </label>

                {error && <p className={styles.loginError}>{error}</p>}

                {lockout && (
                    <div className={styles.loginLockout} role="alert" aria-live="assertive">
                        <span className={styles.loginLockout__icon} aria-hidden="true">
                            <AlertTriangle size={18} strokeWidth={2.25} />
                        </span>
                        <div className={styles.loginLockout__body}>
                            <strong className={styles.loginLockout__title}>Cuenta bloqueada</strong>
                            <span className={styles.loginLockout__text}>
                                Probá de nuevo en{' '}
                                <span
                                    className={styles.loginLockout__timer}
                                    aria-label={`Tiempo restante: ${formatCountdown(lockoutRemaining)}`}
                                >
                                    {formatCountdown(lockoutRemaining)}
                                </span>
                            </span>
                            <div className={styles.lockoutProgress}>
                                <div
                                    className={styles.lockoutProgressBar}
                                    style={{ width: `${lockoutProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    type="submit"
                    disabled={loading || lockout}
                >
                    {loading ? (
                        <>
                            <Spinner size="sm" inline color="white" />
                            Ingresando…
                        </>
                    ) : (
                        'Entrar'
                    )}
                </Button>

                <p className={styles.loginLegal}>
                    Primer acceso: usá las credenciales del seed. El sistema te pedirá cambiar la
                    contraseña.
                </p>
            </form>
        </div>
    );
}