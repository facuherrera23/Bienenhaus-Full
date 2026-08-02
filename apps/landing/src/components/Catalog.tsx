import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { useReveal } from '../hooks/useReveal';
import { textOf, useSiteContent } from '../lib/content';
import { PropertyCard } from './PropertyCard';
import { PropertyModal } from './PropertyModal';
import type { Property } from '../data/properties';

// Import generated data (build-time fetched from Supabase)
import generatedProperties from '../data/generated/properties.json';

const properties: Property[] = generatedProperties as Property[];

type ViewMode = 'grid' | 'list' | 'map';

const SORT_OPTIONS = ['Más recientes', 'Mayor precio', 'Menor precio', 'Mayor superficie', 'Destacadas'];

const PAGE_SIZE = 6;

// Derive unique locations from generated properties
const LOCATIONS = ['Todas', ...Array.from(new Set(properties.map((p) => p.location).filter(Boolean)))];

const PRICE_RANGES: { value: string; label: string; min: number; max: number }[] = [
  { value: '', label: 'Cualquier precio', min: 0, max: Number.POSITIVE_INFINITY },
  { value: 'lt100k', label: 'Hasta USD 100.000', min: 0, max: 100_000 },
  { value: '100-200', label: 'USD 100.000 - 200.000', min: 100_000, max: 200_000 },
  { value: '200-500', label: 'USD 200.000 - 500.000', min: 200_000, max: 500_000 },
  { value: 'gt500', label: 'USD 500.000+', min: 500_000, max: Number.POSITIVE_INFINITY },
];

function priceOf(p: any): number {
  return Number(String(p.price).replace(/[^0-9]/g, '')) || 0;
}

function gridTemplateColumns(view: ViewMode, w: number): string {
  if (view === 'list' || view === 'map') return '1fr';
  if (w <= 768) return '1fr';
  if (w <= 1024) return 'repeat(2, 1fr)';
  return 'repeat(3, 1fr)';
}

const FILTERS = ['Todas', ...Array.from(new Set(properties.map((p) => p.type).filter(Boolean)))];

export function Catalog() {
  const gridRef = useRef<HTMLDivElement>(null);
  const rootRef = useReveal<HTMLElement>('.property-card', { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  const { content } = useSiteContent();

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
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const openModal = (p: any) => setSelectedProperty(p);
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
  }, [search, operation, location, priceRange, bedroom, typeFilter]);

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

  // Reset pagination when filters/sort change
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
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  return (
    <>
      <main className="catalog" id="catalogo" ref={rootRef}>
        <div className="container">
          <header className="catalog-header">
            <div className="catalog-header-left">
              <span className="catalog-label">{label}</span>
              <h2 className="catalog-title">{title}</h2>
              <p className="catalog-desc">{description}</p>
            </div>
            <div className="catalog-header-right">
              <button className="btn-outline" onClick={resetFilters}>
                VER TODAS <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </header>

          <div className="search-bar">
          <div className="search-group">
            <label>Buscar</label>
            <div
              className="search-input-wrapper"
              style={{
                boxShadow: searchFocused ? '0 0 20px rgba(32, 184, 171, 0.08)' : 'none',
              }}
            >
              <i className="fas fa-search"></i>
              <input
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
          <div className="search-group">
            <label>Operación</label>
            <select value={operation} onChange={(e) => setOperation((e.currentTarget as HTMLSelectElement).value)}>
              <option value="">Todas</option>
              <option value="venta">Venta</option>
              <option value="alquiler">Alquiler</option>
            </select>
          </div>
          <div className="search-group">
            <label>Ubicación</label>
            <select value={location} onChange={(e) => setLocation((e.currentTarget as HTMLSelectElement).value)}>
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="search-group">
            <label>Precio</label>
            <select value={priceRange} onChange={(e) => setPriceRange((e.currentTarget as HTMLSelectElement).value)}>
              {PRICE_RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="search-group">
            <label>Dormitorios</label>
            <div className="bedroom-pills">
              {['1', '2', '3', '4+'].map((value, i) => {
                const num = i + 1;
                return (
                  <button
                    key={value}
                    className={`pill${bedroom === num ? ' active' : ''}`}
                    onClick={() => setBedroom((b) => (b === num ? 0 : num))}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
          <button className="btn-search" id="searchBtn" onClick={handleSearchRipple}>
            BUSCAR <i className="fas fa-arrow-right"></i>
          </button>
        </div>

        <div className="filters-section">
          <div className="filters-pills">
            {FILTERS.map((value) => (
              <button
                key={value}
                className={`filter-pill${typeFilter === value ? ' active' : ''}`}
                onClick={() => setTypeFilter((v) => (v === value ? '' : value))}
              >
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
          <div className="filters-right">
            <span className="results-count">
              {sorted.length} {sorted.length === 1 ? 'propiedad' : 'propiedades'}
            </span>
            <div className="dropdown-wrapper">
              <button
                className={`dropdown-trigger${sortOpen ? ' open' : ''}`}
                id="sortTrigger"
                onClick={() => setSortOpen((o) => !o)}
              >
                {sortLabel} <i className="fas fa-chevron-down"></i>
              </button>
              {sortOpen && (
                <ul className="dropdown-menu open" id="sortMenu" role="listbox">
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
            <div className="view-toggles">
              {(
                [
                  ['grid', 'fas fa-th'],
                  ['list', 'fas fa-list'],
                  ['map', 'fas fa-map'],
                ] as const
              ).map(([mode, icon]) => (
                <button
                  key={mode}
                  className={`view-btn${view === mode ? ' active' : ''}`}
                  data-view={mode}
                  onClick={() => setView(mode)}
                >
                  <i className={icon}></i>
                </button>
              ))}
            </div>
          </div>
        </div>

        {sorted.length === 0 && (
          <div className="catalog-empty">
            <i className="fas fa-search"></i>
            <p>No encontramos propiedades con esos criterios.</p>
            <button className="btn-outline" onClick={resetFilters}>
              Limpiar filtros
            </button>
          </div>
        )}

        <div
          className="catalog-grid"
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
          <div className="load-more-wrapper">
            <button className="btn-load-more" onClick={loadMore}>
              CARGAR MÁS <i className="fas fa-chevron-down"></i>
            </button>
            <p className="load-more-hint">
              Mostrando {displayed.length} de {sorted.length} propiedades
            </p>
          </div>
        )}
      </div>
    </main>

    <PropertyModal property={selectedProperty} onClose={closeModal} />
    </>
  );
}
