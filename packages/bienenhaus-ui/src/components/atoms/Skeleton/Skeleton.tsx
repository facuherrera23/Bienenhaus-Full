import { type CSSProperties, type HTMLAttributes } from 'preact';
import { forwardRef } from 'preact/compat';
import styles from './Skeleton.module.css';

/**
 * Skeleton — loading placeholder atom.
 *
 * Renders a shimmering placeholder block used while content loads. Every
 * important component (cards, widgets, tables, forms, sidebars, dashboard)
 * should have its own Skeleton; never use a Spinner as the primary loading
 * experience (spec §59/§71/§128/§296: Skeleton → Placeholder → Spinner).
 *
 * Variants:  text (line) | circular (avatar) | rectangular (block) | rounded (card)
 * Sizes:     sm | md | lg — line height, avatar diameter, or block height
 * Animation: pulse (opacity) | wave (shimmer sweep) | none
 *
 * Accessibility: decorative by default (`aria-hidden="true"`). The loading
 * container owns the live region (role="status" / aria-busy on the wrapper).
 * Animations respect `prefers-reduced-motion`.
 */
export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded';
export type SkeletonSize = 'sm' | 'md' | 'lg';
export type SkeletonAnimation = 'pulse' | 'wave' | 'none';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
    /** Shape. Default: 'text'. */
    variant?: SkeletonVariant;
    /** Scale — line height, avatar diameter, or block height. Default: 'md'. */
    size?: SkeletonSize;
    /** Loading effect. Default: 'pulse'. */
    animation?: SkeletonAnimation;
    /** Explicit width in px (number) or CSS length. Default: 100% (except circular). */
    width?: number | string;
    /** Explicit height in px (number) or CSS length. Overrides the size default. */
    height?: number | string;
}

const VARIANT_CLASS: Record<SkeletonVariant, string> = {
    text: styles.text,
    circular: styles.circular,
    rectangular: styles.rectangular,
    rounded: styles.rounded,
};

const SIZE_CLASS: Record<SkeletonSize, string> = {
    sm: styles.sm,
    md: styles.md,
    lg: styles.lg,
};

const ANIMATION_CLASS: Record<SkeletonAnimation, string> = {
    pulse: styles.pulse,
    wave: styles.wave,
    none: '',
};

/** Normalize a px number or CSS length into a CSS dimension value. */
const toCssLength = (value: number | string): string =>
    typeof value === 'number' ? `${value}px` : value;

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
    (
        {
            variant = 'text',
            size = 'md',
            animation = 'pulse',
            width,
            height,
            className,
            style,
            'aria-hidden': ariaHidden = true,
            ...props
        },
        ref,
    ) => {
        const dimensionStyle: CSSProperties = {};
        if (width !== undefined) dimensionStyle.width = toCssLength(width);
        if (height !== undefined) dimensionStyle.height = toCssLength(height);

        const classNames = [
            styles.skeleton,
            VARIANT_CLASS[variant],
            SIZE_CLASS[size],
            ANIMATION_CLASS[animation],
            className,
        ]
            .filter(Boolean)
            .join(' ');

        const mergedStyle =
            typeof style === 'string' ? style : { ...dimensionStyle, ...style };

        return (
            <div
                ref={ref}
                className={classNames}
                style={mergedStyle}
                aria-hidden={ariaHidden}
                {...props}
            />
        );
    },
);

Skeleton.displayName = 'Skeleton';
