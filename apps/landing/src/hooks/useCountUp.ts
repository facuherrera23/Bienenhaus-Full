import { useEffect, useState } from 'preact/hooks';

/**
 * Cuenta de 0 a `target` con easing cúbico cuando `start` es true.
 * Reproduce el contador animado de las estadísticas del HTML de referencia.
 */
export function useCountUp(target: number, start: boolean, duration = 2000): string {
    const [value, setValue] = useState(0);

    useEffect(() => {
        if (!start) return;
        let raf = 0;
        const t0 = performance.now();

        const tick = (now: number) => {
            const progress = Math.min((now - t0) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * target);
            setValue(current);
            if (progress < 1) {
                raf = requestAnimationFrame(tick);
            } else {
                setValue(target);
            }
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [start, target, duration]);

    return target >= 1000 ? value.toLocaleString('es-AR') : String(value);
}
