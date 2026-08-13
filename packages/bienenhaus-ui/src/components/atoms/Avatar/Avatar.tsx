import { type HTMLAttributes } from 'preact';
import { forwardRef } from 'preact/compat';
import styles from './Avatar.module.css';

/**
 * Avatar — user identity atom.
 *
 * Renders a circular or square avatar with an optional image, a fallback
 * (initials or short text) when no image is available, and an optional
 * presence status indicator dot at the bottom-right corner.
 *
 * Sizes:  xs 24px | sm 32px | md 40px | lg 48px | xl 64px
 * Shape:  circle | square
 * Status: online | offline | busy | away
 */
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarShape = 'circle' | 'square';
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
    /** Image source URL. When provided, the image is rendered over the fallback. */
    src?: string;
    /** Alt text for the image (also used as the fallback aria-label). */
    alt?: string;
    /** Initials or short text shown when there is no image. */
    fallback?: string;
    /** Diameter scale. Default: 'md' (40px). */
    size?: AvatarSize;
    /** Presence indicator shown as a bottom-right dot. Omit to hide. */
    status?: AvatarStatus;
    /** Corner shape. Default: 'circle'. */
    shape?: AvatarShape;
}

const SIZE_CLASS: Record<AvatarSize, string> = {
    xs: styles.xs,
    sm: styles.sm,
    md: styles.md,
    lg: styles.lg,
    xl: styles.xl,
};

const SHAPE_CLASS: Record<AvatarShape, string> = {
    circle: styles.circle,
    square: styles.square,
};

const STATUS_CLASS: Record<AvatarStatus, string> = {
    online: styles.statusOnline,
    offline: styles.statusOffline,
    busy: styles.statusBusy,
    away: styles.statusAway,
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
    (
        {
            src,
            alt = '',
            fallback,
            size = 'md',
            shape = 'circle',
            status,
            className,
            children,
            ...props
        },
        ref,
    ) => {
        const classNames = [
            styles.avatar,
            SIZE_CLASS[size],
            SHAPE_CLASS[shape],
            status && styles.withStatus,
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div ref={ref} className={classNames} {...props}>
                {src ? (
                    <img
                        className={styles.image}
                        src={src}
                        alt={alt}
                        // Prevent layout shift; the avatar box clips via overflow:hidden.
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    <span className={styles.fallback} aria-label={alt || undefined}>
                        {fallback ?? children}
                    </span>
                )}

                {status && (
                    <span
                        className={`${styles.status} ${STATUS_CLASS[status]}`}
                        aria-label={`Status: ${status}`}
                        role="status"
                    />
                )}
            </div>
        );
    },
);

Avatar.displayName = 'Avatar';
