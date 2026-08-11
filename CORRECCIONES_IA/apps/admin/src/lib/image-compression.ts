import imageCompression from 'browser-image-compression';

export interface ThumbnailConfig {
    width: number;
    suffix: string;
    quality: number;
}

export interface ThumbnailFile {
    file: File;
    width: number;
    suffix: string;
    originalName: string;
}

export interface CompressionOptions {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
    fileType?: string;
}

export interface ThumbnailFile {
    file: File;
    width: number;
    suffix: string;
    originalName: string;
}

export interface CompressedThumbnail {
    file: File;
    width: number;
    suffix: string;
    originalName: string;
    size: number;
}

export interface CompressionOptions {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
    fileType?: string;
}

/**
 * Comprime un archivo a un tamaño específico
 */
export async function compressToSize(
    file: File,
    targetWidth: number,
    _quality: number = 0.8,
): Promise<File> {
    const compressedFile = await imageCompression(file, {
        maxWidthOrHeight: targetWidth,
        fileType: 'image/webp',
        initialQuality: 0.8,
    });

    // Generar nombre con sufijo de ancho
    const extension = 'webp';
    const newName = `${file.name.replace(/\.[^/.]+$/, '')}-${targetWidth}.${extension}`;

    return new File([compressedFile], newName, {
        type: `image/${extension}`,
        lastModified: Date.now(),
    });
}

/**
 * Genera los 3 thumbnails (400, 800, 1200px) a partir de un archivo original
 */
export async function generateThumbnails(
    file: File,
    configs: readonly ThumbnailConfig[] = THUMBNAIL_CONFIGS,
): Promise<File[]> {
    const thumbnails: File[] = [];

    for (const config of configs) {
        const compressed = await compressToSize(file, config.width, config.quality);
        thumbnails.push(compressed);
    }

    return thumbnails;
}

/**
 * Genera thumbnails con información adicional para tracking
 */
export async function generateThumbnailsWithMeta(
    file: File,
    configs: readonly ThumbnailConfig[] = THUMBNAIL_CONFIGS,
): Promise<Array<{ file: File; width: number; suffix: string }>> {
    const results = [];

    for (const config of configs) {
        const compressed = await compressToSize(file, config.width, config.quality);
        results.push({
            file: compressed,
            width: config.width,
            suffix: config.suffix,
        });
    }

    return results;
}

/**
 * Valida que el archivo sea una imagen válida
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
    // Validar tipo MIME
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!validTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Formato no soportado. Use JPG, PNG, WEBP o HEIC.',
        };
    }

    // Validar tamaño (max 20MB original)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
        return {
            valid: false,
            error: 'El archivo supera el límite de 20MB.',
        };
    }

    return { valid: true };
}

/**
 * Formatea bytes a string legible
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Genera nombre de archivo para thumbnail
 */
export function generateThumbnailName(
    _originalName: string,
    width: number,
    extension: string = 'webp',
): string {
    return `${width}.${extension}`;
}

/**
 * Estima el tamaño final después de compresión
 */
export function estimateCompressedSize(
    originalSize: number,
    targetWidth: number,
    _quality: number = 0.8,
): number {
    // Estimación aproximada basada en ratio típico de compresión WebP
    const compressionRatio = 0.15 * 0.8; // ~15% del tamaño original a quality 0.8
    return Math.round(originalSize * compressionRatio * (targetWidth / 1200));
}

/**
 * Valida que el navegador soporte WebP
 */
export function supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Obtiene MIME type para WebP con fallback
 */
export function getWebPMimeType(): string {
    return supportsWebP() ? 'image/webp' : 'image/jpeg';
}

export const THUMBNAIL_CONFIGS = [
    { width: 400, suffix: '400', quality: 0.7 },
    { width: 800, suffix: '800', quality: 0.8 },
    { width: 1200, suffix: '1200', quality: 0.85 },
] as const;
