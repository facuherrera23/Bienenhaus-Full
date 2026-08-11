/**
 * Brand Icons - Custom SVG components for brand logos
 * These replace FontAwesome brand icons since lucide-preact doesn't include trademarked brand logos
 */

interface BrandIconProps {
    size?: string | number;
    color?: string;
    className?: string;
    'aria-hidden'?: boolean;
    'aria-label'?: string;
}

/**
 * Instagram brand icon
 */
export function InstagramIcon({
    size = 24,
    color = 'currentColor',
    className = '',
    'aria-hidden': ariaHidden = true,
    'aria-label': ariaLabel = 'Instagram',
}: BrandIconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden={ariaHidden}
            aria-label={ariaLabel}
            role="img"
        >
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
    );
}

/**
 * Facebook brand icon
 */
export function FacebookIcon({
    size = 24,
    color = 'currentColor',
    className = '',
    'aria-hidden': ariaHidden = true,
    'aria-label': ariaLabel = 'Facebook',
}: BrandIconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden={ariaHidden}
            aria-label={ariaLabel}
            role="img"
        >
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
    );
}

/**
 * LinkedIn brand icon
 */
export function LinkedinIcon({
    size = 24,
    color = 'currentColor',
    className = '',
    'aria-hidden': ariaHidden = true,
    'aria-label': ariaLabel = 'LinkedIn',
}: BrandIconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden={ariaHidden}
            aria-label={ariaLabel}
            role="img"
        >
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
            <rect width="4" height="12" x="2" y="9" />
            <circle cx="4" cy="4" r="2" />
        </svg>
    );
}

/**
 * YouTube brand icon
 */
export function YoutubeIcon({
    size = 24,
    color = 'currentColor',
    className = '',
    'aria-hidden': ariaHidden = true,
    'aria-label': ariaLabel = 'YouTube',
}: BrandIconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden={ariaHidden}
            aria-label={ariaLabel}
            role="img"
        >
            <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" />
            <path d="M10 15l5-3-5-3z" />
        </svg>
    );
}

/**
 * TikTok brand icon
 */
export function TiktokIcon({
    size = 24,
    color = 'currentColor',
    className = '',
    'aria-hidden': ariaHidden = true,
    'aria-label': ariaLabel = 'TikTok',
}: BrandIconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden={ariaHidden}
            aria-label={ariaLabel}
            role="img"
        >
            <path d="M15 8v7" />
            <path d="M17 8v7" />
            <path d="M12 6a7 7 0 0 1 7 7" />
            <path d="M5 18a7 7 0 0 0 7-7" />
            <path d="M17 3a7 7 0 0 1 0 14" />
        </svg>
    );
}

/**
 * WhatsApp brand icon
 */
export function WhatsappIcon({
    size = 24,
    color = 'currentColor',
    className = '',
    'aria-hidden': ariaHidden = true,
    'aria-label': ariaLabel = 'WhatsApp',
}: BrandIconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden={ariaHidden}
            aria-label={ariaLabel}
            role="img"
        >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
    );
}

/**
 * Hash/Hashtag icon (replaces Hashtag)
 */
export function HashIcon({
    size = 24,
    color = 'currentColor',
    className = '',
    'aria-hidden': ariaHidden = true,
    'aria-label': ariaLabel = 'Hashtag',
}: BrandIconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden={ariaHidden}
            aria-label={ariaLabel}
            role="img"
        >
            <line x1="4" y1="9" x2="20" y2="9" />
            <line x1="4" y1="15" x2="20" y2="15" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
        </svg>
    );
}

/**
 * Paper Plane / Send icon (replaces PaperPlane)
 */
export function SendIcon({
    size = 24,
    color = 'currentColor',
    className = '',
    'aria-hidden': ariaHidden = true,
    'aria-label': ariaLabel = 'Send',
}: BrandIconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden={ariaHidden}
            aria-label={ariaLabel}
            role="img"
        >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
    );
}

/**
 * Re-export MessageSquare from lucide-preact for convenience
 */
export { MessageSquare } from 'lucide-preact';
