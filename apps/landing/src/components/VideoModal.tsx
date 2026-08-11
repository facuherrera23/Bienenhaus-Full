// apps/landing/src/components/VideoModal.tsx
import { useEffect, useState } from 'preact/hooks';
import styles from './VideoModal.module.css';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId?: string;
  title?: string;
}

export function VideoModal({ isOpen, onClose, videoId = 'dQw4w9WgXcQ', title = 'Video' }: VideoModalProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsLoading(true);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.videoModalOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Video modal"
    >
      <div
        className={styles.videoModal}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={styles.videoModalClose}
          onClick={onClose}
          aria-label="Cerrar video"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {title && <h3 className={styles.videoModalTitle}>{title}</h3>}

        <div className={styles.videoModalWrapper}>
          {isLoading && (
            <div className={styles.videoModalLoader}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                <path d="M20 2C30.5 2 38 9.5 38 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <animate attributeName="d" dur="1s" repeatCount="indefinite"
                    values="M20 2C30.5 2 38 9.5 38 20;M20 2C9.5 2 2 9.5 2 20;M20 2C30.5 2 38 9.5 38 20"/>
                </path>
              </svg>
            </div>
          )}
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            allow="autoplay; encrypted-media"
            allowFullScreen
            title={title}
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </div>
    </div>
  );
}