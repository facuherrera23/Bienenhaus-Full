// apps/landing/src/lib/motion/useParallax.ts
import { useEffect, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';

export interface ParallaxOptions {
  /** Velocidad del parallax (0-1) */
  speed?: number;
  /** Dirección: 'vertical' | 'horizontal' */
  direction?: 'vertical' | 'horizontal';
  /** Offset inicial */
  initialOffset?: number;
  /** Si debe ser relativo al viewport */
  relativeToViewport?: boolean;
}

export function useParallax<T extends HTMLElement = HTMLDivElement>({
  speed = 0.3,
  direction = 'vertical',
  initialOffset = 0,
  relativeToViewport = true,
}: ParallaxOptions = {}) {
  const ref = useRef<T>(null);
  const [offset, setOffset] = useState(initialOffset);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let rafId: number | null = null;

    const updateParallax = () => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Calcular qué tan visible está el elemento en el viewport
      const visibleRatio = Math.max(0, Math.min(1, 
        (viewportHeight - rect.top) / (viewportHeight + rect.height)
      ));

      // Calcular offset basado en el scroll
      let newOffset;
      if (direction === 'vertical') {
        newOffset = (visibleRatio - 0.5) * speed * (relativeToViewport ? viewportHeight : 200);
      } else {
        newOffset = (visibleRatio - 0.5) * speed * (relativeToViewport ? viewportWidth : 200);
      }

      setOffset(newOffset);

      // Verificar si el elemento es visible
      const isElementVisible = rect.top < viewportHeight && rect.bottom > 0;
      setIsVisible(isElementVisible);

      rafId = requestAnimationFrame(updateParallax);
    };

    // Iniciar
    rafId = requestAnimationFrame(updateParallax);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [speed, direction, relativeToViewport]);

  // Estilos CSS en línea
  const style = {
    transform: direction === 'vertical' 
      ? `translateY(${offset}px)` 
      : `translateX(${offset}px)`,
    willChange: 'transform',
  } as JSX.CSSProperties;

  return { ref, style, offset, isVisible };
}