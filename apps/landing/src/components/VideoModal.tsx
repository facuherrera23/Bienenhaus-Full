import { useEffect, useRef, useState } from 'preact/hooks';
import { X, Loader2 } from 'lucide-preact';

export interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
}

export function VideoModal({ isOpen, onClose, videoUrl, title }: VideoModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      document.body.style.overflow = 'hidden';
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleKey);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleKey);
      };
    }
  }, [isOpen, onClose]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const getEmbedUrl = (url: string): string => {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    
    // Vimeo
    const vmMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
    if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}?autoplay=1`;
    
    // Fallback: assume it's already an embed URL
    return url;
  };

  if (!isOpen) return null;

  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <div
      className="video-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
    >
      <div className="video-modal" onClick={(e) => e.stopPropagation()} ref={modalRef}>
        <button
          className="video-modal-close"
          onClick={onClose}
          aria-label="Cerrar video"
        >
          <X className="icon" aria-hidden="true" />
        </button>
        {title && <h2 id="video-modal-title" className="video-modal-title">{title}</h2>}
        <div className="video-modal-wrapper">
          {isLoading && <div className="video-modal-loader"><Loader2 className="icon spin" aria-hidden="true" /></div>}
          <iframe
            ref={iframeRef}
            src={embedUrl}
            title={title || 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onLoad={handleIframeLoad}
          />
        </div>
      </div>
    </div>
  );
}