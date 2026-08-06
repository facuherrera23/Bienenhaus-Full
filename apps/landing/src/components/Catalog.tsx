import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { useReveal } from '../hooks/useReveal';
import { textOf, useSiteContent } from '../lib/content';
import { PropertyCard } from './PropertyCard';
import { PropertyModal } from './PropertyModal';
import { useProperties, type PropertyCardData } from '../lib/supabase-data';
import { Suspense } from 'preact/compat';
import {
  Search,
  ChevronDown,
  ArrowRight,
  Grid,
  List,
  Map,
  AlertTriangle,
} from 'lucide-preact';
import styles from '../styles/modules/Catalog.module.css';

type ViewMode = 'grid' | 'list' | 'map';

const SORT_OPTIONS = ['Más recientes', 'Mayor precio', 'Menor precio', 'Mayor superficie', 'Destacadas'];

const PAGE_SIZE = 6;

const PRICE_RANGES: { value: string; label: string; min: number; max: number }[] = [
  { value: '', label: 'Cualquier precio', min: 0, max: Number.POSITIVE_INFINITY },
  { value: 'lt100k', label: 'Hasta USD 100.000', min: 0, max: 100_000 },
  { value: '100-200', label: 'USD 100.000 - 200.000', min: 100_000, max: 200_000 },
  { value: '200-500', label: 'USD 200.000 - 500.000', min: 200_000, max: 500_000 },
  { value: 'gt500', label: 'USD 500.000+', min: 500_000, max: Number.POSITIVE_INFINITY },
];

function priceOf(p: PropertyCardData): number {
  return Number(String(p.price).replace(/[^0-9]/g, '')) || 0;
}

function gridTemplateColumns(view: ViewMode, w: number): string {
  if (view === 'list' || view === 'map') return '1fr';
  if (w <= 768) return '1fr';
  if (w <= 1024) return 'repeat(2, 1fr)';
  return 'repeat(3, 1fr)';
}

export function Catalog() {
  const gridRef = useRef<HTMLDivElement>(null);
  const rootRef = useReveal<HTMLElement>('.property-card', { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  const { content } = useSiteContent();

  const { data: properties, loading, error, refetch } = useProperties();

  // Derive unique locations and types from properties
  const LOCATIONS = useMemo(
    () => ['Todas', ...Array.from(new Set(properties.map((p) => p.location).filter(Boolean)))],
    [properties]
  );
  const FILTERS = useMemo(
    () => ['Todas', ...Array.from(new Set(properties.map((p) => p.type).filter(Boolean)))],
    [properties]
  );

  const section = content.catalogo ?? {};
  const label = textOf(section.label, 'text', 'Encontrá tu próximo hogar');
  const title = textOf(section.title, 'text', 'Propiedades seleccionadas para vos.');
  const description = textOf(
    section.description,
    'text',
    'Explorá una selección exclusiva de propiedades cuidadosamente elegidas en las mejores zonas.',
  );

  const [view, setView] = useState<ViewMode>('grid');
  const [viewportW, setViewportW] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1440,
  );
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [operation, setOperation] = useState('');
  const [location, setLocation] = useState('Todas');
  const [priceRange, setPriceRange] = useState('');
  const [bedroom, setBedroom] = useState(0);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortLabel, setSortLabel] = useState(SORT_OPTIONS[0]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyCardData | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const openModal = (p: PropertyCardData) => setSelectedProperty(p);
  const closeModal = () => setSelectedProperty(null);

  useEffect(() => {
    const onResize = () => setViewportW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const range = PRICE_RANGES.find((r) => r.value === priceRange) ?? PRICE_RANGES[0];
    return properties.filter((p) => {
      if (typeFilter && p.type !== typeFilter) return false;
      if (operation && p.operation !== operation) return false;
      if (location !== 'Todas' && p.location !== location) return false;
      const price = priceOf(p);
      if (price < range.min || price > range.max) return false;
      if (bedroom > 0 && (bedroom === 4 ? p.beds < 4 : p.beds !== bedroom)) return false;
      if (q && !`${p.title} ${p.location} ${p.desc}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [properties, search, operation, location, priceRange, bedroom, typeFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortLabel) {
      case 'Mayor precio':
        arr.sort((a, b) => priceOf(b) - priceOf(a));
        break;
      case 'Menor precio':
        arr.sort((a, b) => priceOf(a) - priceOf(b));
        break;
      case 'Mayor superficie':
        arr.sort((a, b) => b.area - a.area);
        break;
      case 'Destacadas':
        arr.sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false));
        break;
      default:
        break;
    }
    return arr;
  }, [filtered, sortLabel]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filtered, sortLabel]);

  const resetFilters = () => {
    setSearch('');
    setOperation('');
    setLocation('Todas');
    setPriceRange('');
    setBedroom(0);
    setTypeFilter('');
    setSortLabel(SORT_OPTIONS[0]);
    setVisibleCount(PAGE_SIZE);
  };

  const displayed = useMemo(() => sorted.slice(0, visibleCount), [sorted, visibleCount]);
  const hasMore = visibleCount < sorted.length;

  const loadMore = () => setVisibleCount((c) => Math.min(c + PAGE_SIZE, sorted.length));

  const handleSearchRipple = (e: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = styles.ripple;
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  if (loading) {
    return (
      <main className={styles.catalog} id="catalogo" ref={rootRef}>
        <div className="container">
          <header className={styles.catalogHeader}>
            <div className={styles.catalogHeaderLeft}>
              <span className={styles.catalogLabel}>{label}</span>
              <h2 className={styles.catalogTitle}>{title}</h2>
              <p className={styles.catalogDesc}>{description}</p>
            </div>
          </header>
          <div className={styles.catalogLoading}>
            <div className="spinner-large"></div>
            <p>Cargando propiedades...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.catalog} id="catalogo" ref={rootRef}>
        <div className="container">
          <header className={styles.catalogHeader}>
            <div className={styles.catalogHeaderLeft}>
              <span className={styles.catalogLabel}>{label}</span>
              <h2 className={styles.catalogTitle}>{title}</h2>
              <p className={styles.catalogDesc}>{description}</p>
            </div>
          </header>
          <div className={styles.catalogError}>
            <AlertTriangle className={styles.icon} aria-hidden="true" />
            <p>Error cargando propiedades: {error}</p>
            <button className={styles.btnOutline} onClick={refetch}>Reintentar</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className={styles.catalog} id="catalogo" ref={rootRef} aria-label="Catálogo de propiedades">
        <div className="container">
          <header className={styles.catalogHeader}>
            <div className={styles.catalogHeaderLeft}>
              <span className={styles.catalogLabel}>{label}</span>
              <h2 className={styles.catalogTitle}>{title}</h2>
              <p className={styles.catalogDesc}>{description}</p>
            </div>
            <div className={styles.catalogHeaderRight}>
              <button className={styles.btnOutline} onClick={resetFilters}>
                VER TODAS <ArrowRight className={styles.icon} aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className={styles.searchBar}>
            <div className={styles.searchGroup}>
              <label htmlFor="search-input">Buscar</label>
              <div
                className={styles.searchInputWrapper}
                style={{
                  boxShadow: searchFocused ? '0 0 20px rgba(32, 184, 171, 0.08)' : 'none',
                }}
              >
                <Search className={styles.icon} aria-hidden="true" />
                <input
                  id="search-input"
                  type="text"
                  placeholder="Buscar propiedad..."
                  value={search}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  onInput={(e) => setSearch((e.currentTarget as HTMLInputElement).value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const btn = document.getElementById('searchBtn');
                      if (btn) btn.click();
                    }
                  }}
                />
              </div>
            </div>
            <div className={styles.searchGroup}>
              <label htmlFor="operation-select">Operación</label>
              <select id="operation-select" value={operation} onChange={(e) => setOperation((e.currentTarget as HTMLSelectElement).value)}>
                <option value="">Todas</option>
                <option value="venta">Venta</option>
                <option value="alquiler">Alquiler</option>
              </select>
            </div>
            <div className={styles.searchGroup}>
              <label htmlFor="location-select">Ubicación</label>
              <select id="location-select" value={location} onChange={(e) => setLocation((e.currentTarget as HTMLSelectElement).value)}>
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.searchGroup}>
              <label htmlFor="price-select">Precio</label>
              <select id="price-select" value={priceRange} onChange={(e) => setPriceRange((e.currentTarget as HTMLSelectElement).value)}>
                {PRICE_RANGES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.searchGroup}>
              <label>Dormitorios</label>
              <div className={styles.bedroomPills}>
                {['1', '2', '3', '4+'].map((value, i) => {
                  const num = i + 1;
                  return (
                    <button
                      key={value}
                      className={`${styles.pill}${bedroom === num ? ` ${styles.active}` : ''}`}
                      onClick={() => setBedroom((b) => (b === num ? 0 : num))}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
            <button className={styles.btnSearch} id="searchBtn" onClick={handleSearchRipple}>
              BUSCAR <ArrowRight className={styles.icon} aria-hidden="true" />
            </button>
          </div>

          <div className={styles.filtersSection}>
            <div className={styles.filtersPills}>
              {FILTERS.map((value) => (
                <button
                  key={value}
                  className={`${styles.filterPill}${typeFilter === value ? ` ${styles.active}` : ''}`}
                  onClick={() => setTypeFilter((v) => (v === value ? '' : value))}
                >
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </button>
              ))}
            </div>
            <div className={styles.filtersRight}>
              <span className={styles.resultsCount}>
                {sorted.length} {sorted.length === 1 ? 'propiedad' : 'propiedades'}
              </span>
              <div className={styles.dropdownWrapper}>
                <button
                  className={`${styles.dropdownTrigger}${sortOpen ? ` ${styles.open}` : ''}`}
                  id="sortTrigger"
                  onClick={() => setSortOpen((o) => !o)}
                >
                  {sortLabel} <ChevronDown className={styles.icon} aria-hidden="true" />
                </button>
                {sortOpen && (
                  <ul className={`${styles.dropdownMenu} ${styles.open}`} id="sortMenu" role="listbox">
                    {SORT_OPTIONS.map((option) => (
                      <li
                        key={option}
                        role="option"
                        onClick={() => {
                          setSortLabel(option);
                          setSortOpen(false);
                        }}
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className={styles.viewToggles}>
                {(
                  [
                    ['grid', Grid],
                    ['list', List],
                    ['map', Map],
                  ] as const
                ).map(([mode, Icon]) => (
                  <button
                    key={mode}
                    className={`${styles.viewBtn}${view === mode ? ` ${styles.active}` : ''}`}
                    data-view={mode}
                    onClick={() => setView(mode)}
                  >
                    <Icon className={styles.icon} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {sorted.length === 0 && (
            <div className={styles.catalogEmpty}>
              <Search className={styles.icon} aria-hidden="true" />
              <p>No encontramos propiedades con esos criterios.</p>
              <button className={styles.btnOutline} onClick={resetFilters}>
                Limpiar filtros
              </button>
            </div>
          )}

          <div
            className={styles.catalogGrid}
            id="catalogGrid"
            ref={gridRef}
            style={{ gridTemplateColumns: gridTemplateColumns(view, viewportW) }}
          >
            {displayed.map((property, index) => (
              <PropertyCard
                key={property.id}
                property={property}
                index={index}
                onClick={() => openModal(property)}
              />
            ))}
          </div>

          {hasMore && (
            <div className={styles.loadMoreWrapper}>
              <button className={styles.btnLoadMore} onClick={loadMore}>
                CARGAR MÁS <ArrowRight className={styles.icon} aria-hidden="true" />
              </button>
              <p className={styles.loadMoreHint}>
                Mostrando {displayed.length} de {sorted.length} propiedades
              </p>
            </div>
          )}
        </div>
      </main>

      <Suspense fallback={<div className={styles.modalLoading}>Cargando detalles...</div>}>
        <PropertyModal property={selectedProperty} onClose={closeModal} />
      </Suspense>
    </>
  );
}