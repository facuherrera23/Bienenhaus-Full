// apps/landing/src/lib/motion/useCountUp.ts
import { useEffect, useRef, useState } from 'preact/hooks';

export interface CountUpOptions {
  /** Duración de la animación en milisegundos */
  duration?: number;
  /** Si debe iniciar automáticamente */
  start?: boolean;
  /** Función de easing personalizada */
  easing?: (t: number) => number;
  /** Valor inicial (por defecto 0) */
  initialValue?: number;
  /** Si se debe reiniciar al cambiar el target */
  resetOnTargetChange?: boolean;
}

export function useCountUp(
  target: number,
  {
    duration = 2000,
    start = true,
    easing = easeOutCubic,
    initialValue = 0,
    resetOnTargetChange = false,
  }: CountUpOptions = {}
) {
  const [value, setValue] = useState(initialValue);
  const [isComplete, setIsComplete] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const startValueRef = useRef(initialValue);
  const currentTargetRef = useRef(target);
  const isRunningRef = useRef(false);

  // Si el target cambia y resetOnTargetChange es true, reiniciamos
  useEffect(() => {
    if (resetOnTargetChange && currentTargetRef.current !== target) {
      currentTargetRef.current = target;
      setValue(initialValue);
      setIsComplete(false);
      startTimeRef.current = null;
      isRunningRef.current = false;
    }
  }, [target, resetOnTargetChange, initialValue]);

  useEffect(() => {
    if (!start) return;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
        startValueRef.current = value;
        isRunningRef.current = true;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      const currentValue =
        startValueRef.current + (target - startValueRef.current) * easedProgress;
      
      // Para números enteros, redondeamos
      const finalValue = Number.isInteger(target) 
        ? Math.round(currentValue) 
        : currentValue;
      
      setValue(finalValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setValue(target);
        setIsComplete(true);
        isRunningRef.current = false;
      }
    };

    // Si ya está completo, no reiniciamos
    if (isComplete && !resetOnTargetChange) return;

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        isRunningRef.current = false;
      }
    };
  }, [target, duration, start, easing, value, isComplete, resetOnTargetChange]);

  // Función para reiniciar manualmente
  const reset = () => {
    setValue(initialValue);
    setIsComplete(false);
    startTimeRef.current = null;
    isRunningRef.current = false;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  return { value, isComplete, isRunning: isRunningRef.current, reset };
}

// Funciones de easing predefinidas
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}