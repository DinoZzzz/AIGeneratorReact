import { Monitor, Smartphone, Globe, LogOut, Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useActiveSessions, useRevokeSession } from '../../hooks/useActiveSessions';
import { useToast } from '../../context/ToastContext';
import { formatDistanceToNow } from 'date-fns';

function getDeviceIcon(os: string | null) {
    if (!os) return Globe;
    const lower = os.toLowerCase();
    if (lower.includes('android') || lower.includes('ios')) return Smartphone;
    return Monitor;
}

export const ActiveSessions = () => {
    const { t } = useLanguage();
    const { sessions, isLoading, currentDeviceId } = useActiveSessions();
    const { mutate: revokeSession, isPending: isRevoking } = useRevokeSession();
    const { addToast } = useToast();

    const handleRevoke = (sessionId: string) => {
        revokeSession(sessionId, {
            onSuccess: () => addToast(t('settings.sessionRevoked'), 'success'),
            onError: () => addToast(t('settings.sessionRevokeFailed'), 'error'),
        });
    };

    return (
        <section className="bg-card rounded-lg border border-border p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">{t('settings.activeSessions')}</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">{t('settings.activeSessionsDescription')}</p>

            {isLoading ? (
                <div className="space-y-3">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                    ))}
                </div>
            ) : sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">{t('settings.noSessions')}</p>
            ) : (
                <div className="space-y-3">
                    {sessions.map((session) => {
                        const isCurrent = session.device_id === currentDeviceId;
                        const Icon = getDeviceIcon(session.os);

                        return (
                            <div
                                key={session.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border ${
                                    isCurrent
                                        ? 'border-primary/30 bg-primary/5'
                                        : 'border-border bg-background'
                                }`}
                            >
                                <div className="flex-shrink-0 p-2 rounded-lg bg-muted">
                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {session.device_name}
                                        </p>
                                        {isCurrent && (
                                            <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                                {t('settings.currentSession')}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {t('settings.lastActive')}: {formatDistanceToNow(new Date(session.last_active_at), { addSuffix: true })}
                                    </p>
                                </div>
                                {!isCurrent && (
                                    <button
                                        onClick={() => handleRevoke(session.id)}
                                        disabled={isRevoking}
                                        className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md hover:bg-destructive/20 disabled:opacity-50 transition-colors"
                                    >
                                        {isRevoking ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <LogOut className="h-3 w-3" />
                                        )}
                                        {t('settings.revokeSession')}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
};
