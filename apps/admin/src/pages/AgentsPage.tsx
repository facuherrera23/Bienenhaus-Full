import { useEffect, useState } from 'preact/hooks';
import { Mail, Pencil, Phone, Plus } from 'lucide-preact';
import { Link } from 'wouter-preact';
import { useAgents, useToggleAgentActive, type AgentRow } from '../lib/agents.api';
import { queryClient } from '../lib/query/client';
import { pushToast } from '../store/app';

function getListData<T>(data: unknown): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  if (typeof data === 'object' && data !== null && 'data' in data) {
    return (data as { data: T[] }).data ?? [];
  }
  return [];
}

export function AgentsPage() {
  const { data, isPending, isError } = useAgents();
  const agents = getListData<AgentRow>(data);

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const toggleAgentActive = useToggleAgentActive();

  useEffect(() => {
    document.title = 'Agentes · BIENENHAUS';
    return () => {
      document.title = 'BIENENHAUS — Panel de Administración';
    };
  }, []);

  const handleToggleActive = async (agent: AgentRow) => {
    setTogglingId(agent.id);
    try {
      await toggleAgentActive.mutateAsync({ id: agent.id, is_active: !agent.is_active });
      await queryClient.invalidateQueries({ queryKey: ['agents'] });
      pushToast({
        type: 'success',
        title: agent.is_active ? 'Agente desactivado' : 'Agente activado',
        description: agent.name,
      });
    } catch {
      pushToast({ type: 'error', title: 'No se pudo actualizar el agente' });
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2 className="page-title">Agentes</h2>
          <p className="page-subtitle">Equipo de asesores que aparece en la landing y recibe leads.</p>
        </div>
        <Link href="/agentes/nueva" className="btn btn--primary">
          <Plus size={16} /> Nuevo agente
        </Link>
      </div>

      {isPending && <div className="card placeholder-card">Cargando agentes…</div>}
      {isError && <div className="card placeholder-card">No se pudieron cargar los agentes.</div>}

      {!isPending && !isError && (
        <div className="agent-grid">
          {agents.map((a) => (
            <article key={a.id} className={`agent-card${a.is_active ? '' : ' is-inactive'}`}>
              <div className="agent-card-head">
                <span className="agent-photo" aria-hidden="true">
                  {a.photo_url ? (
                    <img src={a.photo_url} alt="" />
                  ) : (
                    (a.name[0] ?? '').toUpperCase()
                  )}
                </span>
                <div className="agent-card-title">
                  <h3>{a.name}</h3>
                  <p>{a.role ?? 'Asesor'}</p>
                  {a.matricula && <span className="agent-matricula">Mat. {a.matricula}</span>}
                </div>
                <span className={`badge badge--${a.is_active ? 'success' : 'neutral'}`}>
                  {a.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="agent-card-contact">
                <span>
                  <Mail size={14} /> {a.email}
                </span>
                <span>
                  <Phone size={14} /> {a.phone ?? '—'}
                </span>
              </div>

              {a.specialties.length > 0 && (
                <div className="agent-specs">
                  {a.specialties.map((s) => (
                    <span key={s} className="chip">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <div className="agent-card-foot">
                <span className="muted">
                  {a.lead_count} lead{a.lead_count === 1 ? '' : 's'} asignado{a.lead_count === 1 ? '' : 's'}
                </span>
                <div className="agent-card-actions">
                  <button
                    className="btn btn--ghost"
                    onClick={() => handleToggleActive(a)}
                    disabled={togglingId === a.id}
                  >
                    {a.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                  <Link href={`/agentes/${a.id}`} className="btn btn--secondary">
                    <Pencil size={14} /> Editar
                  </Link>
                </div>
              </div>
            </article>
          ))}

          {agents.length === 0 && (
            <div className="card placeholder-card">
              <h3>Todavía no hay agentes</h3>
              <p>Creá el primer agente del equipo.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}