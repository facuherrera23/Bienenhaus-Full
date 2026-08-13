import { render, screen } from '@testing-library/preact';
import { Avatar } from './Avatar';

describe('Avatar', () => {
    it('renders the fallback initials when no src is provided', () => {
        render(<Avatar fallback="AB" alt="Alice Brown" />);
        expect(screen.getByText('AB')).toBeInTheDocument();
    });

    it('renders as a div element', () => {
        const { container } = render(<Avatar fallback="AB" />);
        expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
    });

    it('renders an image when src is provided', () => {
        const { container } = render(<Avatar src="/photo.jpg" alt="Alice Brown" fallback="AB" />);
        const img = container.querySelector('img');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', '/photo.jpg');
        expect(img).toHaveAttribute('alt', 'Alice Brown');
    });

    it('does not render the fallback when an image is provided', () => {
        const { container } = render(<Avatar src="/photo.jpg" alt="Alice Brown" fallback="AB" />);
        expect(screen.queryByText('AB')).not.toBeInTheDocument();
        expect(container.querySelector('span')).not.toBeInTheDocument();
    });

    it('uses the alt text as the fallback aria-label', () => {
        render(<Avatar fallback="AB" alt="Alice Brown" />);
        expect(screen.getByLabelText('Alice Brown')).toBeInTheDocument();
    });

    it.each(['xs', 'sm', 'md', 'lg', 'xl'] as const)('applies the %s size class', (size) => {
        const { container } = render(<Avatar size={size} fallback="AB" />);
        const avatar = container.firstChild as HTMLElement;
        // base + size + shape (circle default) = at least 3 hashed classes
        expect(avatar.classList.length).toBeGreaterThanOrEqual(3);
    });

    it.each(['circle', 'square'] as const)('applies the %s shape class', (shape) => {
        const { container } = render(<Avatar shape={shape} fallback="AB" />);
        const avatar = container.firstChild as HTMLElement;
        expect(avatar.classList.length).toBeGreaterThanOrEqual(3);
    });

    it('defaults to the md size and circle shape', () => {
        const { container } = render(<Avatar fallback="AB" />);
        const avatar = container.firstChild as HTMLElement;
        // base + md + circle = 3 hashed classes
        expect(avatar.classList.length).toBe(3);
    });

    it('does not render a status indicator by default', () => {
        const { container } = render(<Avatar fallback="AB" />);
        expect(container.querySelector('[role="status"]')).not.toBeInTheDocument();
    });

    it.each(['online', 'offline', 'busy', 'away'] as const)(
        'shows the %s status indicator when provided',
        (status) => {
            const { container } = render(<Avatar fallback="AB" status={status} />);
            const indicator = container.querySelector('[role="status"]');
            expect(indicator).toBeInTheDocument();
            expect(indicator).toHaveAttribute('aria-label', `Status: ${status}`);
        },
    );

    it('adds the withStatus host class when a status is provided', () => {
        const { container } = render(<Avatar fallback="AB" status="online" />);
        const avatar = container.firstChild as HTMLElement;
        // base + md + circle + withStatus = 4 hashed classes
        expect(avatar.classList.length).toBe(4);
    });

    it('forwards the ref to the div element', () => {
        const ref = { current: null as HTMLDivElement | null };
        render(<Avatar ref={ref} fallback="AB" />);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('merges a consumer className alongside module classes', () => {
        const { container } = render(<Avatar fallback="AB" className="my-extra" />);
        expect(container.firstChild).toHaveClass('my-extra');
    });

    it('passes through extra div attributes', () => {
        render(<Avatar fallback="AB" data-testid="custom" title="User avatar" id="a1" />);
        const avatar = screen.getByTestId('custom');
        expect(avatar).toHaveAttribute('title', 'User avatar');
        expect(avatar).toHaveAttribute('id', 'a1');
    });

    it('combines size, shape, status, and custom className together', () => {
        const { container } = render(
            <Avatar size="lg" shape="square" status="busy" fallback="AB" className="extra" />,
        );
        const avatar = container.firstChild as HTMLElement;
        expect(avatar).toHaveClass('extra');
        // base + lg + square + withStatus = 4 hashed classes + 1 consumer = 5
        expect(avatar.classList.length).toBe(5);
        expect(avatar.querySelector('[role="status"]')).toBeInTheDocument();
    });
});
