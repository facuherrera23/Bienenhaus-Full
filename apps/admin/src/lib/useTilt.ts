// apps/admin/src/lib/useTilt.ts
import { useEffect, useRef, useState } from 'preact/hooks';

interface TiltOptions {
  maxAngle?: number;
  transitionSpeed?: number;
  glow?: boolean;
  glowIntensity?: number;
}

export function useTilt({
  maxAngle = 10,
  transitionSpeed = 300,
  glow = true,
  glowIntensity = 0.3,
}: TiltOptions = {}) {
  const ref = useRef<HTMLElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glowX: 50, glowY: 50 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateY = ((x - centerX) / centerX) * maxAngle;
      const rotateX = ((centerY - y) / centerY) * maxAngle;

      const glowX = (x / rect.width) * 100;
      const glowY = (y / rect.height) * 100;

      setTilt({ rotateX, rotateY, glowX, glowY });
      setIsHovering(true);
    };

    const handleMouseLeave = () => {
      setTilt({ rotateX: 0, rotateY: 0, glowX: 50, glowY: 50 });
      setIsHovering(false);
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [maxAngle]);

  const style = {
    transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
    transition: `transform ${transitionSpeed}ms var(--bh-ease-premium, cubic-bezier(0.22, 0.61, 0.36, 1))`,
    ...(glow && {
      '--mouse-x': `${tilt.glowX}%`,
      '--mouse-y': `${tilt.glowY}%`,
      '--glow-intensity': glowIntensity,
    }),
  } as React.CSSProperties;

  return { ref, style, tilt, isHovering };
}