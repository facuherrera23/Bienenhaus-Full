import { useEffect, useRef } from 'preact/hooks';

interface UseRevealOptions {
    threshold?: number;
    rootMargin?: string;
}

/**
 * Observa los elementos `selector` dentro del contenedor referenciado y les
 * agrega la clase `visible` (con el stagger definido por `data-delay`) al
 * entrar en viewport. Reproduce el comportamiento de los IntersectionObserver
 * del HTML de referencia.
 */
export function useReveal<T extends HTMLElement>(selector: string, options: UseRevealOptions = {}) {
    const ref = useRef<T>(null);
    const { threshold = 0.1, rootMargin = '0px 0px -50px 0px' } = options;

    useEffect(() => {
        const root = ref.current;
        if (!root) return;
        const els = Array.from(root.querySelectorAll<HTMLElement>(selector));
        if (els.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const el = entry.target as HTMLElement;
                        const delay = parseInt(el.dataset.delay ?? '0', 10) || 0;
                        setTimeout(() => el.classList.add('visible'), delay);
                        observer.unobserve(el);
                    }
                });
            },
            { threshold, rootMargin },
        );

        els.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [selector, threshold, rootMargin]);

    return ref;
}
