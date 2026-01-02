import React, { useEffect, useState, useRef } from 'react';
import { messageService, type Message } from '../services/messageService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Send, Loader2, MessageSquare, Pencil, Trash2, X, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';

export const Chat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const { t } = useLanguage();
    const { success, error: showError } = useToast();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        loadMessages();
        const channel = messageService.subscribeToMessages((message) => {
            // Avoid duplicates - check if message already exists
            setMessages(prev => {
                const exists = prev.some(m => m.id === message.id);
                if (exists) return prev;
                return [...prev, message];
            });
            setTimeout(scrollToBottom, 100);
        });

        return () => {
            channel.unsubscribe();
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async () => {
        setLoading(true);
        try {
            const data = await messageService.getMessages(200);
            setMessages(data);
        } catch (err) {
            console.error('Failed to load messages:', err);
            showError('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const sentMessage = await messageService.sendMessage(newMessage.trim());
            // Optimistic update - add message immediately
            setMessages(prev => [...prev, sentMessage]);
            setNewMessage('');
            setTimeout(scrollToBottom, 100);
        } catch (err) {
            console.error('Failed to send message:', err);
            showError('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleEdit = async (id: string) => {
        if (!editContent.trim()) return;

        try {
            await messageService.updateMessage(id, editContent.trim());
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === id
                        ? { ...msg, content: editContent.trim(), is_edited: true }
                        : msg
                )
            );
            setEditingId(null);
            setEditContent('');
            success('Message updated');
        } catch (err) {
            console.error('Failed to edit message:', err);
            showError('Failed to edit message');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm(t('chat.deleteConfirm'))) return;

        try {
            await messageService.deleteMessage(id);
            setMessages(prev => prev.filter(msg => msg.id !== id));
            success('Message deleted');
        } catch (err) {
            console.error('Failed to delete message:', err);
            showError('Failed to delete message');
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

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const getUserName = (msg: Message) => {
        const u = msg.user;
        if (!u) return 'Unknown';
        const fullName = [u.name, u.last_name].filter(Boolean).join(' ');
        return fullName || u.email || 'Unknown';
    };

    const getInitials = (msg: Message) => {
        const u = msg.user;
        if (!u) return '?';
        if (u.name && u.last_name) return `${u.name[0]}${u.last_name[0]}`.toUpperCase();
        if (u.name) return u.name[0].toUpperCase();
        if (u.email) return u.email[0].toUpperCase();
        return '?';
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
                                        <div className="flex-shrink-0">
                                            {msg.user?.avatar_url ? (
                                                <img
                                                    src={msg.user.avatar_url}
                                                    alt={getUserName(msg)}
                                                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
                                                />
                                            ) : (
                                                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-medium">
                                                    {getInitials(msg)}
                                                </div>
                                            )}
                                        </div>
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
