import { useState } from 'preact/hooks';
import { GripVertical, Plus, Trash2 } from 'lucide-preact';
import type { ComparableProperty } from '../../lib/owners/schemas';
import { Button, IconButton } from '@bienenhaus/ui';

interface ComparablePropertyInputProps {
    value: ComparableProperty[];
    onChange: (value: ComparableProperty[]) => void;
    disabled?: boolean;
}

export function ComparablePropertyInput({
    value,
    onChange,
    disabled,
}: ComparablePropertyInputProps) {
    const [comparables, setComparables] = useState<ComparableProperty[]>(value);

    // Sync with external value
    if (JSON.stringify(comparables) !== JSON.stringify(value)) {
        setComparables(value);
    }

    const updateComparable = (
        index: number,
        field: keyof ComparableProperty,
        newValue: string | number | null,
    ) => {
        const updated = [...comparables];
        if (field === 'price' || field === 'sqm') {
            updated[index] = {
                ...updated[index],
                [field]: newValue === '' ? null : Number(newValue),
            };
        } else {
            updated[index] = { ...updated[index], [field]: newValue };
        }
        setComparables(updated);
        onChange(updated);
    };

    const addComparable = () => {
        const newComparable: ComparableProperty = {
            address: '',
            price: 0,
            sqm: null,
            date: new Date().toISOString().split('T')[0],
            source: '',
        };
        const updated = [...comparables, newComparable];
        setComparables(updated);
        onChange(updated);
    };

    const removeComparable = (index: number) => {
        const updated = comparables.filter((_, i) => i !== index);
        setComparables(updated);
        onChange(updated);
    };

    return (
        <div className="comparable-properties-input">
            <div className="input-header">
                <h4>Propiedades Comparables</h4>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addComparable}
                    disabled={disabled}
                >
                    <Plus size={14} /> Agregar
                </Button>
            </div>

            {comparables.length === 0 && (
                <div className="empty-comparables">
                    <p>No hay propiedades comparables. Agrega al menos una para el análisis.</p>
                </div>
            )}

            <div className="comparables-list">
                {comparables.map((comp, index) => (
                    <div key={index} className="comparable-row">
                        <button
                            type="button"
                            className="drag-handle"
                            disabled={disabled}
                            aria-label="Reordenar"
                        >
                            <GripVertical size={16} />
                        </button>

                        <div className="comparable-fields">
                            <div className="field">
                                <label>Dirección *</label>
                                <input
                                    type="text"
                                    placeholder="Calle 123, Ciudad"
                                    value={comp.address}
                                    onInput={(e) =>
                                        updateComparable(
                                            index,
                                            'address',
                                            (e.currentTarget as HTMLInputElement).value,
                                        )
                                    }
                                    disabled={disabled}
                                    required
                                />
                            </div>

                            <div className="field">
                                <label>Precio *</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    placeholder="150000"
                                    value={comp.price ?? ''}
                                    onInput={(e) =>
                                        updateComparable(
                                            index,
                                            'price',
                                            (e.currentTarget as HTMLInputElement).value,
                                        )
                                    }
                                    disabled={disabled}
                                    required
                                />
                            </div>

                            <div className="field">
                                <label>m²</label>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="80"
                                    value={comp.sqm ?? ''}
                                    onInput={(e) =>
                                        updateComparable(
                                            index,
                                            'sqm',
                                            (e.currentTarget as HTMLInputElement).value,
                                        )
                                    }
                                    disabled={disabled}
                                />
                            </div>

                            <div className="field">
                                <label>Fecha *</label>
                                <input
                                    type="date"
                                    value={comp.date}
                                    onInput={(e) =>
                                        updateComparable(
                                            index,
                                            'date',
                                            (e.currentTarget as HTMLInputElement).value,
                                        )
                                    }
                                    disabled={disabled}
                                    required
                                />
                            </div>

                            <div className="field">
                                <label>Fuente</label>
                                <input
                                    type="text"
                                    placeholder="Zillow, ML, Propietario, etc."
                                    value={comp.source ?? ''}
                                    onInput={(e) =>
                                        updateComparable(
                                            index,
                                            'source',
                                            (e.currentTarget as HTMLInputElement).value,
                                        )
                                    }
                                    disabled={disabled}
                                />
                            </div>
                        </div>

                        <IconButton
                            type="button"
                            variant="danger"
                            className="comparable-remove"
                            onClick={() => removeComparable(index)}
                            disabled={disabled || comparables.length === 1}
                            aria-label="Eliminar comparable"
                        >
                            <Trash2 size={14} />
                        </IconButton>
                    </div>
                ))}
            </div>

            {comparables.length > 0 && (
                <div className="comparable-summary">
                    <p>
                        {comparables.length} comparable{comparables.length !== 1 ? 'es' : ''} -
                        Precio promedio: $
                        {(
                            comparables.reduce((sum, c) => sum + (c.price ?? 0), 0) /
                            comparables.length
                        ).toLocaleString('es-AR')}
                        {comparables.some((c) => c.sqm) && (
                            <>
                                {' | '}
                                Precio promedio m²: $
                                {(
                                    comparables
                                        .filter((c) => c.sqm)
                                        .reduce(
                                            (sum, c) => sum + (c.price ?? 0) / (c.sqm ?? 1),
                                            0,
                                        ) / comparables.filter((c) => c.sqm).length
                                ).toLocaleString('es-AR')}
                            </>
                        )}
                    </p>
                </div>
            )}
        </div>
    );
}
