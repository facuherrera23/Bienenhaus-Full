import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
    Check,
    CheckCheck,
    ChevronLeft,
    ChevronUp,
    Edit2,
    Home,
    Image,
    MessageSquare,
    MoreHorizontal,
    Paperclip,
    Plus,
    Reply,
    Search,
    Send,
    Smile,
    UserPlus,
    Users,
    X,
} from 'lucide-preact';
import { useAuthUserId } from '../lib/auth';
import {
    CHANNEL_TYPE_LABEL,
    type ChatChannel,
    type ChatMessage,
    createDirectChannel,
    createGroupChannel,
    createLeadChannel,
    createPropertyChannel,
    editMessage,
    fetchChannels,
    fetchMessages,
    markChannelAsRead,
    MESSAGE_TYPE_LABEL,
    sendMessage,
    subscribeToChannelMessages,
} from '../lib/chat';
import { fetchAgents } from '../lib/agents';
import { fetchProperties } from '../lib/properties';
import { fetchLeads } from '../lib/leads';
import { queryClient } from '../lib/query/client';
import { useQuery } from '../lib/query/hooks';
import { pushToast } from '../store/app';
import { ImageLightbox } from '../components/ImageLightbox';
import { Button, IconButton, Spinner } from '@bienenhaus/ui';
import styles from './ChatPage.module.css';

export function ChatPage() {
    const currentUserId = useAuthUserId();
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
    const [showChannelList, setShowChannelList] = useState(true);
    const [messageText, setMessageText] = useState('');
    const [showCreateChannel, setShowCreateChannel] = useState(false);
    const [createMode, setCreateMode] = useState<'direct' | 'group' | 'property' | 'lead'>(
        'direct',
    );
    const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
    const [selectedLeadId, setSelectedLeadId] = useState<string>('');
    const [groupName, setGroupName] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageInputRef = useRef<HTMLInputElement>(null);
    const [sending, setSending] = useState(false);
    const [aiThinking, setAiThinking] = useState(false);

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

    const { data: agents } = useQuery({ queryKey: ['agents'], queryFn: fetchAgents });
    const { data: properties } = useQuery({ queryKey: ['properties'], queryFn: fetchProperties });
    const { data: leads } = useQuery({ queryKey: ['leads'], queryFn: fetchLeads });
    const { data: channels, isPending: channelsPending } = useQuery({
        queryKey: ['chat-channels', currentUserId],
        queryFn: () => (currentUserId ? fetchChannels(currentUserId) : Promise.resolve([])),
        enabled: !!currentUserId,
    });

    const activeChannel = useMemo(
        () => channels?.find((c) => c.id === selectedChannelId) ?? null,
        [channels, selectedChannelId],
    );

    const aiParticipant = useMemo(
        () => activeChannel?.participants.find((p) => p.is_ai) ?? null,
        [activeChannel],
    );

    useEffect(() => {
        setAiThinking(false);
    }, [selectedChannelId, aiParticipant?.agent_id]);

    const { data: messages, isPending: messagesPending } = useQuery({
        queryKey: ['chat-messages', selectedChannelId],
        queryFn: () =>
            selectedChannelId
                ? fetchMessages(selectedChannelId, undefined, 100)
                : Promise.resolve([]),
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
                queryClient.setQueryData<ChatMessage[]>(['chat-messages', selectedChannelId], (old) => {
                    if (!old) return [msg];
                    if (old.some((m) => m.id === msg.id)) return old;
                    return [...old, msg];
                });
                if (aiParticipant && msg.sender_id === aiParticipant.agent_id) {
                    setAiThinking(false);
                }
                scrollToBottom();
            },
            (msg) => {
                queryClient.setQueryData<ChatMessage[]>(
                    ['chat-messages', selectedChannelId],
                    (old) => old?.map((m) => (m.id === msg.id ? msg : m)) ?? [],
                );
            },
            (messageId) => {
                queryClient.setQueryData<ChatMessage[]>(
                    ['chat-messages', selectedChannelId],
                    (old) => old?.filter((m) => m.id !== messageId) ?? [],
                );
            },
        );
        return unsubscribe;
    }, [selectedChannelId, aiParticipant]);

    const handleSend = async (e: Event) => {
        e.preventDefault();
        if (!messageText.trim() || !selectedChannelId || sending) return;

        setSending(true);
        try {
            await sendMessage(selectedChannelId, currentUserId!, messageText.trim());
            setMessageText('');
            scrollToBottom();

            if (aiParticipant) {
                setAiThinking(true);
            }
        } catch (err) {
            pushToast({
                type: 'error',
                title: 'Error enviando mensaje',
                description: (err as Error).message,
            });
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
            messageInputRef.current?.focus();
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
            const newMessages = await fetchMessages(selectedChannelId, oldestMsg?.created_at, 50);
            if (newMessages.length < 50) setHasMoreMessages(false);
            queryClient.setQueryData(['chat-messages', selectedChannelId], (old: ChatMessage[]) => [
                ...newMessages,
                ...(old ?? []),
            ]);
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
                channel = await createDirectChannel(
                    [currentUserId, selectedAgentIds[0]],
                    currentUserId,
                );
            } else if (createMode === 'group') {
                if (!groupName.trim() || selectedAgentIds.length < 1) {
                    pushToast({ type: 'error', title: 'Nombre y al menos un agente requeridos' });
                    return;
                }
                channel = await createGroupChannel(
                    groupName,
                    [currentUserId, ...selectedAgentIds],
                    currentUserId,
                );
            } else if (createMode === 'property') {
                if (!selectedPropertyId) {
                    pushToast({ type: 'error', title: 'Seleccioná una propiedad' });
                    return;
                }
                channel = await createPropertyChannel(
                    selectedPropertyId,
                    [currentUserId, ...selectedAgentIds],
                    currentUserId,
                );
            } else if (createMode === 'lead') {
                if (!selectedLeadId) {
                    pushToast({ type: 'error', title: 'Seleccioná un lead' });
                    return;
                }
                channel = await createLeadChannel(
                    selectedLeadId,
                    [currentUserId, ...selectedAgentIds],
                    currentUserId,
                );
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
            pushToast({
                type: 'error',
                title: 'Error creando canal',
                description: (err as Error).message,
            });
        }
    };

    const toggleAgent = (agentId: string) => {
        setSelectedAgentIds((prev) =>
            prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId],
        );
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
        <div className={`page ${styles['chat-page']}`}>
            <div className={styles['chat-layout']}>
                {/* Sidebar - Channel List */}
                <aside
                    className={`${styles['chat-sidebar']}${showChannelList ? ` ${styles.open}` : ''}`}
                >
                    <div className={styles['chat-sidebar-header']}>
                        <h2>Mensajes</h2>
                        <div className={styles['sidebar-actions']}>
                            <IconButton
                                variant="ghost"
                                aria-label="Crear conversación"
                                onClick={() => {
                                    setCreateMode('direct');
                                    setShowCreateChannel(true);
                                }}
                            >
                                <Plus size={18} />
                            </IconButton>
                            {window.innerWidth < 768 && (
                                <IconButton
                                    variant="ghost"
                                    aria-label="Cerrar lista de conversaciones"
                                    onClick={() => setShowChannelList(false)}
                                >
                                    <ChevronLeft size={18} />
                                </IconButton>
                            )}
                        </div>
                    </div>

                    <div className={styles['chat-search']}>
                        <Search size={16} />
                        <input type="text" placeholder="Buscar conversaciones..." />
                    </div>

                    {channelsPending && <div className={styles['chat-loading']}>Cargando…</div>}

                    {!channelsPending && channels && channels.length === 0 && (
                        <div className={styles['chat-empty']}>
                            <MessageSquare size={48} />
                            <h3>Sin conversaciones</h3>
                            <p>Creá tu primer chat</p>
                        </div>
                    )}

                    {!channelsPending && channels && channels.length > 0 && (
                        <ul className={styles['chat-channel-list']}>
                            {channels.map((channel) => (
                                <li
                                    key={channel.id}
                                    className={`${styles['chat-channel-item']}${selectedChannelId === channel.id ? ` ${styles.active}` : ''}`}
                                    onClick={() => handleChannelClick(channel)}
                                >
                                    <div className={styles['channel-avatar']}>
                                        {channel.type === 'direct' &&
                                        channel.participants.length === 1 ? (
                                            channel.participants[0].agent_photo_url ? (
                                                <img
                                                    src={channel.participants[0].agent_photo_url}
                                                    alt=""
                                                />
                                            ) : (
                                                <span>
                                                    {channel.participants[0].agent_name?.[0]?.toUpperCase()}
                                                </span>
                                            )
                                        ) : channel.type === 'group' ? (
                                            <Users size={20} />
                                        ) : channel.type === 'property' ? (
                                            <Home size={20} />
                                        ) : (
                                            <UserPlus size={20} />
                                        )}
                                    </div>
                                    <div className={styles['channel-info']}>
                                        <div className={styles['channel-header']}>
                                            <span className={styles['channel-name']}>
                                                {channel.type === 'direct' &&
                                                channel.participants.length === 1
                                                    ? channel.participants[0].agent_name
                                                    : (channel.name ??
                                                      (channel.type === 'group'
                                                          ? 'Grupo'
                                                          : CHANNEL_TYPE_LABEL[channel.type]))}
                                            </span>
                                            {channel.last_message && (
                                                <span className={styles['channel-time']}>
                                                    {formatTime(channel.last_message.created_at)}
                                                </span>
                                            )}
                                        </div>
                                        <div className={styles['channel-preview']}>
                                            {channel.last_message && (
                                                <>
                                                    {channel.last_message.sender_id ===
                                                    currentUserId
                                                        ? 'Tú: '
                                                        : ''}
                                                    {channel.last_message.message_type !==
                                                        'text' && (
                                                        <span className={styles['msg-type-badge']}>
                                                            [
                                                            {
                                                                MESSAGE_TYPE_LABEL[
                                                                    channel.last_message
                                                                        .message_type
                                                                ]
                                                            }
                                                            ]
                                                        </span>
                                                    )}
                                                    {channel.last_message.content}
                                                </>
                                            )}
                                        </div>
                                        {channel.unread_count > 0 && (
                                            <span className={styles['unread-badge']}>
                                                {channel.unread_count > 9
                                                    ? '9+'
                                                    : channel.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </aside>

                {/* Main Chat Area */}
                <main className={styles['chat-main']}>
                    {selectedChannelId ? (
                        <>
                            <header className={styles['chat-header']}>
                                <div className={styles['header-left']}>
                                    {window.innerWidth < 768 && (
                                        <IconButton
                                            variant="ghost"
                                            aria-label="Volver a conversaciones"
                                            onClick={() => setShowChannelList(true)}
                                        >
                                            <ChevronLeft size={20} />
                                        </IconButton>
                                    )}
                                    <div className={styles['header-avatar']}>
                                        {activeChannel?.type === 'direct' &&
                                        activeChannel.participants.length === 1 ? (
                                            activeChannel.participants[0].agent_photo_url ? (
                                                <img
                                                    src={
                                                        activeChannel.participants[0]
                                                            .agent_photo_url
                                                    }
                                                    alt=""
                                                />
                                            ) : (
                                                <span>
                                                    {activeChannel.participants[0].agent_name?.[0]?.toUpperCase()}
                                                </span>
                                            )
                                        ) : activeChannel?.type === 'group' ? (
                                            <Users size={24} />
                                        ) : activeChannel?.type === 'property' ? (
                                            <Home size={24} />
                                        ) : (
                                            <UserPlus size={24} />
                                        )}
                                    </div>
                                    <div className={styles['header-info']}>
                                        <h3>
                                            {activeChannel?.type === 'direct' &&
                                            activeChannel.participants.length === 1
                                                ? activeChannel.participants[0].agent_name
                                                : (activeChannel?.name ??
                                                  (activeChannel?.type === 'group'
                                                      ? 'Grupo'
                                                      : CHANNEL_TYPE_LABEL[
                                                            activeChannel?.type ?? 'direct'
                                                        ]))}
                                        </h3>
                                        <span className={styles['header-subtitle']}>
                                            {activeChannel?.participants.length} participante
                                            {activeChannel?.participants.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles['header-actions']}>
                                    <IconButton
                                        variant="ghost"
                                        title="Información del canal"
                                        aria-label="Información del canal"
                                    >
                                        <MoreHorizontal size={18} />
                                    </IconButton>
                                </div>
                            </header>

                            <div className={styles['chat-messages']} role="log" aria-live="polite">
                                {messagesPending ? (
                                    <div className={styles['messages-loading']}>
                                        <Spinner size="md" inline color="inherit" />
                                    </div>
                                ) : messages && messages.length === 0 ? (
                                    <div className={styles['messages-empty']}>
                                        <MessageSquare size={48} />
                                        <h3>No hay mensajes aún</h3>
                                        <p>Enviá el primer mensaje</p>
                                    </div>
                                ) : (
                                    <>
                                        {hasMoreMessages && (
                                            <div className={styles['load-more-container']}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={loadMoreMessages}
                                                    disabled={loadingMore}
                                                >
                                                    {loadingMore ? (
                                                        <Spinner size="sm" inline color="inherit" />
                                                    ) : (
                                                        <ChevronUp size={14} />
                                                    )}{' '}
                                                    Cargar más
                                                </Button>
                                            </div>
                                        )}
                                        {messages?.map((msg, idx) => {
                                            const showDate =
                                                idx === 0 ||
                                                formatDate(msg.created_at) !==
                                                    formatDate(messages[idx - 1]?.created_at);
                                            const isOwn = isOwnMessage(msg);
                                            const isEditing = editingMessageId === msg.id;
                                            const showActions = isOwn && !isEditing;
                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={styles['message-group']}
                                                >
                                                    {showDate && (
                                                        <div
                                                            className={
                                                                styles['message-date-divider']
                                                            }
                                                        >
                                                            {formatDate(msg.created_at)}
                                                        </div>
                                                    )}
                                                    <div
                                                        className={`${styles.message}${isOwn ? ` ${styles.own}` : ''}`}
                                                    >
                                                        {!isOwn && (
                                                            <div
                                                                className={styles['message-avatar']}
                                                            >
                                                                {msg.sender_photo_url ? (
                                                                    <img
                                                                        src={msg.sender_photo_url}
                                                                        alt=""
                                                                    />
                                                                ) : (
                                                                    <span>
                                                                        {msg.sender_name?.[0]?.toUpperCase()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                        <div className={styles['message-content']}>
                                                            <div
                                                                className={styles['message-header']}
                                                            >
                                                                {!isOwn && (
                                                                    <span
                                                                        className={
                                                                            styles['message-sender']
                                                                        }
                                                                    >
                                                                        {msg.sender_name}
                                                                    </span>
                                                                )}
                                                                <span
                                                                    className={
                                                                        styles['message-time']
                                                                    }
                                                                >
                                                                    {formatTime(msg.created_at)}
                                                                </span>
                                                                {showActions && (
                                                                    <div
                                                                        className={
                                                                            styles[
                                                                                'message-actions'
                                                                            ]
                                                                        }
                                                                    >
                                                                        <button
                                                                            className={
                                                                                styles[
                                                                                    'icon-btn-sm'
                                                                                ]
                                                                            }
                                                                            title="Responder"
                                                                            onClick={() =>
                                                                                startReply(msg)
                                                                            }
                                                                        >
                                                                            <Reply size={14} />
                                                                        </button>
                                                                        <button
                                                                            className={
                                                                                styles[
                                                                                    'icon-btn-sm'
                                                                                ]
                                                                            }
                                                                            title="Editar"
                                                                            onClick={() =>
                                                                                startEdit(msg)
                                                                            }
                                                                        >
                                                                            <Edit2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div
                                                                className={styles['message-bubble']}
                                                            >
                                                                {msg.message_type === 'image' &&
                                                                    msg.file_url && (
                                                                        <a
                                                                            href={msg.file_url}
                                                                            target="_blank"
                                                                            rel="noopener"
                                                                            className={
                                                                                styles[
                                                                                    'message-image'
                                                                                ]
                                                                            }
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                openImageLightbox(
                                                                                    msg.file_url!,
                                                                                    msg.file_name ??
                                                                                        'Imagen',
                                                                                );
                                                                            }}
                                                                        >
                                                                            <img
                                                                                src={msg.file_url}
                                                                                alt={
                                                                                    msg.file_name ??
                                                                                    'Imagen'
                                                                                }
                                                                                loading="lazy"
                                                                            />
                                                                        </a>
                                                                    )}
                                                                {msg.message_type === 'file' &&
                                                                    msg.file_url && (
                                                                        <a
                                                                            href={msg.file_url}
                                                                            target="_blank"
                                                                            rel="noopener"
                                                                            className={
                                                                                styles[
                                                                                    'message-file'
                                                                                ]
                                                                            }
                                                                        >
                                                                            <Paperclip size={18} />{' '}
                                                                            {msg.file_name}
                                                                        </a>
                                                                    )}
                                                                {isEditing ? (
                                                                    <input
                                                                        type="text"
                                                                        value={editText}
                                                                        onChange={(e) =>
                                                                            setEditText(
                                                                                e.currentTarget
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter')
                                                                                saveEdit(msg);
                                                                            if (e.key === 'Escape')
                                                                                cancelEdit();
                                                                        }}
                                                                        autoFocus
                                                                        className={
                                                                            styles['edit-input']
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <>
                                                                        {msg.content && (
                                                                            <div
                                                                                className={
                                                                                    styles[
                                                                                        'message-text'
                                                                                    ]
                                                                                }
                                                                            >
                                                                                {msg.content}
                                                                            </div>
                                                                        )}
                                                                        {msg.reply_to && (
                                                                            <div
                                                                                className={
                                                                                    styles[
                                                                                        'message-reply'
                                                                                    ]
                                                                                }
                                                                            >
                                                                                <span
                                                                                    className={
                                                                                        styles[
                                                                                            'reply-sender'
                                                                                        ]
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        msg.reply_to
                                                                                            .sender_name
                                                                                    }
                                                                                </span>
                                                                                <span
                                                                                    className={
                                                                                        styles[
                                                                                            'reply-text'
                                                                                        ]
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        msg.reply_to
                                                                                            .content
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                            <div
                                                                className={styles['message-status']}
                                                            >
                                                                {isOwn && (
                                                                    <>
                                                                        <Check
                                                                            size={14}
                                                                            className={
                                                                                msg.read_by &&
                                                                                msg.read_by.length >
                                                                                    0
                                                                                    ? styles.read
                                                                                    : styles.sent
                                                                            }
                                                                            title={
                                                                                msg.read_by &&
                                                                                msg.read_by.length >
                                                                                    0
                                                                                    ? `Leído por ${msg.read_by.length} persona${msg.read_by.length > 1 ? 's' : ''}`
                                                                                    : 'Enviado'
                                                                            }
                                                                        />
                                                                        {msg.read_by &&
                                                                            msg.read_by.length >
                                                                                0 && (
                                                                                <CheckCheck
                                                                                    size={14}
                                                                                    className={
                                                                                        styles.read
                                                                                    }
                                                                                    title="Leído"
                                                                                />
                                                                            )}
                                                                    </>
                                                                )}
                                                                {!isOwn &&
                                                                    replyingToId === msg.id && (
                                                                        <button
                                                                            className={
                                                                                styles[
                                                                                    'icon-btn-sm'
                                                                                ]
                                                                            }
                                                                            onClick={cancelReply}
                                                                            title="Cancelar respuesta"
                                                                        >
                                                                            <X size={14} />
                                                                        </button>
                                                                    )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {aiThinking && (
                                            <div
                                                className={styles['ai-typing']}
                                                role="status"
                                                aria-label="El asistente IA está escribiendo"
                                            >
                                                <Spinner size="sm" inline color="inherit" />
                                                <span>Asistente escribiendo…</span>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </>
                                )}
                            </div>

                            <footer className={styles['chat-footer']}>
                                <form onSubmit={handleSend} className={styles['message-form']}>
                                    <div className={styles['message-input-wrapper']}>
                                        <button
                                            type="button"
                                            className={styles['attach-btn']}
                                            title="Adjuntar archivo"
                                        >
                                            <Paperclip size={20} />
                                        </button>
                                        <button
                                            type="button"
                                            className={styles['attach-btn']}
                                            title="Adjuntar imagen"
                                        >
                                            <Image size={20} />
                                        </button>
                                        <button
                                            type="button"
                                            className={styles['attach-btn']}
                                            title="Emoji"
                                        >
                                            <Smile size={20} />
                                        </button>
                                        <input
                                            type="text"
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.currentTarget.value)}
                                            placeholder="Escribí un mensaje..."
                                            ref={messageInputRef}
                                            className={styles['message-input']}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSend(e);
                                                }
                                            }}
                                        />
                                        <button
                                            type="submit"
                                            className={styles['send-btn']}
                                            disabled={!messageText.trim() || sending}
                                        >
                                            {sending ? (
                                                <Spinner size="sm" inline color="inherit" />
                                            ) : (
                                                <Send size={18} />
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </footer>
                        </>
                    ) : (
                        <div className={styles['chat-welcome']}>
                            <MessageSquare size={64} />
                            <h2>Bienvenido al Chat</h2>
                            <p>Seleccioná una conversación o creá una nueva para empezar.</p>
                            <Button
                                onClick={() => {
                                    setCreateMode('direct');
                                    setShowCreateChannel(true);
                                }}
                            >
                                <Plus size={16} /> Nueva conversación
                            </Button>
                        </div>
                    )}
                </main>
            </div>

            {/* Image Lightbox Modal */}
            <ImageLightbox image={imageLightbox} onClose={closeImageLightbox} />

            {/* Create Channel Modal */}
            {showCreateChannel && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowCreateChannel(false)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="modal-container modal--medium"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className="modal-close" onClick={() => setShowCreateChannel(false)}>
                            <ChevronLeft size={20} />
                        </button>
                        <div className="modal-content">
                            <h2>Nueva conversación</h2>
                            <div className={styles['create-mode-tabs']}>
                                {(['direct', 'group', 'property', 'lead'] as const).map((mode) => (
                                    <button
                                        key={mode}
                                        className={`${styles['mode-tab']}${createMode === mode ? ` ${styles.active}` : ''}`}
                                        onClick={() => {
                                            setCreateMode(mode);
                                            setSelectedAgentIds([]);
                                        }}
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
                                <div className={styles['agent-selector']}>
                                    <label>Seleccioná un agente</label>
                                    <div className={styles['agent-list']}>
                                        {(agents ?? [])
                                            .filter((a) => a.id !== currentUserId)
                                            .map((agent) => (
                                                <label
                                                    key={agent.id}
                                                    className={`${styles['agent-option']}${selectedAgentIds.includes(agent.id) ? ` ${styles.selected}` : ''}`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="direct-agent"
                                                        checked={selectedAgentIds.includes(
                                                            agent.id,
                                                        )}
                                                        onChange={() =>
                                                            setSelectedAgentIds([agent.id])
                                                        }
                                                    />
                                                    <span className={styles['agent-avatar-small']}>
                                                        {agent.photo_url ? (
                                                            <img src={agent.photo_url} alt="" />
                                                        ) : (
                                                            agent.name?.[0]?.toUpperCase()
                                                        )}
                                                    </span>
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
                                        <input
                                            type="text"
                                            value={groupName}
                                            onChange={(e) => setGroupName(e.currentTarget.value)}
                                            placeholder="Ej: Equipo de ventas"
                                            required
                                        />
                                    </label>
                                    <label className="field field--wide">
                                        <span>Participantes *</span>
                                        <div className={styles['agent-multi-select']}>
                                            {(agents ?? [])
                                                .filter((a) => a.id !== currentUserId)
                                                .map((agent) => (
                                                    <label
                                                        key={agent.id}
                                                        className={`${styles['agent-option']}${selectedAgentIds.includes(agent.id) ? ` ${styles.selected}` : ''}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedAgentIds.includes(
                                                                agent.id,
                                                            )}
                                                            onChange={() => toggleAgent(agent.id)}
                                                        />
                                                        <span
                                                            className={styles['agent-avatar-small']}
                                                        >
                                                            {agent.photo_url ? (
                                                                <img src={agent.photo_url} alt="" />
                                                            ) : (
                                                                agent.name?.[0]?.toUpperCase()
                                                            )}
                                                        </span>
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
                                        <select
                                            value={selectedPropertyId}
                                            onChange={(e) =>
                                                setSelectedPropertyId(e.currentTarget.value)
                                            }
                                            required
                                        >
                                            <option value="">Seleccionar propiedad</option>
                                            {properties?.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.title}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="field field--wide">
                                        <span>Agentes a invitar</span>
                                        <div className={styles['agent-multi-select']}>
                                            {(agents ?? [])
                                                .filter((a) => a.id !== currentUserId)
                                                .map((agent) => (
                                                    <label
                                                        key={agent.id}
                                                        className={`${styles['agent-option']}${selectedAgentIds.includes(agent.id) ? ` ${styles.selected}` : ''}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedAgentIds.includes(
                                                                agent.id,
                                                            )}
                                                            onChange={() => toggleAgent(agent.id)}
                                                        />
                                                        <span
                                                            className={styles['agent-avatar-small']}
                                                        >
                                                            {agent.photo_url ? (
                                                                <img src={agent.photo_url} alt="" />
                                                            ) : (
                                                                agent.name?.[0]?.toUpperCase()
                                                            )}
                                                        </span>
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
                                        <select
                                            value={selectedLeadId}
                                            onChange={(e) =>
                                                setSelectedLeadId(e.currentTarget.value)
                                            }
                                            required
                                        >
                                            <option value="">Seleccionar lead</option>
                                            {leads?.data?.map((l) => (
                                                <option key={l.id} value={l.id}>
                                                    {l.name} {l.last_name} - {l.email}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="field field--wide">
                                        <span>Agentes a invitar</span>
                                        <div className={styles['agent-multi-select']}>
                                            {(agents ?? [])
                                                .filter((a) => a.id !== currentUserId)
                                                .map((agent) => (
                                                    <label
                                                        key={agent.id}
                                                        className={`${styles['agent-option']}${selectedAgentIds.includes(agent.id) ? ` ${styles.selected}` : ''}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedAgentIds.includes(
                                                                agent.id,
                                                            )}
                                                            onChange={() => toggleAgent(agent.id)}
                                                        />
                                                        <span
                                                            className={styles['agent-avatar-small']}
                                                        >
                                                            {agent.photo_url ? (
                                                                <img src={agent.photo_url} alt="" />
                                                            ) : (
                                                                agent.name?.[0]?.toUpperCase()
                                                            )}
                                                        </span>
                                                        <span>{agent.name}</span>
                                                    </label>
                                                ))}
                                        </div>
                                    </label>
                                </div>
                            )}

                            <div className="form-actions">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setShowCreateChannel(false);
                                        setSelectedAgentIds([]);
                                        setGroupName('');
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleCreateChannel}
                                    disabled={
                                        createMode === 'direct'
                                            ? selectedAgentIds.length !== 1
                                            : createMode === 'group'
                                              ? groupName.trim() === '' ||
                                                selectedAgentIds.length < 1
                                              : createMode === 'property'
                                                ? selectedPropertyId === ''
                                                : createMode === 'lead'
                                                  ? selectedLeadId === ''
                                                  : true
                                    }
                                >
                                    Crear
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
