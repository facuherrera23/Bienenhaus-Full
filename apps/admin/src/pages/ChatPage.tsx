import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  MessageSquare,
  Plus,
  Search,
  Send,
  Paperclip,
  Image,
  ChevronLeft,
  MoreHorizontal,
  Users,
  Home,
  UserPlus,
  Loader2,
  Check,
  CheckCheck,
  Smile,
  Edit2,
  Reply,
  X,
  ChevronUp,
} from 'lucide-preact';
import {
  fetchChannels,
  createDirectChannel,
  createGroupChannel,
  createPropertyChannel,
  createLeadChannel,
  sendMessage,
  fetchMessages,
  editMessage,
  markChannelAsRead,
  subscribeToChannelMessages,
  type ChatChannel,
  type ChatMessage,
  MESSAGE_TYPE_LABEL,
  CHANNEL_TYPE_LABEL,
} from '../lib/chat';
import { fetchAgents } from '../lib/agents';
import { fetchProperties } from '../lib/properties';
import { fetchLeads } from '../lib/leads';
import { queryClient } from '../lib/query/client';
import { useQuery } from '../lib/query/hooks';
import { pushToast } from '../store/app';
import { ImageLightbox } from '../components/ImageLightbox';

export function ChatPage() {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [showChannelList, setShowChannelList] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [createMode, setCreateMode] = useState<'direct' | 'group' | 'property' | 'lead'>('direct');
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [groupName, setGroupName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // New features state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [imageLightbox, setImageLightbox] = useState<{ url: string; name: string } | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const currentUserId = useMemo(() => {
    try {
      const session = JSON.parse(localStorage.getItem('supabase.auth.token') ?? '{}');
      return session.user?.id;
    } catch {
      return null;
    }
  }, []);

  const { data: agents } = useQuery({ queryKey: ['agents'], queryFn: fetchAgents });
  const { data: properties } = useQuery({ queryKey: ['properties'], queryFn: fetchProperties });
  const { data: leads } = useQuery({ queryKey: ['leads'], queryFn: fetchLeads });
  const { data: channels, isPending: channelsPending } = useQuery({
    queryKey: ['chat-channels', currentUserId],
    queryFn: () => currentUserId ? fetchChannels(currentUserId) : Promise.resolve([]),
    enabled: !!currentUserId,
  });

  const activeChannel = useMemo(
    () => channels?.find(c => c.id === selectedChannelId) ?? null,
    [channels, selectedChannelId]
  );

  const { data: messages, isPending: messagesPending } = useQuery({
    queryKey: ['chat-messages', selectedChannelId],
    queryFn: () => selectedChannelId ? fetchMessages(selectedChannelId, 100) : Promise.resolve([]),
    enabled: !!selectedChannelId,
  });

  useEffect(() => {
    document.title = selectedChannelId ? 'Chat · BIENENHAUS' : 'Mensajes · BIENENHAUS';
    return () => {
      document.title = 'BIENENHAUS — Panel de Administración';
    };
  }, [selectedChannelId]);

  // Real-time subscription
  useEffect(() => {
    if (!selectedChannelId) return;
    const unsubscribe = subscribeToChannelMessages(
      selectedChannelId,
      (msg) => {
        queryClient.setQueryData(['chat-messages', selectedChannelId], (old: any[]) => {
          if (!old) return [msg];
          if (old.some(m => m.id === msg.id)) return old;
          return [...old, msg];
        });
        scrollToBottom();
      },
      (msg) => {
        queryClient.setQueryData(['chat-messages', selectedChannelId], (old: any[]) =>
          old?.map(m => m.id === msg.id ? msg : m) ?? []
        );
      },
      (messageId) => {
        queryClient.setQueryData(['chat-messages', selectedChannelId], (old: any[]) =>
          old?.filter(m => m.id !== messageId) ?? []
        );
      }
    );
    return unsubscribe;
  }, [selectedChannelId]);

  const handleSend = async (e: Event) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChannelId || sending) return;

    setSending(true);
    try {
      await sendMessage(selectedChannelId, currentUserId!, messageText.trim());
      setMessageText('');
      scrollToBottom();
    } catch (err) {
      pushToast({ type: 'error', title: 'Error enviando mensaje', description: (err as Error).message });
    } finally {
      setSending(false);
    }
  };

  // Message actions
  const startEdit = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditText(msg.content);
  };

  const saveEdit = async (msg: ChatMessage) => {
    if (!editText.trim()) return;
    try {
      await editMessage(msg.id, editText);
      pushToast({ type: 'success', title: 'Mensaje editado' });
      setEditingMessageId(null);
      setEditText('');
      await queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedChannelId] });
    } catch {
      pushToast({ type: 'error', title: 'Error al editar' });
    }
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditText('');
  };

  const startReply = (msg: ChatMessage) => {
    setReplyingToId(msg.id);
    setMessageText(`> ${msg.sender_name}: ${msg.content}\n\n`);
    setTimeout(() => {
      const input = document.querySelector('.message-input') as HTMLInputElement;
      input?.focus();
    }, 0);
  };

  const cancelReply = () => {
    setReplyingToId(null);
  };

  const openImageLightbox = (url: string, name: string) => {
    setImageLightbox({ url, name });
  };

  const closeImageLightbox = () => {
    setImageLightbox(null);
  };

  const loadMoreMessages = async () => {
    if (!selectedChannelId || loadingMore || !hasMoreMessages) return;
    setLoadingMore(true);
    try {
      const oldestMsg = messages?.[0];
      const newMessages = await fetchMessages(selectedChannelId, 50, oldestMsg?.created_at);
      if (newMessages.length < 50) setHasMoreMessages(false);
      queryClient.setQueryData(['chat-messages', selectedChannelId], (old: ChatMessage[]) => [...newMessages, ...(old ?? [])]);
    } catch {
      pushToast({ type: 'error', title: 'Error cargando más mensajes' });
    } finally {
      setLoadingMore(false);
    }
  };

  const handleChannelClick = (channel: ChatChannel) => {
    setSelectedChannelId(channel.id);
    setShowChannelList(false);
    markChannelAsRead(channel.id, currentUserId!);
  };

  const handleCreateChannel = async () => {
    if (!currentUserId) return;
    try {
      let channel;
      if (createMode === 'direct') {
        if (selectedAgentIds.length !== 1) {
          pushToast({ type: 'error', title: 'Seleccioná un agente' });
          return;
        }
        channel = await createDirectChannel([currentUserId, selectedAgentIds[0]], currentUserId);
      } else if (createMode === 'group') {
        if (!groupName.trim() || selectedAgentIds.length < 1) {
          pushToast({ type: 'error', title: 'Nombre y al menos un agente requeridos' });
          return;
        }
        channel = await createGroupChannel(groupName, [currentUserId, ...selectedAgentIds], currentUserId);
      } else if (createMode === 'property') {
        if (!selectedPropertyId) {
          pushToast({ type: 'error', title: 'Seleccioná una propiedad' });
          return;
        }
        channel = await createPropertyChannel(selectedPropertyId, [currentUserId, ...selectedAgentIds], currentUserId);
      } else if (createMode === 'lead') {
        if (!selectedLeadId) {
          pushToast({ type: 'error', title: 'Seleccioná un lead' });
          return;
        }
        channel = await createLeadChannel(selectedLeadId, [currentUserId, ...selectedAgentIds], currentUserId);
      }

      if (channel) {
        setShowCreateChannel(false);
        setSelectedChannelId(channel.id);
        setSelectedAgentIds([]);
        setGroupName('');
        setSelectedPropertyId('');
        setSelectedLeadId('');
        setCreateMode('direct');
        queryClient.invalidateQueries({ queryKey: ['chat-channels', currentUserId] });
        pushToast({ type: 'success', title: 'Canal creado' });
      }
    } catch (err) {
      pushToast({ type: 'error', title: 'Error creando canal', description: (err as Error).message });
    }
  };

  const toggleAgent = (agentId: string) => {
    setSelectedAgentIds(prev => prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]);
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return 'Hoy';
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  };

  const isOwnMessage = (msg: ChatMessage) => msg.sender_id === currentUserId;

  return (
    <div className="page chat-page">
      <div className="chat-layout">
        {/* Sidebar - Channel List */}
        <aside className={`chat-sidebar${showChannelList ? ' open' : ''}`}>
          <div className="chat-sidebar-header">
            <h2>Mensajes</h2>
            <div className="sidebar-actions">
              <button className="icon-btn" onClick={() => { setCreateMode('direct'); setShowCreateChannel(true); }}>
                <Plus size={18} />
              </button>
              {window.innerWidth < 768 && (
                <button className="icon-btn" onClick={() => setShowChannelList(false)}>
                  <ChevronLeft size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="chat-search">
            <Search size={16} />
            <input type="text" placeholder="Buscar conversaciones..." />
          </div>

          {channelsPending && <div className="chat-loading">Cargando…</div>}

          {!channelsPending && channels && channels.length === 0 && (
            <div className="chat-empty">
              <MessageSquare size={48} />
              <h3>Sin conversaciones</h3>
              <p>Creá tu primer chat</p>
            </div>
          )}

          {!channelsPending && channels && channels.length > 0 && (
            <ul className="chat-channel-list">
              {channels.map(channel => (
                <li
                  key={channel.id}
                  className={`chat-channel-item${selectedChannelId === channel.id ? ' active' : ''}`}
                  onClick={() => handleChannelClick(channel)}
                >
                  <div className="channel-avatar">
                    {channel.type === 'direct' && channel.participants.length === 1 ? (
                      channel.participants[0].agent_photo_url ? (
                        <img src={channel.participants[0].agent_photo_url} alt="" />
                      ) : (
                        <span>{channel.participants[0].agent_name?.[0]?.toUpperCase()}</span>
                      )
                    ) : channel.type === 'group' ? (
                      <Users size={20} />
                    ) : channel.type === 'property' ? (
                      <Home size={20} />
                    ) : (
                      <UserPlus size={20} />
                    )}
                  </div>
                  <div className="channel-info">
                    <div className="channel-header">
                      <span className="channel-name">
                        {channel.type === 'direct' && channel.participants.length === 1
                          ? channel.participants[0].agent_name
                          : channel.name ?? (channel.type === 'group' ? 'Grupo' : CHANNEL_TYPE_LABEL[channel.type])}
                      </span>
                      {channel.last_message && (
                        <span className="channel-time">{formatTime(channel.last_message.created_at)}</span>
                      )}
                    </div>
                    <div className="channel-preview">
                      {channel.last_message && (
                        <>
                          {channel.last_message.sender_id === (() => {
                            try {
                              const s = JSON.parse(localStorage.getItem('supabase.auth.token') ?? '{}');
                              return s.user?.id;
                            } catch { return null; }
                          })() ? 'Tú: ' : ''}
                          {channel.last_message.message_type !== 'text' && (
                            <span className="msg-type-badge">[{MESSAGE_TYPE_LABEL[channel.last_message.message_type]}]</span>
                          )}
                          {channel.last_message.content}
                        </>
                      )}
                    </div>
                    {channel.unread_count > 0 && (
                      <span className="unread-badge">{channel.unread_count > 9 ? '9+' : channel.unread_count}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Main Chat Area */}
        <main className="chat-main">
          {selectedChannelId ? (
            <>
              <header className="chat-header">
                <div className="header-left">
                  {window.innerWidth < 768 && (
                    <button className="icon-btn" onClick={() => setShowChannelList(true)}>
                      <ChevronLeft size={20} />
                    </button>
                  )}
                  <div className="header-avatar">
                    {activeChannel?.type === 'direct' && activeChannel.participants.length === 1 ? (
                      activeChannel.participants[0].agent_photo_url ? (
                        <img src={activeChannel.participants[0].agent_photo_url} alt="" />
                      ) : (
                        <span>{activeChannel.participants[0].agent_name?.[0]?.toUpperCase()}</span>
                      )
                    ) : activeChannel?.type === 'group' ? (
                      <Users size={24} />
                    ) : activeChannel?.type === 'property' ? (
                      <Home size={24} />
                    ) : (
                      <UserPlus size={24} />
                    )}
                  </div>
                  <div className="header-info">
                    <h3>
                      {activeChannel?.type === 'direct' && activeChannel.participants.length === 1
                        ? activeChannel.participants[0].agent_name
                        : activeChannel?.name ?? (activeChannel?.type === 'group' ? 'Grupo' : CHANNEL_TYPE_LABEL[activeChannel?.type ?? 'direct'])}
                    </h3>
                    <span className="header-subtitle">
                      {activeChannel?.participants.length} participante{activeChannel?.participants.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="header-actions">
                  <button className="icon-btn" title="Información del canal">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              </header>

              <div className="chat-messages" role="log" aria-live="polite">
                {messagesPending ? (
                  <div className="messages-loading">
                    <Loader2 size={24} className="spin" />
                  </div>
                ) : messages && messages.length === 0 ? (
                  <div className="messages-empty">
                    <MessageSquare size={48} />
                    <h3>No hay mensajes aún</h3>
                    <p>Enviá el primer mensaje</p>
                  </div>
                ) : (
                  <>
                    {hasMoreMessages && (
            <div className="load-more-container">
              <button className="btn btn--ghost btn--sm" onClick={loadMoreMessages} disabled={loadingMore}>
                {loadingMore ? <Loader2 size={14} className="spin" /> : <ChevronUp size={14} />} Cargar más
              </button>
            </div>
          )}
          {messages?.map((msg, idx) => {
                      const showDate = idx === 0 || formatDate(msg.created_at) !== formatDate(messages[idx - 1]?.created_at);
const isOwn = isOwnMessage(msg);
                       const isEditing = editingMessageId === msg.id;
                       const showActions = isOwn && !isEditing;
                      return (
                        <div key={msg.id} className="message-group">
                          {showDate && <div className="message-date-divider">{formatDate(msg.created_at)}</div>}
                          <div className={`message${isOwn ? ' own' : ''}`}>
                            {!isOwn && (
                              <div className="message-avatar">
                                {msg.sender_photo_url ? (
                                  <img src={msg.sender_photo_url} alt="" />
                                ) : (
                                  <span>{msg.sender_name?.[0]?.toUpperCase()}</span>
                                )}
                              </div>
                            )}
                            <div className="message-content">
                              <div className="message-header">
                                {!isOwn && <span className="message-sender">{msg.sender_name}</span>}
                                <span className="message-time">{formatTime(msg.created_at)}</span>
                                {showActions && (
                                  <div className="message-actions">
                                    <button className="icon-btn-sm" title="Responder" onClick={() => startReply(msg)}>
                                      <Reply size={14} />
                                    </button>
                                    <button className="icon-btn-sm" title="Editar" onClick={() => startEdit(msg)}>
                                      <Edit2 size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="message-bubble">
                                {msg.message_type === 'image' && msg.file_url && (
                                  <a href={msg.file_url} target="_blank" rel="noopener" className="message-image" onClick={(e) => { e.preventDefault(); openImageLightbox(msg.file_url!, msg.file_name ?? 'Imagen'); }}>
                                    <img src={msg.file_url} alt={msg.file_name ?? 'Imagen'} loading="lazy" />
                                  </a>
                                )}
                                {msg.message_type === 'file' && msg.file_url && (
                                  <a href={msg.file_url} target="_blank" rel="noopener" className="message-file">
                                    <Paperclip size={18} /> {msg.file_name}
                                  </a>
                                )}
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editText}
                                    onChange={e => setEditText(e.currentTarget.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(msg); if (e.key === 'Escape') cancelEdit(); }}
                                    autoFocus
                                    className="edit-input"
                                  />
                                ) : (
                                  <>
                                    {msg.content && <div className="message-text">{msg.content}</div>}
                                    {msg.reply_to && (
                                      <div className="message-reply">
                                        <span className="reply-sender">{msg.reply_to.sender_name}</span>
                                        <span className="reply-text">{msg.reply_to.content}</span>
                                      </div>
)}
                                  </>
                                )}
                              </div>
                              <div className="message-status">
                                {isOwn && (
                                  <>
                                    <Check size={14} className={msg.read_by && msg.read_by.length > 0 ? 'read' : 'sent'} title={msg.read_by && msg.read_by.length > 0 ? `Leído por ${msg.read_by.length} persona${msg.read_by.length > 1 ? 's' : ''}` : 'Enviado'} />
                                    {msg.read_by && msg.read_by.length > 0 && <CheckCheck size={14} className="read" title="Leído" />}
                                  </>
                                )}
                                {!isOwn && replyingToId === msg.id && (
                                  <button className="icon-btn-sm" onClick={cancelReply} title="Cancelar respuesta">
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <footer className="chat-footer">
                <form onSubmit={handleSend} className="message-form">
                  <div className="message-input-wrapper">
                    <button type="button" className="attach-btn" title="Adjuntar archivo">
                      <Paperclip size={20} />
                    </button>
                    <button type="button" className="attach-btn" title="Adjuntar imagen">
                      <Image size={20} />
                    </button>
                    <button type="button" className="attach-btn" title="Emoji">
                      <Smile size={20} />
                    </button>
                    <input
                      type="text"
                      value={messageText}
                      onChange={e => setMessageText(e.currentTarget.value)}
                      placeholder="Escribí un mensaje..."
                      className="message-input"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(e);
                        }
                      }}
                    />
                    <button
                      type="submit"
                      className="send-btn"
                      disabled={!messageText.trim() || sending}
                    >
                      {sending ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
                    </button>
                  </div>
                </form>
              </footer>
            </>
          ) : (
            <div className="chat-welcome">
              <MessageSquare size={64} />
              <h2>Bienvenido al Chat</h2>
              <p>Seleccioná una conversación o creá una nueva para empezar.</p>
              <button className="btn btn--primary" onClick={() => { setCreateMode('direct'); setShowCreateChannel(true); }}>
                <Plus size={16} /> Nueva conversación
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Image Lightbox Modal */}
      <ImageLightbox image={imageLightbox} onClose={closeImageLightbox} />

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <div className="modal-overlay" onClick={() => setShowCreateChannel(false)} role="dialog" aria-modal="true">
          <div className="modal-container modal--medium" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCreateChannel(false)}><ChevronLeft size={20} /></button>
            <div className="modal-content">
              <h2>Nueva conversación</h2>
              <div className="create-mode-tabs">
                {(['direct', 'group', 'property', 'lead'] as const).map(mode => (
                  <button
                    key={mode}
                    className={`mode-tab${createMode === mode ? ' active' : ''}`}
                    onClick={() => { setCreateMode(mode); setSelectedAgentIds([]); }}
                  >
                    {mode === 'direct' && <UserPlus size={16} />}
                    {mode === 'group' && <Users size={16} />}
                    {mode === 'property' && <Home size={16} />}
                    {mode === 'lead' && <UserPlus size={16} />}
                    <span>{CHANNEL_TYPE_LABEL[mode]}</span>
                  </button>
                ))}
              </div>

              {createMode === 'direct' && (
                <div className="agent-selector">
                  <label>Seleccioná un agente</label>
                  <div className="agent-list">
                      {(agents ?? []).filter(a => a.id !== currentUserId).map(agent => (
                        <label key={agent.id} className={`agent-option${selectedAgentIds.includes(agent.id) ? ' selected' : ''}`}>
                          <input type="radio" name="direct-agent" checked={selectedAgentIds.includes(agent.id)} onChange={() => setSelectedAgentIds([agent.id])} />
                          <span className="agent-avatar-small">{agent.photo_url ? <img src={agent.photo_url} alt="" /> : agent.name?.[0]?.toUpperCase()}</span>
                          <span>{agent.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

              {createMode === 'group' && (
                <div className="form-grid">
                  <label className="field field--wide">
                    <span>Nombre del grupo *</span>
                    <input type="text" value={groupName} onChange={e => setGroupName(e.currentTarget.value)} placeholder="Ej: Equipo de ventas" required />
                  </label>
                  <label className="field field--wide">
                    <span>Participantes *</span>
                    <div className="agent-multi-select">
                      {(agents ?? []).filter(a => a.id !== currentUserId).map(agent => (
                        <label key={agent.id} className={`agent-option${selectedAgentIds.includes(agent.id) ? ' selected' : ''}`}>
                          <input type="checkbox" checked={selectedAgentIds.includes(agent.id)} onChange={() => toggleAgent(agent.id)} />
                          <span className="agent-avatar-small">{agent.photo_url ? <img src={agent.photo_url} alt="" /> : agent.name?.[0]?.toUpperCase()}</span>
                          <span>{agent.name}</span>
                        </label>
                      ))}
                    </div>
                  </label>
                </div>
              )}

              {createMode === 'property' && (
                <div className="form-grid">
                  <label className="field field--wide">
                    <span>Propiedad *</span>
                    <select value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.currentTarget.value)} required>
                      <option value="">Seleccionar propiedad</option>
                      {properties?.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  </label>
                  <label className="field field--wide">
                    <span>Agentes a invitar</span>
                    <div className="agent-multi-select">
                      {(agents ?? []).filter(a => a.id !== currentUserId).map(agent => (
                        <label key={agent.id} className={`agent-option${selectedAgentIds.includes(agent.id) ? ' selected' : ''}`}>
                          <input type="checkbox" checked={selectedAgentIds.includes(agent.id)} onChange={() => toggleAgent(agent.id)} />
                          <span className="agent-avatar-small">{agent.photo_url ? <img src={agent.photo_url} alt="" /> : agent.name?.[0]?.toUpperCase()}</span>
                          <span>{agent.name}</span>
                        </label>
                      ))}
                    </div>
                  </label>
                </div>
              )}

              {createMode === 'lead' && (
                <div className="form-grid">
                  <label className="field field--wide">
                    <span>Lead *</span>
                    <select value={selectedLeadId} onChange={e => setSelectedLeadId(e.currentTarget.value)} required>
                      <option value="">Seleccionar lead</option>
                      {leads?.map(l => <option key={l.id} value={l.id}>{l.name} {l.last_name} - {l.email}</option>)}
                    </select>
                  </label>
                  <label className="field field--wide">
                    <span>Agentes a invitar</span>
                    <div className="agent-multi-select">
                      {(agents ?? []).filter(a => a.id !== currentUserId).map(agent => (
                        <label key={agent.id} className={`agent-option${selectedAgentIds.includes(agent.id) ? ' selected' : ''}`}>
                          <input type="checkbox" checked={selectedAgentIds.includes(agent.id)} onChange={() => toggleAgent(agent.id)} />
                          <span className="agent-avatar-small">{agent.photo_url ? <img src={agent.photo_url} alt="" /> : agent.name?.[0]?.toUpperCase()}</span>
                          <span>{agent.name}</span>
                        </label>
                      ))}
                    </div>
                  </label>
                </div>
              )}

              <div className="form-actions">
                <button className="btn btn--ghost" onClick={() => { setShowCreateChannel(false); setSelectedAgentIds([]); setGroupName(''); }}>Cancelar</button>
                <button className="btn btn--primary" onClick={handleCreateChannel} disabled={(
                  createMode === 'direct' ? selectedAgentIds.length !== 1 :
                  createMode === 'group' ? groupName.trim() === '' || selectedAgentIds.length < 1 :
                  createMode === 'property' ? selectedPropertyId === '' :
                  createMode === 'lead' ? selectedLeadId === '' :
                  true
                )}>
                  Crear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}