// apps/admin/src/components/TableRow.tsx
import { useRef, useState } from 'preact/hooks';

interface TableRowProps {
    children: preact.ComponentChildren;
    className?: string;
    selected?: boolean;
    clickable?: boolean;
    onClick?: () => void;
    selectable?: boolean;
    selectedProp?: boolean;
    onSelect?: (selected: boolean) => void;
}

export function TableRow({
    children,
    className = '',
    selected = false,
    clickable = false,
    onClick,
    selectable = false,
    selectedProp = false,
    onSelect,
}: TableRowProps) {
    const [isSelected, setIsSelected] = useState(selectedProp || selected);
    const rowRef = useRef<HTMLTableRowElement>(null);

    const handleClick = (e: MouseEvent) => {
        // No hacer nada si se clickeó un checkbox, botón o enlace
        const target = e.target as HTMLElement;
        if (target.closest('input,button,a,select')) return;

        if (clickable && onClick) {
            onClick();
        }
    };

    const handleSelect = (checked: boolean) => {
        setIsSelected(checked);
        if (onSelect) {
            onSelect(checked);
        }
    };

    const rowClassName = [className, clickable ? 'row-click' : '', isSelected ? 'selected' : '']
        .filter(Boolean)
        .join(' ');

    return (
        <tr ref={rowRef} className={rowClassName} onClick={handleClick} data-selected={isSelected}>
            {selectable && (
                <td>
                    <input
                        type="checkbox"
                        className="table-checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelect((e.target as HTMLInputElement).checked)}
                        onClick={(e) => e.stopPropagation()}
                    />
                </td>
            )}
            {children}
        </tr>
    );
}
