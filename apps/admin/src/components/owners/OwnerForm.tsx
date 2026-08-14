import { useEffect, useRef, useState } from 'preact/hooks';
import { FileText, Mail, MapPin, User, X } from 'lucide-preact';
import { type OwnerFormValues, ownerSchema } from '../../lib/owners/schemas';
import { OWNER_PREFERRED_CONTACT_LABEL, OWNER_TYPE_LABEL } from '../../types/owners';

interface OwnerFormProps {
    initialData?: OwnerFormValues;
    onSubmit: (data: OwnerFormValues) => Promise<void>;
    onCancel?: () => void;
    isLoading?: boolean;
    submitLabel?: string;
}

export function OwnerForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading,
    submitLabel = 'Guardar',
}: OwnerFormProps) {
    const createInitialState = (): OwnerFormValues => ({
        full_name: '',
        email: '',
        phone: '',
        dni_cuit: '',
        address: '',
        owner_type: 'persona_fisica',
        company_name: '',
        notes: '',
        preferred_contact: 'whatsapp',
        ...(initialData || {}),
    });

    const [formData, setFormData] = useState<OwnerFormValues>(createInitialState());
    const [errors, setErrors] = useState<Partial<Record<keyof OwnerFormValues, string>>>({});
    // Los callers pasan `initialData` como objeto literal nuevo en cada render;
    // si reseteáramos por identidad, cualquier re-render del padre (p. ej. queries
    // hermanas resolviendo) borraría lo que el usuario está escribiendo. Solo
    // hidratamos cuando los VALORES cambian de verdad.
    const lastHydratedRef = useRef<string | null>(null);

    useEffect(() => {
        if (!initialData) return;
        const signature = JSON.stringify(initialData);
        if (lastHydratedRef.current === signature) return;
        lastHydratedRef.current = signature;
        setFormData(createInitialState());
    }, [initialData]);

    const validateField = (name: keyof OwnerFormValues, value: string | boolean) => {
        const fieldSchema = ownerSchema.shape[name];
        if (fieldSchema) {
            const result = fieldSchema.safeParse(value);
            if (!result.success) {
                setErrors((prev) => ({ ...prev, [name]: result.error.errors[0].message }));
            } else {
                setErrors((prev) => {
                    const next = { ...prev };
                    delete next[name];
                    return next;
                });
            }
        }
    };

    const handleChange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const { name, value, type } = target;
        const finalValue = type === 'checkbox' ? target.checked : value;
        setFormData((prev) => ({ ...prev, [name]: finalValue }));
        validateField(name as keyof OwnerFormValues, finalValue);
    };

    const handleSubmitForm = async (e: Event) => {
        e.preventDefault();
        const result = ownerSchema.safeParse(formData);
        if (!result.success) {
            const newErrors: Partial<Record<keyof OwnerFormValues, string>> = {};
            result.error.errors.forEach((err) => {
                if (err.path[0]) {
                    newErrors[err.path[0] as keyof OwnerFormValues] = err.message;
                }
            });
            setErrors(newErrors);
            return;
        }
        await onSubmit(result.data);
    };

    const ownerType = formData.owner_type;

    return (
        <form onSubmit={handleSubmitForm} className="owner-form" noValidate>
            <div className="form-section">
                <h3 className="form-section-title">
                    <User size={16} /> Datos Personales
                </h3>

                <div className="form-grid">
                    <div className="field">
                        <label htmlFor="full_name">
                            Nombre completo <span className="required">*</span>
                        </label>
                        <input
                            id="full_name"
                            name="full_name"
                            type="text"
                            placeholder="Juan Pérez"
                            value={formData.full_name}
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                        {errors.full_name && <span className="error">{errors.full_name}</span>}
                    </div>

                    <div className="field">
                        <label htmlFor="owner_type">Tipo de propietario</label>
                        <select
                            id="owner_type"
                            name="owner_type"
                            value={formData.owner_type}
                            onChange={handleChange}
                            disabled={isLoading}
                        >
                            <option value="persona_fisica">
                                {OWNER_TYPE_LABEL.persona_fisica}
                            </option>
                            <option value="persona_juridica">
                                {OWNER_TYPE_LABEL.persona_juridica}
                            </option>
                        </select>
                    </div>

                    <div className={`field ${ownerType === 'persona_juridica' ? '' : 'hidden'}`}>
                        <label htmlFor="company_name">Razón social</label>
                        <input
                            id="company_name"
                            name="company_name"
                            type="text"
                            placeholder="Empresa S.A."
                            value={formData.company_name}
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="dni_cuit">DNI / CUIT</label>
                        <input
                            id="dni_cuit"
                            name="dni_cuit"
                            type="text"
                            placeholder="12345678 o 20-12345678-9"
                            value={formData.dni_cuit}
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h3 className="form-section-title">
                    <Mail size={16} /> Contacto
                </h3>

                <div className="form-grid">
                    <div className="field">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="juan@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                        {errors.email && <span className="error">{errors.email}</span>}
                    </div>

                    <div className="field">
                        <label htmlFor="phone">Teléfono</label>
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="+54 9 11 1234-5678"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                        {errors.phone && <span className="error">{errors.phone}</span>}
                    </div>

                    <div className="field">
                        <label htmlFor="preferred_contact">Contacto preferido</label>
                        <select
                            id="preferred_contact"
                            name="preferred_contact"
                            value={formData.preferred_contact}
                            onChange={handleChange}
                            disabled={isLoading}
                        >
                            <option value="whatsapp">
                                {OWNER_PREFERRED_CONTACT_LABEL.whatsapp}
                            </option>
                            <option value="email">{OWNER_PREFERRED_CONTACT_LABEL.email}</option>
                            <option value="call">{OWNER_PREFERRED_CONTACT_LABEL.call}</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h3 className="form-section-title">
                    <MapPin size={16} /> Dirección
                </h3>

                <div className="field full-width">
                    <label htmlFor="address">Dirección completa</label>
                    <textarea
                        id="address"
                        name="address"
                        rows={2}
                        placeholder="Calle 123, Piso 4, Dpto B, CABA"
                        value={formData.address}
                        onChange={handleChange}
                        disabled={isLoading}
                    />
                </div>
            </div>

            <div className="form-section">
                <h3 className="form-section-title">
                    <FileText size={16} /> Notas
                </h3>

                <div className="field full-width">
                    <label htmlFor="notes">Notas internas</label>
                    <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        placeholder="Información adicional relevante..."
                        value={formData.notes}
                        onChange={handleChange}
                        disabled={isLoading}
                    />
                </div>
            </div>

            <div className="form-actions">
                {onCancel && (
                    <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        <X size={14} /> Cancelar
                    </button>
                )}
                <button type="submit" className="btn btn--primary" disabled={isLoading}>
                    {isLoading ? 'Guardando...' : submitLabel}
                </button>
            </div>
        </form>
    );
}
