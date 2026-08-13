import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { ChevronRight, type LucideIcon, Search, X } from 'lucide-preact';
import styles from './CommandPalette.module.css';

interface CommandItem {
    id: string;
    label: string;
    description?: string;
    icon?: LucideIcon;
    keywords?: string[];
    action: () => void;
    section?: string;
}

interface CommandPaletteProps {
    items: CommandItem[];
    isOpen: boolean;
    onClose: () => void;
    placeholder?: string;
}

export function CommandPalette({
    items,
    isOpen,
    onClose,
    placeholder = 'Buscar comandos...',
}: CommandPaletteProps) {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter items based on query
    const filteredItems = items
        .filter((item) => {
            if (!query) return true;
            const q = query.toLowerCase();
            return (
                item.label.toLowerCase().includes(q) ||
                item.description?.toLowerCase().includes(q) ||
                item.keywords?.some((k) => k.toLowerCase().includes(q))
            );
        })
        .slice(0, 8);

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [isOpen]);

    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredItems[selectedIndex]) {
                    filteredItems[selectedIndex].action();
                    onClose();
                }
                break;
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
        }
    };

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className={styles['command-palette-overlay']}
            onClick={onClose}
            data-testid="command-palette-overlay"
        >
            <div className={styles['command-palette']} onClick={(e) => e.stopPropagation()}>
                <div className={styles['command-palette-input-wrapper']}>
                    <Search size={18} className={styles['command-palette-search-icon']} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.currentTarget.value)}
                        placeholder={placeholder}
                        className={styles['command-palette-input']}
                        onKeyDown={handleKeyDown}
                    />
                    <kbd className={styles['command-palette-shortcut']}>⌘K</kbd>
                </div>

                {filteredItems.length > 0 ? (
                    <ul className={styles['command-palette-list']} role="listbox">
                        {filteredItems.map((item, index) => (
                            <li
                                key={item.id}
                                className={`${styles['command-palette-item']}${index === selectedIndex ? ` ${styles['selected']}` : ''}`}
                                role="option"
                                aria-selected={index === selectedIndex}
                                onClick={() => {
                                    item.action();
                                    onClose();
                                }}
                            >
                                {item.icon && (
                                    <item.icon
                                        size={16}
                                        className={styles['command-palette-item-icon']}
                                    />
                                )}
                                <div className={styles['command-palette-item-content']}>
                                    <span className={styles['command-palette-item-label']}>
                                        {item.label}
                                    </span>
                                    {item.description && (
                                        <span
                                            className={styles['command-palette-item-description']}
                                        >
                                            {item.description}
                                        </span>
                                    )}
                                </div>
                                {item.section && (
                                    <span className={styles['command-palette-item-section']}>
                                        {item.section}
                                    </span>
                                )}
                                {index === selectedIndex && (
                                    <ChevronRight
                                        size={14}
                                        className={styles['command-palette-selected-indicator']}
                                    />
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className={styles['command-palette-empty']}>
                        <X size={24} />
                        <p>No se encontraron comandos</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Hook para usar la paleta de comandos globalmente
export function useCommandPalette() {
    const [isOpen, setIsOpen] = useState(false);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                toggle();
            }
            if (e.key === 'Escape') {
                close();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [toggle, close]);

    return { isOpen, open, close, toggle };
}
