import type { PriceStatus } from '../../types/owners';
import { formatPriceStatus, PRICE_STATUS_GAUGE_COLOR } from '../../types/owners';

interface PriceAnalysisGaugeProps {
    analysis: {
        price_difference_pct: number;
        price_status: PriceStatus;
        estimated_market_price: number;
        our_listing_price: number;
    } | null;
    size?: number;
    showLabels?: boolean;
}

export function PriceAnalysisGauge({
    analysis,
    size = 200,
    showLabels = true,
}: PriceAnalysisGaugeProps) {
    if (!analysis) {
        return (
            <div className="gauge-empty" style={{ width: size, height: size / 2 }}>
                <p>Sin análisis de precio</p>
            </div>
        );
    }

    const { price_difference_pct, price_status, estimated_market_price, our_listing_price } =
        analysis;
    const color = PRICE_STATUS_GAUGE_COLOR[price_status];

    // Gauge goes from -30% to +30%, center at 0%
    // Map percentage to angle: -30% = -135deg, 0% = 0deg, +30% = +135deg
    const maxPct = 30;
    const clampedPct = Math.max(-maxPct, Math.min(maxPct, price_difference_pct));
    const angle = (clampedPct / maxPct) * 135; // -135 to +135 degrees

    const radius = size / 2 - 20;
    const centerX = size / 2;
    const centerY = size / 2 + 10;

    // Background arc (full gauge range)
    const bgStartAngle = -135;
    const bgEndAngle = 135;
    const bgPath = describeArc(centerX, centerY, radius, bgStartAngle, bgEndAngle);

    // Value arc (from 0 to current angle)
    const valuePath =
        angle >= 0
            ? describeArc(centerX, centerY, radius, 0, angle)
            : describeArc(centerX, centerY, radius, angle, 0);

    // Center circle
    const centerRadius = radius * 0.4;

    return (
        <div className="price-gauge" style={{ width: size, height: size / 2 + 40 }}>
            <svg viewBox={`0 0 ${size} ${size / 2 + 40}`} width={size} height={size / 2 + 40}>
                <defs>
                    <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22c55e" /> {/* way_below/below */}
                        <stop offset="33%" stopColor="#22c55e" /> {/* fair */}
                        <stop offset="50%" stopColor="#eab308" /> {/* premium */}
                        <stop offset="66%" stopColor="#ef4444" /> {/* above */}
                        <stop offset="100%" stopColor="#ef4444" /> {/* way_above */}
                    </linearGradient>
                </defs>

                {/* Background track */}
                <path
                    d={bgPath}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth={16}
                    strokeLinecap="round"
                />

                {/* Gradient track */}
                <path
                    d={bgPath}
                    fill="none"
                    stroke="url(#gauge-gradient)"
                    strokeWidth={16}
                    strokeLinecap="round"
                    strokeDasharray={`${((bgEndAngle - bgStartAngle) / 360) * 2 * Math.PI * radius} 9999`}
                    strokeDashoffset={0}
                />

                {/* Current value indicator */}
                <path
                    d={valuePath}
                    fill="none"
                    stroke={color}
                    strokeWidth={16}
                    strokeLinecap="round"
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                />

                {/* Center circle */}
                <circle
                    cx={centerX}
                    cy={centerY}
                    r={centerRadius}
                    fill="#fff"
                    stroke={color}
                    strokeWidth={3}
                />

                {/* Percentage text in center */}
                <text
                    x={centerX}
                    y={centerY + 6}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={radius * 0.35}
                    fontWeight="700"
                    fill={color}
                    fontFamily="system-ui, -apple-system, sans-serif"
                >
                    {formatPriceStatus(price_difference_pct)}
                </text>

                {/* Status label below center */}
                {showLabels && (
                    <text
                        x={centerX}
                        y={centerY + centerRadius + 22}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={12}
                        fill="#6b7280"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        style="text-transform: uppercase;"
                        letterSpacing="0.5px"
                    >
                        {getPriceStatusLabel(price_status)}
                    </text>
                )}

                {/* Min/Max labels */}
                {showLabels && (
                    <>
                        <text
                            x={centerX - radius - 5}
                            y={centerY + 5}
                            textAnchor="end"
                            dominantBaseline="middle"
                            fontSize={11}
                            fill="#9ca3af"
                            fontFamily="system-ui, -apple-system, sans-serif"
                        >
                            -30%
                        </text>
                        <text
                            x={centerX + radius + 5}
                            y={centerY + 5}
                            textAnchor="start"
                            dominantBaseline="middle"
                            fontSize={11}
                            fill="#9ca3af"
                            fontFamily="system-ui, -apple-system, sans-serif"
                        >
                            +30%
                        </text>
                        <text
                            x={centerX}
                            y={centerY + 5}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={11}
                            fill="#9ca3af"
                            fontFamily="system-ui, -apple-system, sans-serif"
                        >
                            0%
                        </text>
                    </>
                )}
            </svg>

            {showLabels && (
                <div className="gauge-prices">
                    <div className="price-item">
                        <span className="price-label">Precio publicación</span>
                        <span className="price-value">
                            ${our_listing_price.toLocaleString('es-AR')}
                        </span>
                    </div>
                    <div className="price-item">
                        <span className="price-label">Precio mercado</span>
                        <span className="price-value">
                            ${estimated_market_price.toLocaleString('es-AR')}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

function polarToCartesian(
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number,
) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    };
}

function describeArc(
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
) {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function getPriceStatusLabel(status: PriceStatus): string {
    const labels: Record<PriceStatus, string> = {
        way_below: 'MUY POR DEBAJO',
        below: 'POR DEBAJO',
        fair: 'PRECIO JUSTO',
        premium: 'PREMIUM',
        above: 'POR ENCIMA',
        way_above: 'MUY POR ENCIMA',
    };
    return labels[status];
}
