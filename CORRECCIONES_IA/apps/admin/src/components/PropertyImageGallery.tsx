import { useEffect, useRef, useState } from 'preact/hooks';
import { Loader2, Move, Star, Trash2, Upload } from 'lucide-preact';
import {
    deletePropertyImage,
    fetchPropertyImages,
    type PropertyImage,
    reorderPropertyImages,
    setPropertyCover,
    uploadPropertyImages,
} from '../lib/properties';
import { pushToast } from '../store/app';
import styles from './PropertyImageGallery.module.css';


interface ImageGalleryProps {
    propertyId: string | null;
    isNew: boolean;
    onImagesChange?: (images: PropertyImage[]) => void;
}

export function PropertyImageGallery({ propertyId, isNew, onImagesChange }: ImageGalleryProps) {
    const [images, setImages] = useState<PropertyImage[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const galleryRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        if (!propertyId || isNew) {
            setImages([]);
            setFocusedIndex(-1);
            return;
        }
        loadImages();
    }, [propertyId, isNew]);

    const loadImages = async () => {
        if (!propertyId) return;
        setLoading(true);
        try {
            const data = await fetchPropertyImages(propertyId);
            setImages(data);
            onImagesChange?.(data);
        } catch {
            pushToast({ type: 'error', title: 'No se pudieron cargar las imágenes' });
        } finally {
            setLoading(false);
        }
    };

    const handleFiles = async (files: FileList | File[]) => {
        if (!propertyId) {
            pushToast({ type: 'error', title: 'Primero guardá la propiedad' });
            return;
        }
        const fileArray = Array.from(files);
        if (fileArray.length === 0) return;

        // Validar tipos y tamaños
        const validFiles = fileArray.filter((f) => {
            if (!f.type.startsWith('image/')) {
                pushToast({ type: 'error', title: `${f.name}: no es una imagen` });
                return false;
            }
            if (f.size > 10 * 1024 * 1024) {
                pushToast({ type: 'error', title: `${f.name}: supera 10 MB` });
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        setUploading(true);
        try {
            const newImages = await uploadPropertyImages(propertyId, validFiles);
            setImages((prev) => {
                const updated = [...prev, ...newImages];
                onImagesChange?.(updated);
                return updated;
            });
            pushToast({
                type: 'success',
                title: `${newImages.length} imagen${newImages.length === 1 ? '' : 'es'} subida${newImages.length === 1 ? '' : 's'}`,
            });
        } catch {
            pushToast({ type: 'error', title: 'Error subiendo imágenes' });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Solo salir si realmente salimos del contenedor
        if (!galleryRef.current?.contains(e.relatedTarget as Node)) {
            setDragOver(false);
        }
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        if (e.dataTransfer?.files.length) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleFileInput = (e: Event) => {
        const input = e.currentTarget as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            handleFiles(input.files);
        }
    };

    const handleDelete = async (imageId: string) => {
        if (!propertyId) return;
        try {
            await deletePropertyImage(imageId);
            setImages((prev) => {
                const updated = prev.filter((i) => i.id !== imageId);
                onImagesChange?.(updated);
                return updated;
            });
            pushToast({ type: 'success', title: 'Imagen eliminada' });
        } catch {
            pushToast({ type: 'error', title: 'No se pudo eliminar' });
        }
    };

    const handleSetCover = async (imageId: string) => {
        if (!propertyId) return;
        try {
            await setPropertyCover(propertyId, imageId);
            setImages((prev) => {
                const updated = prev.map((i) => ({ ...i, is_cover: i.id === imageId }));
                onImagesChange?.(updated);
                return updated;
            });
            pushToast({ type: 'success', title: 'Portada actualizada' });
        } catch {
            pushToast({ type: 'error', title: 'No se pudo actualizar portada' });
        }
    };

    // Keyboard accessibility handlers
    const handleKeyDown = (e: KeyboardEvent, index: number) => {
        const maxIndex = images.length - 1;
        
        // Ctrl/Cmd + flecha reordena la imagen; flecha sola solo mueve el foco
        if ((e.ctrlKey || e.metaKey) && (e.key === 'ArrowRight' || e.key === 'ArrowDown')) {
            e.preventDefault();
            moveImage(index, 'next');
            return;
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'ArrowLeft' || e.key === 'ArrowUp')) {
            e.preventDefault();
            moveImage(index, 'prev');
            return;
        }

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex(Math.min(index + 1, images.length - 1));
                itemRefs.current[index + 1]?.focus();
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex(Math.max(index - 1, 0));
                itemRefs.current[index - 1]?.focus();
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (images[index]) {
                    handleSetCover(images[index].id);
                }
                break;
            case 'Delete':
            case 'Backspace':
                e.preventDefault();
                if (images[index]) {
                    handleDelete(images[index].id);
                }
                break;
            case 'Home':
                e.preventDefault();
                setFocusedIndex(0);
                itemRefs.current[0]?.focus();
                break;
            case 'End':
                e.preventDefault();
                setFocusedIndex(maxIndex);
                itemRefs.current[maxIndex]?.focus();
                break;
        }
    };

    const moveImage = (index: number, direction: 'prev' | 'next') => {
        if (direction === 'prev' && index > 0) {
            const newOrder = [...images];
            const [moved] = newOrder.splice(index, 1);
            newOrder.splice(index - 1, 0, moved);
            reorderAndUpdate(newOrder);
            setFocusedIndex(index - 1);
        } else if (direction === 'next' && index < images.length - 1) {
            const newOrder = [...images];
            const [moved] = newOrder.splice(index, 1);
            newOrder.splice(index + 1, 0, moved);
            reorderAndUpdate(newOrder);
            setFocusedIndex(index + 1);
        }
    };

    const reorderAndUpdate = async (newOrder: PropertyImage[]) => {
        if (!propertyId) return;
        try {
            await reorderPropertyImages(propertyId, newOrder.map((i) => i.id));
            setImages(newOrder);
            onImagesChange?.(newOrder);
        } catch {
            pushToast({ type: 'error', title: 'No se pudo reordenar' });
            loadImages(); // revert
        }
    };

    const handleDragStart = (e: DragEvent, id: string) => {
        setDraggedId(id);
        if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOverItem = (e: DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    };

    const handleDropItem = (e: DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedId || draggedId === targetId) {
            setDraggedId(null);
            return;
        }
        setImages((prev) => {
            const newOrder = [...prev];
            const fromIndex = newOrder.findIndex((i) => i.id === draggedId);
            const toIndex = newOrder.findIndex((i) => i.id === targetId);
            if (fromIndex === -1 || toIndex === -1) return prev;
            const [moved] = newOrder.splice(fromIndex, 1);
            newOrder.splice(toIndex, 0, moved);
            // Actualizar positions en BD
            reorderPropertyImages(
                propertyId!,
                newOrder.map((i) => i.id),
            ).catch(() => {
                pushToast({ type: 'error', title: 'No se pudo reordenar' });
                loadImages(); // revert
            });
            onImagesChange?.(newOrder);
            return newOrder;
        });
        setDraggedId(null);
    };

    const handleDragEnd = () => {
        setDraggedId(null);
    };

    return (
        <section className="form-section">
            <div className="form-section-head">
                <h3>Galería de imágenes</h3>
                <p>
                    Arrastra para reordenar. La primera imagen es la portada. Click en la estrella
                    para cambiar portada.
                    <br />
                    <small>
                        JPG, PNG, WebP · máx 10 MB · se convierten a WebP automáticamente
                    </small>
                    <br />
                    <small className="muted">
                        Navegación: ←/→ para moverse, Ctrl+←/→ para reordenar, Enter/Space = portada, Delete = eliminar, Home/End = primero/último
                    </small>
                </p>
            </div>

            <div
                ref={galleryRef}
                className={`${styles['image-gallery-dropzone']}${dragOver ? ` ${styles['drag-over']}` : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                role="list"
                aria-label="Galería de imágenes de la propiedad"
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileInput}
                    hidden
                    id="property-images-input"
                />

                {loading ? (
                    <div className={styles['image-gallery-grid']} aria-busy="true" aria-live="polite" role="list">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div className="image-gallery-skeleton" key={i} role="listitem">
                                <div className="image-gallery-skeleton-thumb" />
                                <div className="image-gallery-skeleton-bar" />
                                <div className="image-gallery-skeleton-bar image-gallery-skeleton-bar--short" />
                            </div>
                        ))}
                    </div>
                ) : images.length === 0 ? (
                    <div className={styles['gallery-empty']} onClick={() => fileInputRef.current?.click()} role="listitem">
                        <div className="gallery-empty-icon">
                            <Upload size={48} strokeWidth={1.5} />
                        </div>
                        <p className="gallery-empty-title">Subí las fotos de la propiedad</p>
                        <p className="gallery-empty-hint">
                            Arrastrá y soltá aquí, o hacé click para elegir archivos
                        </p>
                        <button type="button" className="btn btn--secondary btn--sm">
                            <Upload size={15} /> Seleccionar archivos
                        </button>
                    </div>
                ) : (
                    <div className={styles['image-gallery-grid']} role="list">
                        {images.map((img, index) => (
                            <div
                                key={img.id}
                                ref={(el) => { itemRefs.current[index] = el; }}
                                className={`${styles['image-gallery-item']}${img.is_cover ? ' is-cover' : ''}${draggedId === img.id ? ` ${styles['dragging']}` : ''}${focusedIndex === index ? ` ${styles['focused']}` : ''}`}
                                draggable={true}
                                onDragStart={(e) => handleDragStart(e, img.id)}
                                onDragOver={handleDragOverItem}
                                onDrop={(e) => handleDropItem(e, img.id)}
                                onDragEnd={handleDragEnd}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                tabIndex={0}
                                role="listitem"
                                aria-label={`Imagen ${index + 1}${img.is_cover ? ' (portada actual)' : ''}`}
                                aria-roledescription="imagen de galería"
                            >
                                <div className={styles['image-thumb']}>
                                    <img
                                        src={img.url}
                                        alt={img.alt ?? `Imagen ${index + 1}`}
                                        loading="lazy"
                                    />
                                    {uploading && <Loader2 size={20} className="spin" />}
                                </div>
                                <div className={styles['image-actions']}>
                                    <button
                                        type="button"
                                        className={`${styles['image-action-btn']}${img.is_cover ? ' active' : ''}`}
                                        onClick={() => handleSetCover(img.id)}
                                        title={
                                            img.is_cover
                                                ? 'Es la portada (Enter/Space para cambiar)'
                                                : 'Establecer como portada (Enter/Space)'
                                        }
                                        disabled={uploading}
                                        aria-label={img.is_cover ? 'Es la portada actual' : 'Establecer como portada'}
                                        aria-pressed={img.is_cover}
                                    >
                                        <Star
                                            size={16}
                                            fill={img.is_cover ? 'currentColor' : 'none'}
                                            aria-hidden="true"
                                        />
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles['image-action-btn']} danger`}
                                        onClick={() => handleDelete(img.id)}
                                        title="Eliminar (Delete/Backspace)"
                                        disabled={uploading}
                                        aria-label="Eliminar imagen"
                                    >
                                        <Trash2 size={16} aria-hidden="true" />
                                    </button>
                                </div>
                                <div
                                    className="image-drag-handle"
                                    title="Arrastrar para reordenar (←/→ para mover)"
                                    aria-hidden="true"
                                >
                                    <Move size={14} />
                                </div>
                                <div className={styles['image-position']}>
                                    <span>{index + 1}</span>
                                </div>
                                {img.is_cover && <span className={styles['cover-badge']}>PORTADA</span>}
                            </div>
                        ))}
                    </div>
                )}

                {images.length > 0 && !loading && (
                    <div className={styles['gallery-footer']}>
                        <label
                            htmlFor="property-images-input"
                            className="btn btn--secondary btn--sm"
                        >
                            <Upload size={15} /> Agregar más
                        </label>
                        <span className="gallery-count-badge">
                            {images.length} imagen{images.length === 1 ? '' : 'es'}
                        </span>
                    </div>
                )}
            </div>
        </section>
    );
}