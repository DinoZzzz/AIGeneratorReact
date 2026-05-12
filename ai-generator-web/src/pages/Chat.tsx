import React, { useEffect, useState, useRef } from 'react';
import { messageService, type Message } from '../services/messageService';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import { useLanguage } from '../context/LanguageContext';
import { Send, Loader2, MessageSquare, Pencil, Trash2, X, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/useConfirm';
import { errorHandler, isNetworkError } from '../lib/errorHandler';
import { UserAvatar } from '../components/ui/UserAvatar';
import {
    STORES,
    addToSyncQueue,
    deleteFromStore,
    getAllFromStore,
    removeSyncOperationsForEntity,
    saveManyToStore,
    saveToStore
} from '../lib/offlineDb';

export const Chat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { user, profile } = useAuth();
    const { isOnline, triggerSync } = useOffline();
    const { t } = useLanguage();
    const { success, error: showError } = useToast();
    const confirm = useConfirm();

    const loadOfflineMessages = async (): Promise<Message[]> => {
        const cached = await getAllFromStore<Message>(STORES.MESSAGES);
        return cached.sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime());
    };

    const createOfflineMessage = async (content: string): Promise<Message> => {
        const tempId = `temp_${crypto.randomUUID()}`;
        const now = new Date().toISOString();
        const offlineMessage: Message = {
            id: tempId,
            user_id: user?.id || 'offline-user',
            content,
            created_at: now,
            updated_at: now,
            is_edited: false,
            user: {
                name: profile?.name,
                last_name: profile?.last_name,
                email: user?.email,
                avatar_url: profile?.avatar_url
            }
        };

        (offlineMessage as Message & { _is_offline?: boolean })._is_offline = true;
        await saveToStore(STORES.MESSAGES, offlineMessage);
        await addToSyncQueue(STORES.MESSAGES, 'create', {
            content,
            user_id: offlineMessage.user_id
        }, tempId);
        return offlineMessage;
    };

    const updateOfflineMessage = async (id: string, content: string): Promise<Message | null> => {
        const existing = (await getAllFromStore<Message>(STORES.MESSAGES)).find((message) => message.id === id);
        if (!existing) return null;

        const updated: Message = {
            ...existing,
            content,
            is_edited: true,
            updated_at: new Date().toISOString(),
        };

        (updated as Message & { _is_offline?: boolean })._is_offline = true;
        await saveToStore(STORES.MESSAGES, updated);
        await addToSyncQueue(STORES.MESSAGES, 'update', {
            content,
            is_edited: true,
            updated_at: updated.updated_at,
        }, id);
        return updated;
    };

    const deleteOfflineMessage = async (id: string): Promise<void> => {
        await deleteFromStore(STORES.MESSAGES, id);
        if (id.startsWith('temp_')) {
            await removeSyncOperationsForEntity(STORES.MESSAGES, id);
            return;
        }
        await addToSyncQueue(STORES.MESSAGES, 'delete', null, id);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        loadMessages();
        if (!isOnline) {
            return;
        }

        const channel = messageService.subscribeToMessages((message) => {
            // Avoid duplicates - check if message already exists
            setMessages(prev => {
                const exists = prev.some(m => m.id === message.id);
                if (exists) return prev;
                return [...prev, message];
            });
            void saveToStore(STORES.MESSAGES, message);
            setTimeout(scrollToBottom, 100);
        });

        return () => {
            channel.unsubscribe();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOnline]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async () => {
        setLoading(true);
        try {
            if (isOnline) {
                const data = await messageService.getMessages(200);
                await saveManyToStore(STORES.MESSAGES, data);
                setMessages(data);
                return;
            }

            const offlineData = await loadOfflineMessages();
            setMessages(offlineData);
        } catch (err) {
            if (isNetworkError(err)) {
                const offlineData = await loadOfflineMessages();
                setMessages(offlineData);
            } else {
                const appError = errorHandler.handle(err, 'Chat');
                showError(errorHandler.getUserMessage(appError));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            let sentMessage: Message;
            if (isOnline) {
                try {
                    sentMessage = await messageService.sendMessage(newMessage.trim());
                    await saveToStore(STORES.MESSAGES, sentMessage);
                } catch (error) {
                    if (!isNetworkError(error)) throw error;
                    sentMessage = await createOfflineMessage(newMessage.trim());
                }
            } else {
                sentMessage = await createOfflineMessage(newMessage.trim());
            }

            // Optimistic update - add message immediately
            setMessages(prev => [...prev, sentMessage]);
            setNewMessage('');
            setTimeout(scrollToBottom, 100);
            if (isOnline) {
                await triggerSync();
            }
        } catch (err) {
            const appError = errorHandler.handle(err, 'Chat');
            showError(errorHandler.getUserMessage(appError));
        } finally {
            setSending(false);
        }
    };

    const handleEdit = async (id: string) => {
        if (!editContent.trim()) return;

        try {
            const nextContent = editContent.trim();
            if (isOnline) {
                try {
                    const updated = await messageService.updateMessage(id, nextContent);
                    await saveToStore(STORES.MESSAGES, updated);
                } catch (error) {
                    if (!isNetworkError(error)) throw error;
                    await updateOfflineMessage(id, nextContent);
                }
            } else {
                await updateOfflineMessage(id, nextContent);
            }

            setMessages(prev =>
                prev.map(msg =>
                    msg.id === id
                        ? { ...msg, content: nextContent, is_edited: true }
                        : msg
                )
            );
            setEditingId(null);
            setEditContent('');
            success('Message updated');
            if (isOnline) {
                await triggerSync();
            }
        } catch (err) {
            const appError = errorHandler.handle(err, 'Chat');
            showError(errorHandler.getUserMessage(appError));
        }
    };

    const handleDelete = async (id: string) => {
        if (!(await confirm({ title: t('chat.deleteConfirm'), variant: 'destructive' }))) return;

        try {
            if (isOnline) {
                try {
                    await messageService.deleteMessage(id);
                    await deleteFromStore(STORES.MESSAGES, id);
                } catch (error) {
                    if (!isNetworkError(error)) throw error;
                    await deleteOfflineMessage(id);
                }
            } else {
                await deleteOfflineMessage(id);
            }

            setMessages(prev => prev.filter(msg => msg.id !== id));
            success('Message deleted');
            if (isOnline) {
                await triggerSync();
            }
        } catch (err) {
            const appError = errorHandler.handle(err, 'Chat');
            showError(errorHandler.getUserMessage(appError));
        }
    };

    const startEdit = (msg: Message) => {
        setEditingId(msg.id);
        setEditContent(msg.content);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditContent('');
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return t('chat.justNow');
        if (minutes < 60) return t('chat.minutesAgo').replace('{count}', String(minutes));
        if (hours < 24) return t('chat.hoursAgo').replace('{count}', String(hours));
        if (days < 7) return t('chat.daysAgo').replace('{count}', String(days));
        return date.toLocaleDateString();
    };

    const getUserName = (msg: Message) => {
        const u = msg.user;
        if (!u) return t('common.unknown');
        const fullName = [u.name, u.last_name].filter(Boolean).join(' ');
        return fullName || u.email || t('common.unknown');
    };

    return (
        <div className="h-[calc(100vh-10rem)] lg:h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="border-b border-border bg-card p-3 sm:p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center">
                            <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-primary" />
                            {t('chat.title')}
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">{t('chat.subtitle')}</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 bg-muted/20">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">{t('chat.noMessages')}</p>
                        <p className="text-sm">{t('chat.startConversation')}</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isOwn = msg.user_id === user?.id;
                        const showAvatar = idx === 0 || messages[idx - 1].user_id !== msg.user_id;

                        return (
                            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-2 sm:gap-3 max-w-[85%] sm:max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Avatar */}
                                    {showAvatar ? (
                                        <UserAvatar
                                            src={msg.user?.avatar_url}
                                            name={msg.user?.name}
                                            email={msg.user?.email}
                                            id={msg.user_id}
                                            size="sm"
                                        />
                                    ) : (
                                        <div className="w-7 sm:w-8" />
                                    )}

                                    {/* Message */}
                                    <div className="flex-1">
                                        {showAvatar && (
                                            <div className={`text-xs text-muted-foreground mb-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                                                {getUserName(msg)} · {formatTime(msg.created_at)}
                                            </div>
                                        )}

                                        {editingId === msg.id ? (
                                            <div className={`bg-card border border-border rounded-lg p-3`}>
                                                <textarea
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    className="w-full bg-background border border-input rounded p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                                                    rows={2}
                                                    autoFocus
                                                />
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={() => handleEdit(msg.id)}
                                                        className="text-primary hover:text-primary/80 text-xs"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={cancelEdit}
                                                        className="text-muted-foreground hover:text-foreground text-xs"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`rounded-lg p-3 ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'} group relative`}>
                                                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                                {msg.is_edited && (
                                                    <span className="text-xs opacity-70 ml-2">({t('chat.edited')})</span>
                                                )}

                                                {/* Actions */}
                                                {isOwn && (
                                                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                        <button
                                                            onClick={() => startEdit(msg)}
                                                            className={`p-1 rounded hover:bg-black/10 ${isOwn ? 'text-primary-foreground' : 'text-foreground'}`}
                                                            title={t('chat.edit')}
                                                        >
                                                            <Pencil className="h-3 w-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(msg.id)}
                                                            className={`p-1 rounded hover:bg-black/10 ${isOwn ? 'text-primary-foreground' : 'text-foreground'}`}
                                                            title={t('chat.delete')}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="border-t border-border bg-card p-2 sm:p-4">
                <div className="flex gap-2">
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={t('chat.inputPlaceholder')}
                        className="flex-1 bg-background border border-input rounded-lg px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px] max-h-32"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend(e);
                            }
                        }}
                        disabled={sending}
                    />
                    <Button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        loading={sending}
                        className="px-4"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                    <span className="hidden sm:inline">{newMessage.length}/5000 {' · '} Press Enter to send, Shift+Enter for new line</span>
                    <span className="sm:hidden">{newMessage.length}/5000</span>
                </div>
            </form>
        </div>
    );
};
