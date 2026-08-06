import { useEffect, useRef, useState } from 'preact/hooks';
import { Loader2, Trash2, Move, Star, Upload } from 'lucide-preact';
import {
  fetchPropertyImages,
  uploadPropertyImages,
  deletePropertyImage,
  setPropertyCover,
  reorderPropertyImages,
  type PropertyImage,
} from '../lib/properties';
import { pushToast } from '../store/app';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!propertyId || isNew) {
      setImages([]);
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
      pushToast({ type: 'success', title: `${newImages.length} imagen${newImages.length === 1 ? '' : 'es'} subida${newImages.length === 1 ? '' : 's'}` });
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
      reorderPropertyImages(propertyId!, newOrder.map((i) => i.id)).catch(() => {
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
          Arrastra para reordenar. La primera imagen es la portada. Click en la estrella para cambiar portada.
          <br />
          <small>JPG, PNG, WebP · máx 10 MB · se convierten a WebP automáticamente</small>
        </p>
      </div>

      <div
        ref={galleryRef}
        className={`image-gallery-dropzone${dragOver ? ' drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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
          <div className="gallery-loading">
            <Loader2 size={24} className="spin" />
            <span>Cargando imágenes…</span>
          </div>
        ) : images.length === 0 ? (
          <div className="gallery-empty" onClick={() => fileInputRef.current?.click()}>
            <Upload size={48} />
            <p>Arrastra imágenes aquí o haz click para seleccionar</p>
            <button type="button" className="btn btn--secondary btn--sm">
              Seleccionar archivos
            </button>
          </div>
        ) : (
          <div className="image-gallery-grid">
            {images.map((img, index) => (
              <div
                key={img.id}
                className={`image-gallery-item${img.is_cover ? ' is-cover' : ''}${draggedId === img.id ? ' dragging' : ''}`}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, img.id)}
                onDragOver={handleDragOverItem}
                onDrop={(e) => handleDropItem(e, img.id)}
                onDragEnd={handleDragEnd}
              >
                <div className="image-thumb">
                  <img src={img.url} alt={img.alt ?? `Imagen ${index + 1}`} loading="lazy" />
                  {uploading && <Loader2 size={20} className="spin" />}
                </div>
                <div className="image-actions">
                  <button
                    type="button"
                    className={`image-action-btn${img.is_cover ? ' active' : ''}`}
                    onClick={() => handleSetCover(img.id)}
                    title={img.is_cover ? 'Es la portada' : 'Establecer como portada'}
                    disabled={uploading}
                  >
                    <Star size={16} fill={img.is_cover ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    className="image-action-btn danger"
                    onClick={() => handleDelete(img.id)}
                    title="Eliminar"
                    disabled={uploading}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="image-position">
                  <Move size={14} />
                  <span>{index + 1}</span>
                </div>
                {img.is_cover && <span className="cover-badge">PORTADA</span>}
              </div>
            ))}
          </div>
        )}

        {images.length > 0 && !loading && (
          <div className="gallery-footer">
            <label htmlFor="property-images-input" className="btn btn--secondary">
              <Upload size={15} /> Agregar más
            </label>
            <span className="gallery-count">{images.length} imagen{images.length === 1 ? '' : 'es'}</span>
          </div>
        )}
      </div>
    </section>
  );
}