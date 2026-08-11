// apps/landing/src/components/JsonLd.tsx

export function WebSiteSchema() {
  return (
    <script type="application/ld+json">
      {JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'BIENENHAUS PROPIEDADES',
        url: 'https://bienenhaus.com.ar',
        description: 'Selección premium de propiedades exclusivas en las mejores zonas. Asesoramiento personalizado en cada paso.',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://bienenhaus.com.ar/catalogo?q={search_term_string}'
          },
          'query-input': 'required name=search_term_string'
        }
      })}
    </script>
  );
}

export function OrganizationSchema() {
  return (
    <script type="application/ld+json">
      {JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        name: 'BIENENHAUS PROPIEDADES',
        url: 'https://bienenhaus.com.ar',
        logo: 'https://bienenhaus.com.ar/logo-bienenhaus.png',
        telephone: '+54 9 3516 37-9651',
        email: 'bienenhaus.propiedades@gmail.com',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Córdoba, Argentina',
          addressLocality: 'Córdoba',
          addressRegion: 'Córdoba',
          addressCountry: 'AR'
        },
        priceRange: '$$$',
        currenciesAccepted: 'ARS, USD',
        paymentAccepted: 'Cash, Credit Card, Bank Transfer',
        areaServed: {
          '@type': 'City',
          name: 'Córdoba'
        },
        sameAs: [
          'https://instagram.com/bienenhaus.prop',
          'https://facebook.com/Bienenhaus.prop',
          'https://www.youtube.com/@BienenhausPropiedades',
          'https://www.tiktok.com/@bienenhaus.prop',
          'https://www.linkedin.com/company/bienenhaus'
        ]
      })}
    </script>
  );
}

export function RealEstateAgencySchema() {
  return (
    <script type="application/ld+json">
      {JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        name: 'BIENENHAUS PROPIEDADES',
        url: 'https://bienenhaus.com.ar',
        logo: 'https://bienenhaus.com.ar/logo-bienenhaus.png',
        telephone: '+54 9 3516 37-9651',
        email: 'bienenhaus.propiedades@gmail.com',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Córdoba, Argentina',
          addressLocality: 'Córdoba',
          addressRegion: 'Córdoba',
          addressCountry: 'AR'
        },
        priceRange: '$$$',
        currenciesAccepted: 'ARS, USD',
        paymentAccepted: 'Cash, Credit Card, Bank Transfer',
        areaServed: {
          '@type': 'City',
          name: 'Córdoba'
        },
        sameAs: [
          'https://instagram.com/bienenhaus.prop',
          'https://facebook.com/Bienenhaus.prop',
          'https://www.youtube.com/@BienenhausPropiedades',
          'https://www.tiktok.com/@bienenhaus.prop',
        ]
      })}
    </script>
  );
}