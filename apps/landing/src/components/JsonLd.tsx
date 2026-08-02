import { useEffect } from 'preact/hooks';
import { useSiteContent } from '../lib/content';

interface JsonLdProps {
  type: 'WebSite' | 'Organization' | 'RealEstateAgent' | 'Property';
  data: Record<string, any>;
}

export function JsonLd({ type, data }: JsonLdProps) {
  useEffect(() => {
    const existing = document.querySelector(`script[data-schema-type="${type}"]`);
    if (existing) existing.remove();

    const schema = {
      '@context': 'https://schema.org',
      '@type': type,
      ...data,
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema-type', type);
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const el = document.querySelector(`script[data-schema-type="${type}"]`);
      if (el) el.remove();
    };
  }, [type, data]);

  return null;
}

function getVal(settings: Record<string, any>, key: string, fallback: string): string {
  const val = settings[key];
  if (!val) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val.value) return val.value;
  return fallback;
}

export function WebSiteSchema() {
  const { settings } = useSiteContent();

  return (
    <JsonLd
      type="WebSite"
      data={{
        name: getVal(settings, 'site_name', 'BIENENHAUS PROPIEDADES'),
        url: 'https://bienenhaus.com.ar',
        description: 'Selección premium de propiedades exclusivas en las mejores zonas. Asesoramiento personalizado en cada paso.',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://bienenhaus.com.ar/catalogo?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      }}
    />
  );
}

export function OrganizationSchema() {
  const { settings } = useSiteContent();
  return (
    <JsonLd
      type="Organization"
      data={{
        '@type': 'RealEstateAgent',
        name: getVal(settings, 'site_name', 'BIENENHAUS PROPIEDADES'),
        url: 'https://bienenhaus.com.ar',
        logo: 'https://bienenhaus.com.ar/logo-bienenhaus.png',
        telephone: '+54 9 3516 37-9651',
        email: 'bienenhaus.propiedades@gmail.com',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Córdoba',
          addressCountry: 'AR',
        },
        sameAs: [
          'https://instagram.com/bienenhaus.prop',
          'https://facebook.com/Bienenhaus.prop',
          'https://www.youtube.com/@BienenhausPropiedades',
          'https://www.tiktok.com/@bienenhaus.prop',
          'https://www.linkedin.com/company/bienenhaus',
        ].filter(Boolean),
      }}
    />
  );
}

export function RealEstateAgencySchema() {
  return (
    <JsonLd
      type="RealEstateAgent"
      data={{
        '@type': 'RealEstateAgent',
        name: 'BIENENHAUS PROPIEDADES',
        url: 'https://bienenhaus.com.ar',
        telephone: '+54 9 3516 37-9651',
        email: 'bienenhaus.propiedades@gmail.com',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Córdoba, Argentina',
          addressLocality: 'Córdoba',
          addressRegion: 'Córdoba',
          addressCountry: 'AR',
        },
        priceRange: '$$$',
        currenciesAccepted: 'ARS, USD',
        paymentAccepted: 'Cash, Credit Card, Bank Transfer',
        areaServed: {
          '@type': 'City',
          name: 'Córdoba',
        },
      }}
    />
  );
}