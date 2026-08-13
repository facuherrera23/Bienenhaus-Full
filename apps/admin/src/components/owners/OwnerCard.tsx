import { Building2, Mail, MapPin, Phone, UserCheck } from 'lucide-preact';
import { Link } from 'wouter-preact';
import { OWNER_PREFERRED_CONTACT_LABEL, OWNER_TYPE_LABEL, type OwnerRow } from '../../types/owners';

interface OwnerCardProps {
    owner: OwnerRow;
    onClick?: () => void;
}

export function OwnerCard({ owner, onClick }: OwnerCardProps) {
    const handleClick = (e: MouseEvent) => {
        if (!onClick) return;
        const target = e.target as HTMLElement;
        if (target.closest('a,button')) return;
        onClick();
    };

    return (
        <article
            className="owner-card"
            onClick={handleClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <div className="owner-card-header">
                <div className="owner-avatar" aria-hidden="true">
                    {owner.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="owner-main">
                    <h3 className="owner-name">{owner.full_name}</h3>
                    <span className={`owner-type-badge owner-type--${owner.owner_type}`}>
                        {OWNER_TYPE_LABEL[owner.owner_type]}
                    </span>
                </div>
            </div>

            <div className="owner-details">
                {owner.email && (
                    <div className="owner-detail">
                        <Mail size={14} />
                        <span>{owner.email}</span>
                    </div>
                )}
                {owner.phone && (
                    <div className="owner-detail">
                        <Phone size={14} />
                        <span>{owner.phone}</span>
                    </div>
                )}
                {owner.dni_cuit && (
                    <div className="owner-detail">
                        <UserCheck size={14} />
                        <span>{owner.dni_cuit}</span>
                    </div>
                )}
                {owner.address && (
                    <div className="owner-detail">
                        <MapPin size={14} />
                        <span>{owner.address}</span>
                    </div>
                )}
                <div className="owner-detail owner-preferred-contact">
                    <span className="contact-icon">
                        {owner.preferred_contact === 'whatsapp' && <span>💬</span>}
                        {owner.preferred_contact === 'email' && <Mail size={14} />}
                        {owner.preferred_contact === 'call' && <Phone size={14} />}
                    </span>
                    <span>{OWNER_PREFERRED_CONTACT_LABEL[owner.preferred_contact]}</span>
                </div>
            </div>

            <div className="owner-footer">
                <Link
                    href={`/propietarios/${owner.id}`}
                    className="owner-link"
                    onClick={(e) => e.stopPropagation()}
                >
                    Ver detalle
                </Link>
                <div className="owner-property-count">
                    <Building2 size={14} />
                    <span>
                        {owner.property_count} propiedad{owner.property_count !== 1 ? 'es' : ''}
                    </span>
                </div>
            </div>
        </article>
    );
}
