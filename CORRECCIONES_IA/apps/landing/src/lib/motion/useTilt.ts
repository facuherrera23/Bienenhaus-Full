// apps/landing/src/lib/motion/useTilt.ts
import { useEffect, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';

export interface TiltOptions {
  /** Ángulo máximo de rotación en grados */
  maxAngle?: number;
  /** Velocidad de transición en ms */
  transitionSpeed?: number;
  /** Si debe aplicar glow */
  glow?: boolean;
  /** Intensidad del glow (0-1) */
  glowIntensity?: number;
}

export function useTilt<T extends HTMLElement = HTMLDivElement>({
  maxAngle = 15,
  transitionSpeed = 300,
  glow = true,
  glowIntensity = 0.3,
}: TiltOptions = {}) {
  const ref = useRef<T>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glowX: 50, glowY: 50 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calcular rotación basada en la posición del mouse
      const rotateY = ((x - centerX) / centerX) * maxAngle;
      const rotateX = ((centerY - y) / centerY) * maxAngle;

      // Calcular posición del glow
      const glowX = (x / rect.width) * 100;
      const glowY = (y / rect.height) * 100;

      setTilt({ rotateX, rotateY, glowX, glowY });
    };

    const handleMouseLeave = () => {
      setTilt({ rotateX: 0, rotateY: 0, glowX: 50, glowY: 50 });
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [maxAngle]);

  // Estilos CSS en línea para aplicar el efecto
  const style = {
    transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
    transition: `transform ${transitionSpeed}ms var(--bh-ease-premium, cubic-bezier(0.22, 0.61, 0.36, 1))`,
    ...(glow && {
      '--mouse-x': `${tilt.glowX}%`,
      '--mouse-y': `${tilt.glowY}%`,
      '--glow-intensity': glowIntensity,
    }),
  } as JSX.CSSProperties;

  return { ref, style, tilt };
}