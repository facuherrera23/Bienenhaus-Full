import { X } from 'lucide-preact';

interface ImageLightboxProps {
  image: { url: string; name: string } | null;
  onClose: () => void;
}

export const ImageLightbox = ({ image, onClose }: ImageLightboxProps) => {
  if (!image) return null;
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-container modal--medium" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>
        <div className="modal-content">
          <img src={image.url} alt={image.name} style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '8px' }} />
          <p style={{ marginTop: '12px', textAlign: 'center', color: 'var(--bh-text-tertiary)' }}>{image.name}</p>
        </div>
      </div>
    </div>
  );
};