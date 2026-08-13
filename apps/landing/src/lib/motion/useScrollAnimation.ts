// apps/landing/src/lib/motion/useScrollAnimation.ts
import { useEffect, useRef, useState } from 'preact/hooks';

export interface ScrollAnimationOptions {
    /** Umbral de entrada (0-1) */
    threshold?: number | number[];
    /** Margen del root */
    rootMargin?: string;
    /** Si solo debe activarse una vez */
    once?: boolean;
    /** Nombre de la animación CSS (para añadir clase) */
    animation?: 'fadeUp' | 'fadeIn' | 'scaleIn' | 'slideInLeft' | 'slideInRight' | 'none';
    /** Retraso en milisegundos antes de añadir la clase */
    delay?: number;
    /** Elemento root para el observer (por defecto viewport) */
    root?: Element | null;
}

export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>({
    threshold = 0.15,
    rootMargin = '0px 0px -50px 0px',
    once = true,
    delay = 0,
    root = null,
}: ScrollAnimationOptions = {}) {
    const ref = useRef<T>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    // Aplicamos retraso si está configurado
                    if (delay > 0) {
                        timeoutRef.current = window.setTimeout(() => {
                            setIsVisible(true);
                            setHasAnimated(true);
                        }, delay);
                    } else {
                        setIsVisible(true);
                        setHasAnimated(true);
                    }

                    if (once) {
                        observer.disconnect();
                    }
                } else if (!once) {
                    setIsVisible(false);
                    setHasAnimated(false);
                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                        timeoutRef.current = null;
                    }
                }
            },
            { threshold, rootMargin, root },
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [threshold, rootMargin, once, delay, root]);

    return { ref, isVisible, hasAnimated };
}

// Genera clases CSS para diferentes animaciones
export function getAnimationClass(animation: string): string {
    const map: Record<string, string> = {
        fadeUp: 'animate-fade-up',
        fadeIn: 'animate-fade-in',
        scaleIn: 'animate-scale-in',
        slideInLeft: 'animate-slide-left',
        slideInRight: 'animate-slide-right',
        none: '',
    };
    return map[animation] || 'animate-fade-up';
}
