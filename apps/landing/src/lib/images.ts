/**
 * Imágenes del proyecto.
 *
 * Punto único de referencia para las imágenes. Cuando dejés archivos en
 * `assets/images/`, este archivo es el único que hay que tocar para
 * apuntar cada slot a la imagen local.
 */
import heroBaner from '../../../../assets/images/hero/hero-baner.png';
import logoMain from '../../../../assets/images/logos/logo-bienenhaus.png';
import logoIcon from '../../../../assets/images/logos/pwa-512x512.png';
import favicon from '../../../../assets/images/logos/favicon.ico';

export const images = {
  heroBg: heroBaner,
  logo: logoMain,
  logoIcon,
  favicon,
  team: {
    maria: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=500&fit=crop&crop=center',
    juan: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=500&fit=crop&crop=center',
  },
} as const;
