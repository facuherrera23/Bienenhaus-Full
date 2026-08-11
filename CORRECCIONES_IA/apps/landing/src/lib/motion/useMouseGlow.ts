// apps/landing/src/lib/motion/useMouseGlow.ts
import { useEffect, useRef, useState } from 'preact/hooks';

export interface MouseGlowState {
  mouseX: number;
  mouseY: number;
  isActive: boolean;
}

export function useMouseGlow() {
  const glowRef = useRef<HTMLElement>(null);
  const [state, setState] = useState<MouseGlowState>({
    mouseX: -9999,
    mouseY: -9999,
    isActive: false,
  });

  useEffect(() => {
    const element = glowRef.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setState({
        mouseX: x,
        mouseY: y,
        isActive: true,
      });
    };

    const handleMouseLeave = () => {
      setState({
        mouseX: -9999,
        mouseY: -9999,
        isActive: false,
      });
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return { glowRef, ...state };
}