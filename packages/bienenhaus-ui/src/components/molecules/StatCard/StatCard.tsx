import { type ComponentChild, type HTMLAttributes } from 'preact';
import { forwardRef } from 'preact/compat';
import { Spinner } from '../../atoms/Spinner/Spinner';
import styles from './StatCard.module.css';

/**
 * StatCard — KPI molecule for the Bienenhaus design system.
 *
 * Each card surfaces a single metric with:
 *   - **Icono**     — leading icon in a tinted rounded square
 *   - **Valor**     — large prominent number
 *   - **Variación** — delta vs previous period (semantic green/red + arrow)
 *   - **Mini gráfico** — optional inline SVG sparkline (no chart dependency)
 *   - **Acción rápida** — optional trailing icon-button action
 *
 * When `loading` is true the value is replaced by the Spinner atom
 * (label + icon remain visible).
 *
 * Sizes: sm | md (default)
 */
export type StatCardSize = 'sm' | 'md';

export interface StatCardTrend {
    /** Human-readable delta, e.g. "+12%", "-3%". */
    value: string;
    /** Arrow direction. */
    direction: 'up' | 'down';
    /**
     * Semantic meaning of the delta. When omitted, `positive` is inferred
     * from `direction` (up = positive, down = negative).
     */
    positive?: boolean;
}

export interface StatCardAction {
    /** Accessible label for the trailing icon-button. */
    label: string;
    /** Click handler. */
    onClick: () => void;
}

export interface StatCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'label'> {
    /** KPI label (e.g. "Propiedades publicadas"). */
    label: string;
    /** Prominent metric value. */
    value: string | number;
    /** Leading icon node (usually an SVG). Rendered inside a tinted square. */
    icon?: ComponentChild;
    /** Delta vs previous period. */
    trend?: StatCardTrend;
    /** Sparkline data points; rendered as an inline SVG polyline. */
    sparkline?: number[];
    /** Trailing quick-action icon-button. */
    action?: StatCardAction;
    /** Replaces the value with a Spinner atom (label + icon stay). */
    loading?: boolean;
    /** Card density. Default: 'md'. */
    size?: StatCardSize;
}

const SIZE_CLASS: Record<StatCardSize, string> = {
    sm: styles.sm,
    md: styles.md,
};

/** Up-arrow inline SVG (stroke = currentColor). */
function TrendArrowUp() {
    return (
        <svg
            class={styles.arrowIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
        >
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
        </svg>
    );
}

/** Down-arrow inline SVG (stroke = currentColor). */
function TrendArrowDown() {
    return (
        <svg
            class={styles.arrowIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
        >
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="5 12 12 19 19 12" />
        </svg>
    );
}

/** Action icon-button trailing arrow (stroke = currentColor). */
function ActionArrowIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
        >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
        </svg>
    );
}

/**
 * Build an SVG polyline `points` string from a numeric series.
 * Maps each value to a point in a 100×32 viewBox (x evenly spaced,
 * y normalized to [2, 30] with a 2px padding).
 */
function buildSparklinePoints(data: number[]): string {
    const W = 100;
    const H = 32;
    const PAD = 2;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = data.length > 1 ? W / (data.length - 1) : 0;

    return data
        .map((v, i) => {
            const x = i * stepX;
            const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
            return `${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(' ');
}

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
    (
        {
            label,
            value,
            icon,
            trend,
            sparkline,
            action,
            loading = false,
            size = 'md',
            className,
            ...props
        },
        ref,
    ) => {
        const classNames = [styles.card, SIZE_CLASS[size], className].filter(Boolean).join(' ');

        // Resolve semantic positivity: explicit `positive` wins, else infer from direction.
        const isPositive = trend ? (trend.positive ?? trend.direction === 'up') : false;
        const trendClass = trend ? (isPositive ? styles.trendUp : styles.trendDown) : '';

        return (
            <div ref={ref} className={classNames} {...props}>
                <div class={styles.header}>
                    {icon !== undefined && (
                        <span class={styles.iconBox} aria-hidden="true">
                            {icon}
                        </span>
                    )}
                    <span class={styles.label}>{label}</span>
                    {action && (
                        <button
                            type="button"
                            class={styles.actionBtn}
                            aria-label={action.label}
                            onClick={action.onClick}
                        >
                            <ActionArrowIcon />
                        </button>
                    )}
                </div>

                <div class={styles.body}>
                    {loading ? (
                        <Spinner size="sm" inline aria-label="Cargando…" />
                    ) : (
                        <span class={styles.value}>{value}</span>
                    )}

                    {trend && !loading && (
                        <span class={`${styles.trend} ${trendClass}`}>
                            {trend.direction === 'up' ? <TrendArrowUp /> : <TrendArrowDown />}
                            <span class={styles.trendValue}>{trend.value}</span>
                        </span>
                    )}
                </div>

                {sparkline && sparkline.length >= 2 && !loading && (
                    <svg
                        class={styles.sparkline}
                        viewBox="0 0 100 32"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                    >
                        <polyline
                            points={buildSparklinePoints(sparkline)}
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>
                )}
            </div>
        );
    },
);

StatCard.displayName = 'StatCard';
