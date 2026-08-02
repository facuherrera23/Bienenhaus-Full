import { useEffect, useRef } from 'preact/hooks';

/**
 * Replica el efecto spotlight: setea `--mouse-x` / `--mouse-y` en cada
 * elemento `selector` mientras el mouse se mueve sobre él.
 */
export function useSpotlight<T extends HTMLElement>(selector: string) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>(selector));
    if (els.length === 0) return;

    const handlers = els.map((el) => {
      const onMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        el.style.setProperty('--mouse-x', `${x}%`);
        el.style.setProperty('--mouse-y', `${y}%`);
      };
      el.addEventListener('mousemove', onMove);
      return () => el.removeEventListener('mousemove', onMove);
    });

    return () => handlers.forEach((remove) => remove());
  }, [selector]);

  return ref;
}
