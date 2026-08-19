import { MessageSquare } from 'lucide-preact';
import { Button, type ButtonVariant } from '@bienenhaus/ui';
import { buildWhatsAppUrl, type WhatsAppTemplateKey } from '../../lib/owners/owners';

interface WhatsAppButtonProps {
    phone: string;
    templateKey?: WhatsAppTemplateKey;
    variables?: Record<string, string>;
    customMessage?: string;
    label?: string;
    variant?: ButtonVariant;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function WhatsAppButton({
    phone,
    templateKey = 'custom',
    variables = {},
    customMessage,
    label = 'WhatsApp',
    variant = 'primary',
    size = 'md',
    className = '',
}: WhatsAppButtonProps) {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) return null;

    const url = templateKey === 'custom' && customMessage
        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customMessage)}`
        : buildWhatsAppUrl(phone, templateKey, variables);

    return (
        <Button
            variant={variant}
            size={size}
            className={className}
            onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
            <MessageSquare size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} />
            {label}
        </Button>
    );
}