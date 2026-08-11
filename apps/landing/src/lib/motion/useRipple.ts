// apps/landing/src/lib/motion/useRipple.ts
import { useRef, useState } from 'preact/hooks';

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

export function useRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const counterRef = useRef(0);

  const createRipple = (e: React.MouseEvent<HTMLElement>) => {
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const id = counterRef.current++;
    setRipples((prev) => [...prev, { id, x, y, size }]);

    // Eliminar el ripple después de la animación
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  };

  const RippleEffect = ({ children }: { children: React.ReactNode }) => {
    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
      createRipple(e);
    };

    return (
      <div style={{ position: 'relative', overflow: 'hidden' }} onClick={handleClick}>
        {children}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            style={{
              position: 'absolute',
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.3)',
              transform: 'scale(0)',
              animation: 'rippleAnim 600ms ease-out forwards',
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>
    );
  };

  return { createRipple, RippleEffect, ripples };
}