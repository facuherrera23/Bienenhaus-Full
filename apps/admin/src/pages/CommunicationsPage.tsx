import { useState, useMemo } from 'preact/hooks';
import { Plus, Filter, Search, MessageSquare, X } from 'lucide-preact';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCommunications,
  useCreateCommunication,
  useCreateDraftCommunication,
  useSendCommunication,
  useDeleteCommunication,
} from '@lib/owners';
import { pushToast } from '@store/app';
import { CommunicationTimeline } from '@components/owners';
import { communicationSchema, type CommunicationFormValues } from '@lib/owners/schemas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CommunicationRow, CommunicationStatus, CommunicationType } from '@lib/owners';

export function CommunicationsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'drafts' | 'sent'>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'todos' | CommunicationType>('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | CommunicationStatus>('todos');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewComm, setShowNewComm] = useState(false);
  const [editingComm, setEditingComm] = useState<CommunicationRow | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useCommunications({
    pageSize: 100,
    type: typeFilter === 'todos' ? undefined : typeFilter,
    status: statusFilter === 'todos' ? undefined : statusFilter,
  });

  const allCommunications = data?.data ?? [];

  const createCommunication = useCreateCommunication();
  const createDraftCommunication = useCreateDraftCommunication();
  const sendCommunication = useSendCommunication();
  const deleteCommunication = useDeleteCommunication();

  const commMethods = useForm<CommunicationFormValues>({
    resolver: zodResolver(communicationSchema),
    defaultValues: {
      owner_id: '',
      property_id: null,
      type: 'whatsapp',
      subject: '',
      content: '',
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = allCommunications.filter((c) => {
      const matchesSearch =
        q === '' ||
        c.subject?.toLowerCase().includes(q) ||
        c.content?.toLowerCase().includes(q) ||
        c.property_title?.toLowerCase().includes(q);
      return matchesSearch;
    });

    if (activeTab === 'drafts') {
      result = result.filter((c) => c.status === 'draft');
    } else if (activeTab === 'sent') {
      result = result.filter((c) => c.status !== 'draft');
    }

    return result;
  }, [allCommunications, search, activeTab]);

  const handleSubmit = async (data: CommunicationFormValues) => {
    try {
      const payload = {
        owner_id: data.owner_id,
        property_id: data.property_id ?? null,
        type: data.type,
        subject: data.subject ?? '',
        content: data.content ?? '',
      };
      await createCommunication.mutateAsync(payload);
      pushToast({ type: 'success', title: 'Comunicación creada', description: payload.subject || 'Sin asunto' });
      queryClient.invalidateQueries({ queryKey: ['owner-communications'] });
      setShowNewComm(false);
      commMethods.reset({ owner_id: '', property_id: null, type: 'whatsapp', subject: '', content: '' });
    } catch {
      pushToast({ type: 'error', title: 'No se pudo crear' });
    }
  };

  const handleSaveDraft = async (data: CommunicationFormValues) => {
    try {
      const payload = {
        owner_id: data.owner_id,
        property_id: data.property_id ?? null,
        type: data.type,
        subject: data.subject ?? '',
        content: data.content ?? '',
      };
      await createDraftCommunication.mutateAsync(payload);
      pushToast({ type: 'success', title: 'Borrador guardado', description: payload.subject || 'Sin asunto' });
      queryClient.invalidateQueries({ queryKey: ['owner-communications'] });
      setShowNewComm(false);
      commMethods.reset({ owner_id: '', property_id: null, type: 'whatsapp', subject: '', content: '' });
    } catch {
      pushToast({ type: 'error', title: 'No se pudo guardar' });
    }
  };

  const handleSend = async (comm: CommunicationRow) => {
    try {
      await sendCommunication.mutateAsync(comm.id);
      pushToast({ type: 'success', title: 'Enviado', description: comm.subject ?? undefined });
      queryClient.invalidateQueries({ queryKey: ['owner-communications'] });
    } catch {
      pushToast({ type: 'error', title: 'No se pudo enviar' });
    }
  };

  const handleDelete = async (commId: string, subject: string) => {
    if (!window.confirm(`¿Eliminar "${subject}"?`)) return;
    try {
      await deleteCommunication.mutateAsync(commId);
      pushToast({ type: 'success', title: 'Eliminado' });
      queryClient.invalidateQueries({ queryKey: ['owner-communications'] });
    } catch {
      pushToast({ type: 'error', title: 'No se pudo eliminar' });
    }
  };

  const handleEdit = (comm: CommunicationRow) => {
    commMethods.reset({
      owner_id: comm.owner_id,
      property_id: comm.property_id,
      type: comm.type,
      subject: comm.subject ?? '',
      content: comm.content ?? '',
    });
    setEditingComm(comm);
    setShowNewComm(true);
  };

  const tabs = [
    { id: 'all', label: 'Todas', count: allCommunications.length },
    { id: 'drafts', label: 'Borradores', count: allCommunications.filter(c => c.status === 'draft').length },
    { id: 'sent', label: 'Enviadas', count: allCommunications.filter(c => c.status !== 'draft').length },
  ];

  return (
    <div className="page communications-page">
      <div className="page-head">
        <div>
          <h2 className="page-title">Comunicaciones</h2>
          <p className="page-subtitle">Centro de comunicaciones con propietarios.</p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            commMethods.reset({ owner_id: '', property_id: null, type: 'whatsapp', subject: '', content: '' });
            setEditingComm(null);
            setShowNewComm(true);
          }}
        >
          <Plus size={16} /> Nueva comunicación
        </button>
      </div>

      <div className="tabs-bar" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.label} <span className="tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {showNewComm && (
        <div className="card form-card">
          <form onSubmit={commMethods.handleSubmit(editingComm ? handleSubmit : handleSubmit)} className="comm-form">
            <div className="form-header">
              <h3>{editingComm ? 'Editar comunicación' : 'Nueva comunicación'}</h3>
              <button type="button" className="icon-btn" onClick={() => { setShowNewComm(false); setEditingComm(null); }}>
                <X size={18} />
              </button>
            </div>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="owner_id">Propietario <span className="required">*</span></label>
                <select id="owner_id" {...commMethods.register('owner_id')} required>
                  <option value="">Seleccionar propietario...</option>
                  {/* Would populate from owners API */}
                </select>
              </div>
              <div className="field">
                <label htmlFor="property_id">Propiedad (opcional)</label>
                <select id="property_id" {...commMethods.register('property_id')}>
                  <option value="">Sin propiedad asociada</option>
                  {/* Would populate from properties API */}
                </select>
              </div>
              <div className="field">
                <label htmlFor="type">Tipo</label>
                <select id="type" {...commMethods.register('type')}>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="call">Llamada</option>
                  <option value="email">Email</option>
                  <option value="meeting">Reunión</option>
                  <option value="report">Reporte</option>
                  <option value="note">Nota interna</option>
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="subject">Asunto</label>
                <input id="subject" type="text" placeholder="Asunto de la comunicación" {...commMethods.register('subject')} />
              </div>
            </div>

            <div className="field full-width">
              <label htmlFor="content">Contenido</label>
              <textarea id="content" rows={4} placeholder="Mensaje, notas, detalles..." {...commMethods.register('content')} />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn--ghost" onClick={() => { setShowNewComm(false); setEditingComm(null); }}>
                <X size={14} /> Cancelar
              </button>
              <button type="button" className="btn btn--secondary" onClick={() => handleSaveDraft(commMethods.getValues())}>
                Guardar borrador
              </button>
              <button type="submit" className="btn btn--primary" disabled={createCommunication.isPending}>
                {createCommunication.isPending ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="toolbar">
        <div className="toolbar-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Buscar por asunto, contenido, propiedad..."
            value={search}
            onInput={(e) => setSearch((e.currentTarget as HTMLInputElement).value)}
          />
        </div>
        <button
          type="button"
          className={`btn btn--ghost${showFilters ? ' active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={15} /> Filtros
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-row">
            <div className="filter-group">
              <label>Tipo</label>
              <select
                className="select"
                value={typeFilter}
                onChange={(e) => setTypeFilter((e.currentTarget as HTMLSelectElement).value as any)}
              >
                <option value="todos">Todos</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="call">Llamada</option>
                <option value="email">Email</option>
                <option value="meeting">Reunión</option>
                <option value="report">Reporte</option>
                <option value="note">Nota interna</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Estado</label>
              <select
                className="select"
                value={statusFilter}
                onChange={(e) => setStatusFilter((e.currentTarget as HTMLSelectElement).value as any)}
              >
                <option value="todos">Todos</option>
                <option value="draft">Borrador</option>
                <option value="sent">Enviado</option>
                <option value="delivered">Entregado</option>
                <option value="read">Leído</option>
                <option value="failed">Falló</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {isLoading && <div className="card placeholder-card">Cargando comunicaciones…</div>}

      {!isLoading && filtered.length === 0 && (
        <div className="card placeholder-card">
          <MessageSquare size={48} className="placeholder-icon" />
          <h3>Sin comunicaciones</h3>
          <p>{search ? 'No se encontraron coincidencias.' : 'No hay comunicaciones registradas.'}</p>
          <button type="button" className="btn btn--primary" onClick={() => setShowNewComm(true)}>
            <Plus size={16} /> Crear primera comunicación
          </button>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <CommunicationTimeline
          communications={filtered}
          onEdit={handleEdit}
          onDelete={(commId) => {
            const comm = filtered.find(c => c.id === commId);
            if (comm) handleDelete(commId, comm.subject || 'Sin asunto');
          }}
          onResend={(commId) => {
            const comm = filtered.find(c => c.id === commId);
            if (comm) handleSend(comm);
          }}
        />
      )}
    </div>
  );
}