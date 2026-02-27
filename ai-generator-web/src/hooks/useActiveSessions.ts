import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import {
    listSessions,
    revokeSession as revokeSessionService,
    getOrCreateDeviceId,
    type UserSession,
} from '../services/sessionService';

export function useActiveSessions() {
    const { user } = useAuth();

    const { data: sessions = [], isLoading } = useQuery({
        queryKey: ['user-sessions', user?.id],
        queryFn: () => listSessions(user!.id),
        enabled: !!user?.id,
        staleTime: 30 * 1000,
    });

    const currentDeviceId = getOrCreateDeviceId();

    return { sessions, isLoading, currentDeviceId };
}

export function useRevokeSession() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: (sessionId: string) => revokeSessionService(sessionId),
        onMutate: async (sessionId) => {
            await queryClient.cancelQueries({ queryKey: ['user-sessions', user?.id] });

            const previous = queryClient.getQueryData<UserSession[]>(['user-sessions', user?.id]);

            queryClient.setQueryData<UserSession[]>(
                ['user-sessions', user?.id],
                (old) => old?.filter((s) => s.id !== sessionId) ?? []
            );

            return { previous };
        },
        onError: (_err, _sessionId, context) => {
            if (context?.previous) {
                queryClient.setQueryData(['user-sessions', user?.id], context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['user-sessions', user?.id] });
        },
    });
}
