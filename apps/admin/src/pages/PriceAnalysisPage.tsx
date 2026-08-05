import { useState, useEffect } from 'preact/hooks';
import { ArrowLeft, Save, Trash2, Loader2, TrendingUp, Plus, X } from 'lucide-preact';
import { Link, useRoute } from 'wouter-preact';
import { useQueryClient } from '@tanstack/react-query';
import {
  usePriceAnalysis,
  useCreatePriceAnalysis,
  useUpdatePriceAnalysis,
  useDeletePriceAnalysis,
  usePropertyOwners,
} from '@lib/owners/api';
import { pushToast } from '@store/app';
import { PriceAnalysisGauge, ComparablePropertyInput } from '@components/owners';
import { priceAnalysisSchema } from '@lib/owners/schemas';
import type { PriceAnalysisFormValues } from '../types/owners';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { PRICE_STATUS_LABEL, MARKET_TREND_LABEL, MARKET_TREND_ICON, getPriceStatusLabel } from '@/types/owners';

export function PriceAnalysisPage() {
   const [, params] = useRoute('/propiedades/:id');
   const propertyId = params?.id;

const [editing, setEditing] = useState(false);
   const queryClient = useQueryClient();

  usePropertyOwners(propertyId!);
  

  const { data: priceAnalysis, isLoading, isError, error } = usePriceAnalysis(propertyId!);
  const createPriceAnalysis = useCreatePriceAnalysis();
  const updatePriceAnalysis = useUpdatePriceAnalysis();
  const deletePriceAnalysis = useDeletePriceAnalysis();

const methods = useForm<z.infer<typeof priceAnalysisSchema>>({
     resolver: zodResolver(priceAnalysisSchema),
     defaultValues: {
       property_id: propertyId!,
       estimated_market_price: 0,
       price_per_sqm_market: null,
       our_listing_price: 0,
       market_trend: 'stable',
       comparable_properties: [],
       recommendation: '',
       notes: '',
       valid_until: null,
     },
     mode: 'onChange',
   });

  const { watch, setValue } = methods;
  const ourPrice = watch('our_listing_price') ?? 0;
  const marketPrice = watch('estimated_market_price') ?? 0;

// Auto-calculate difference percentage
   useEffect(() => {
     if (marketPrice > 0 && ourPrice > 0) {
       // This is just for display, the DB calculates it
     }
   }, [ourPrice, marketPrice]);

const handleSubmit = async (data: z.infer<typeof priceAnalysisSchema>) => {
     try {
const formData: PriceAnalysisFormValues = {
          ...data,
          price_per_sqm_market: data.price_per_sqm_market ?? null,
          recommendation: data.recommendation ?? '',
          notes: data.notes ?? '',
          valid_until: data.valid_until ?? null,
          comparable_properties: data.comparable_properties.map(p => ({
            ...p,
            sqm: p.sqm ?? null,
            source: p.source ?? null,
          })),
        };

       if (editing && priceAnalysis) {
         await updatePriceAnalysis.mutateAsync({ id: priceAnalysis.id, analysis: formData });
         pushToast({ type: 'success', title: 'Análisis actualizado' });
       } else {
         await createPriceAnalysis.mutateAsync(formData);
         pushToast({ type: 'success', title: 'Análisis creado' });
       }
       queryClient.invalidateQueries({ queryKey: ['price-analysis', propertyId] });
       setEditing(false);
     } catch {
       pushToast({ type: 'error', title: editing ? 'No se pudo actualizar' : 'No se pudo crear' });
     }
   };

  const handleDelete = async () => {
    if (!priceAnalysis) return;
    if (!window.confirm('¿Eliminar este análisis de precio?')) return;
    try {
      await deletePriceAnalysis.mutateAsync(priceAnalysis.id);
      pushToast({ type: 'success', title: 'Análisis eliminado' });
      queryClient.invalidateQueries({ queryKey: ['price-analysis', propertyId] });
      setEditing(false);
    } catch {
      pushToast({ type: 'error', title: 'No se pudo eliminar' });
    }
  };

  const handleCancel = () => {
    setEditing(false);
    methods.reset({
      property_id: propertyId!,
      estimated_market_price: 0,
      price_per_sqm_market: null,
      our_listing_price: 0,
      market_trend: 'stable',
      comparable_properties: [],
      recommendation: '',
      notes: '',
      valid_until: null,
    });
  };

  if (isLoading) {
    return (
      <div className="page">
        <div className="page-head">
          <Link href={`/propiedades/${propertyId}`} className="btn btn--ghost">
            <ArrowLeft size={16} /> Volver
          </Link>
        </div>
        <div className="card placeholder-card">Cargando análisis…</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page">
        <div className="page-head">
          <Link href={`/propiedades/${propertyId}`} className="btn btn--ghost">
            <ArrowLeft size={16} /> Volver
          </Link>
        </div>
        <div className="card placeholder-card">Error: {error?.message}</div>
      </div>
    );
  }

  const hasAnalysis = !!priceAnalysis;

  return (
    <div className="page price-analysis-page">
      <div className="page-head">
        <Link href={`/propiedades/${propertyId}`} className="btn btn--ghost">
          <ArrowLeft size={16} /> Volver a la propiedad
        </Link>
        <div>
          <h2 className="page-title">Análisis de Precio</h2>
          <p className="page-subtitle">
            {hasAnalysis
              ? `Último análisis: ${new Date(priceAnalysis!.analysis_date).toLocaleDateString('es-AR')}`
              : 'Creá un análisis para comparar el precio de publicación con el mercado'}
          </p>
        </div>
        <div style="display:flex; gap:8px;">
          {hasAnalysis && !editing && (
            <Link href={`/propiedades/${propertyId}`} className="btn btn--secondary">
              <ArrowLeft size={16} /> Volver a la propiedad
            </Link>
          )}
          {!editing && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                if (hasAnalysis) {
                  methods.setValue('estimated_market_price', priceAnalysis!.estimated_market_price);
                  methods.setValue('price_per_sqm_market', priceAnalysis!.price_per_sqm_market);
                  methods.setValue('our_listing_price', priceAnalysis!.our_listing_price);
                  methods.setValue('market_trend', priceAnalysis!.market_trend);
                  methods.setValue('comparable_properties', priceAnalysis!.comparable_properties);
                  methods.setValue('recommendation', priceAnalysis!.recommendation ?? '');
                  methods.setValue('notes', priceAnalysis!.notes ?? '');
                  methods.setValue('valid_until', priceAnalysis!.valid_until ?? null);
                }
                setEditing(true);
              }}
            >
              <Plus size={16} /> {hasAnalysis ? 'Editar' : 'Nuevo análisis'}
            </button>
          )}
        </div>
      </div>

      {editing && (
        <div className="card form-card">
          <form onSubmit={methods.handleSubmit(handleSubmit)} className="analysis-form">
            <div className="form-section">
              <h3>Precios</h3>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="estimated_market_price">
                    Precio estimado de mercado <span className="required">*</span>
                  </label>
                  <input
                    id="estimated_market_price"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="150000"
                    {...methods.register('estimated_market_price', { valueAsNumber: true })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="our_listing_price">
                    Precio de publicación actual <span className="required">*</span>
                  </label>
                  <input
                    id="our_listing_price"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="165000"
                    {...methods.register('our_listing_price', { valueAsNumber: true })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="price_per_sqm_market">Precio m² mercado (opcional)</label>
                  <input
                    id="price_per_sqm_market"
                    type="number"
                    min="0"
                    step="100"
                    placeholder="2500"
                    {...methods.register('price_per_sqm_market', { valueAsNumber: true })}
                  />
                </div>
              </div>

              {marketPrice > 0 && ourPrice > 0 && (
                <div className="price-diff-preview">
                  <span>Diferencia: </span>
                  <strong className={ourPrice > marketPrice ? 'positive' : 'negative'}>
                    {((ourPrice - marketPrice) / marketPrice * 100).toFixed(2)}%
                  </strong>
                  <span>({getPriceStatusLabel(ourPrice > marketPrice ? 'above' : 'below')})</span>
                </div>
              )}
            </div>

            <div className="form-section">
              <h3>Tendencia del mercado</h3>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="market_trend">Tendencia</label>
                  <select
                    id="market_trend"
                    {...methods.register('market_trend')}
                  >
                    <option value="rising">{MARKET_TREND_LABEL.rising}</option>
                    <option value="stable">{MARKET_TREND_LABEL.stable}</option>
                    <option value="falling">{MARKET_TREND_LABEL.falling}</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="valid_until">Válido hasta</label>
                  <input
                    id="valid_until"
                    type="date"
                    {...methods.register('valid_until')}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Propiedades Comparables</h3>
              <ComparablePropertyInput
                value={methods.watch('comparable_properties') ?? []}
                onChange={(value) => setValue('comparable_properties', value)}
              />
            </div>

            <div className="form-section">
              <h3>Recomendación y notas</h3>
              <div className="field full-width">
                <label htmlFor="recommendation">Recomendación</label>
                <textarea
                  id="recommendation"
                  rows={3}
                  placeholder="Ej: Reducir precio 5% para alinearse con mercado..."
                  {...methods.register('recommendation')}
                />
              </div>
              <div className="field full-width">
                <label htmlFor="notes">Notas internas</label>
                <textarea
                  id="notes"
                  rows={3}
                  placeholder="Observaciones adicionales..."
                  {...methods.register('notes')}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn--ghost" onClick={handleCancel}>
                <X size={14} /> Cancelar
              </button>
              {hasAnalysis && (
                <button type="button" className="btn btn--danger" onClick={handleDelete}>
                  <Trash2 size={14} /> Eliminar
                </button>
              )}
              <button type="submit" className="btn btn--primary" disabled={createPriceAnalysis.isPending || updatePriceAnalysis.isPending}>
                {createPriceAnalysis.isPending || updatePriceAnalysis.isPending ? (
                  <><Loader2 size={14} className="spin" /> Guardando...</>
                ) : (
                  <> <Save size={14} /> {hasAnalysis ? 'Actualizar' : 'Crear análisis'} </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {!editing && hasAnalysis && (
        <>
          <PriceAnalysisGauge analysis={priceAnalysis} size={350} />

          <div className="analysis-grid">
            <div className="analysis-main">
              <div className="detail-card">
                <h3>Detalles del análisis</h3>
                <dl className="detail-list">
                  <div>
                    <dt>Fecha de análisis</dt>
                    <dd>{new Date(priceAnalysis.analysis_date).toLocaleDateString('es-AR')}</dd>
                  </div>
                  <div>
                    <dt>Válido hasta</dt>
                    <dd>{priceAnalysis.valid_until ? new Date(priceAnalysis.valid_until).toLocaleDateString('es-AR') : 'Indefinido'}</dd>
                  </div>
                  <div>
                    <dt>Analizado por</dt>
                    <dd>{priceAnalysis.analyzed_by_name ?? 'Desconocido'}</dd>
                  </div>
                  <div>
                    <dt>Tendencia de mercado</dt>
                    <dd>
                      <span className="trend-badge">
                        {(() => {
                          const Icon = MARKET_TREND_ICON[priceAnalysis.market_trend] as any;
                          return <><Icon size={14} /> {MARKET_TREND_LABEL[priceAnalysis.market_trend]}</>;
                        })()}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>

              {priceAnalysis.comparable_properties.length > 0 && (
                <div className="detail-card">
                  <h3>Propiedades Comparables ({priceAnalysis.comparable_properties.length})</h3>
                  <table className="table table--compact">
                    <thead>
                      <tr>
                        <th>Dirección</th>
                        <th>Precio</th>
                        <th>m²</th>
                        <th>Precio/m²</th>
                        <th>Fuente</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {priceAnalysis.comparable_properties.map((comp, i) => (
                        <tr key={i}>
                          <td>{comp.address}</td>
                          <td>${comp.price.toLocaleString('es-AR')}</td>
                          <td>{comp.sqm ?? '—'}</td>
                          <td>{comp.sqm ? `$${(comp.price / comp.sqm).toLocaleString('es-AR')}` : '—'}</td>
                          <td>{comp.source ?? '—'}</td>
                          <td>{new Date(comp.date).toLocaleDateString('es-AR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {priceAnalysis.recommendation && (
                <div className="detail-card recommendation">
                  <h3>Recomendación</h3>
                  <p>{priceAnalysis.recommendation}</p>
                </div>
              )}

              {priceAnalysis.notes && (
                <div className="detail-card">
                  <h3>Notas</h3>
                  <p>{priceAnalysis.notes}</p>
                </div>
              )}
            </div>

            <div className="analysis-sidebar">
              <div className="info-card">
                <h4>Estado del precio</h4>
                <div className="status-display">
                  <span className={`status-badge badge--${priceAnalysis.price_status}`}>
                    {PRICE_STATUS_LABEL[priceAnalysis.price_status]}
                  </span>
                  <p className="status-description">
                    {priceAnalysis.price_difference_pct >= 0
                      ? `El precio de publicación está ${priceAnalysis.price_difference_pct.toFixed(2)}% por encima del mercado.`
                      : `El precio de publicación está ${Math.abs(priceAnalysis.price_difference_pct).toFixed(2)}% por debajo del mercado.`}
                  </p>
                </div>
              </div>

              <div className="info-card">
                <h4>Resumen financiero</h4>
                <dl>
                  <dt>Precio publicación</dt>
                  <dd>${priceAnalysis.our_listing_price.toLocaleString('es-AR')}</dd>
                  <dt>Precio mercado</dt>
                  <dd>${priceAnalysis.estimated_market_price.toLocaleString('es-AR')}</dd>
                  <dt>Diferencia</dt>
                  <dd className={priceAnalysis.price_difference_pct >= 0 ? 'positive' : 'negative'}>
                    {priceAnalysis.price_difference_pct >= 0 ? '+' : ''}${(
                      priceAnalysis.our_listing_price - priceAnalysis.estimated_market_price
                    ).toLocaleString('es-AR')} ({priceAnalysis.price_difference_pct.toFixed(2)}%)
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </>
      )}

      {!editing && !hasAnalysis && (
        <div className="empty-state">
          <TrendingUp size={48} className="placeholder-icon" />
          <h3>Sin análisis de precio</h3>
          <p>Creá un análisis para comparar el precio de publicación con el valor estimado de mercado.</p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              setEditing(true);
            }}
          >
            <Plus size={16} /> Crear primer análisis
          </button>
        </div>
      )}
    </div>
  );
}