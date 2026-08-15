import { render, screen } from '@testing-library/preact';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
    it('renders as a div element', () => {
        const { container } = render(<Skeleton />);
        expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
    });

    it('renders with default variant, size, and animation', () => {
        const { container } = render(<Skeleton />);
        const skeleton = container.firstChild as HTMLElement;
        // base + text + md + pulse = 4 hashed classes
        expect(skeleton.classList.length).toBe(4);
    });

    it.each(['text', 'circular', 'rectangular', 'rounded'] as const)(
        'applies the %s variant class',
        (variant) => {
            const { container } = render(<Skeleton variant={variant} />);
            const skeleton = container.firstChild as HTMLElement;
            // base + variant + md + pulse = 4 hashed classes
            expect(skeleton.classList.length).toBe(4);
        },
    );

    it.each(['sm', 'md', 'lg'] as const)('applies the %s size class', (size) => {
        const { container } = render(<Skeleton size={size} />);
        const skeleton = container.firstChild as HTMLElement;
        // base + text + size + pulse = 4 hashed classes
        expect(skeleton.classList.length).toBe(4);
    });

    it('omits the animation class when animation is none', () => {
        const { container } = render(<Skeleton animation="none" />);
        const skeleton = container.firstChild as HTMLElement;
        // base + text + md = 3 hashed classes
        expect(skeleton.classList.length).toBe(3);
    });

    it('is decorative by default (aria-hidden)', () => {
        render(<Skeleton data-testid="sk" />);
        expect(screen.getByTestId('sk')).toHaveAttribute('aria-hidden', 'true');
    });

    it('allows overriding aria-hidden', () => {
        render(<Skeleton data-testid="sk" aria-hidden={false} />);
        expect(screen.getByTestId('sk')).toHaveAttribute('aria-hidden', 'false');
    });

    it('converts numeric width/height to px', () => {
        const { container } = render(<Skeleton width={240} height={120} />);
        const skeleton = container.firstChild as HTMLElement;
        expect(skeleton.style.width).toBe('240px');
        expect(skeleton.style.height).toBe('120px');
    });

    it('accepts CSS length width/height strings', () => {
        const { container } = render(<Skeleton width="50%" height="2rem" />);
        const skeleton = container.firstChild as HTMLElement;
        expect(skeleton.style.width).toBe('50%');
        expect(skeleton.style.height).toBe('2rem');
    });

    it('merges dimension styles with a consumer style', () => {
        const { container } = render(<Skeleton width={100} style={{ marginTop: '8px' }} />);
        const skeleton = container.firstChild as HTMLElement;
        expect(skeleton.style.width).toBe('100px');
        expect(skeleton.style.marginTop).toBe('8px');
    });

    it('forwards the ref to the div element', () => {
        const ref = { current: null as HTMLDivElement | null };
        render(<Skeleton ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('merges a consumer className alongside module classes', () => {
        const { container } = render(<Skeleton className="my-extra" />);
        expect(container.firstChild).toHaveClass('my-extra');
    });

    it('passes through extra div attributes', () => {
        render(<Skeleton data-testid="custom" title="Loading" id="s1" />);
        const skeleton = screen.getByTestId('custom');
        expect(skeleton).toHaveAttribute('title', 'Loading');
        expect(skeleton).toHaveAttribute('id', 's1');
    });

    it('combines variant, size, animation, and custom className together', () => {
        const { container } = render(
            <Skeleton variant="rounded" size="lg" animation="wave" className="extra" />,
        );
        const skeleton = container.firstChild as HTMLElement;
        expect(skeleton).toHaveClass('extra');
        // base + rounded + lg + wave = 4 hashed classes + 1 consumer = 5
        expect(skeleton.classList.length).toBe(5);
    });
});
