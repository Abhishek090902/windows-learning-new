import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { connectSocket, disconnectSocket } from '@/lib/socket';

export const useSocketSync = () => {
  const queryClient = useQueryClient();
  const { token, user, refreshUser } = useAuth();

  useEffect(() => {
    if (!token || !user) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket(token);

    const currentUserId = user.id;
    const invalidateDashboardData = () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['mentors'] });
    };

    socket.on('connect', () => {
      console.log('Socket connected for real-time sync');
    });

    socket.on('data_update', (data: { type: string }) => {
      console.log('Real-time data update received:', data.type);
      
      switch (data.type) {
        case 'wallet':
          queryClient.invalidateQueries({ queryKey: ['wallet'] });
          // Dashboard analytics depends on wallet totals
          queryClient.invalidateQueries({ queryKey: ['analytics'] });
          break;
        case 'sessions':
          queryClient.invalidateQueries({ queryKey: ['sessions'] });
          // Dashboard analytics depends on sessions totals
          queryClient.invalidateQueries({ queryKey: ['analytics'] });
          break;
        case 'requirements':
          queryClient.invalidateQueries({ queryKey: ['requirements'] });
          queryClient.invalidateQueries({ queryKey: ['requirement'] });
          break;
        case 'proposals':
          queryClient.invalidateQueries({ queryKey: ['proposals'] });
          queryClient.invalidateQueries({ queryKey: ['requirements'] });
          queryClient.invalidateQueries({ queryKey: ['analytics'] });
          break;
        case 'notifications':
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          break;
        case 'analytics':
          queryClient.invalidateQueries({ queryKey: ['analytics'] });
          break;
        case 'user':
        case 'profile':
          // AuthContext user state isn't tied to React Query,
          // so we refresh it directly to keep sidebar + settings in sync.
          queryClient.invalidateQueries({ queryKey: ['mentor-profile', 'me'] });
          refreshUser();
          break;
        case 'mentors':
          queryClient.invalidateQueries({ queryKey: ['mentors'] });
          break;
        default:
          // Global refresh if type unknown
          invalidateDashboardData();
      }
    });

    socket.on('receive_message', (payload: { senderId: string; receiverId: string }) => {
      // When the current user receives a message, refresh the inbox + the relevant thread.
      queryClient.invalidateQueries({ queryKey: ['chat_conversations'] });
      if (payload.receiverId === currentUserId) {
        queryClient.invalidateQueries({ queryKey: ['messages', payload.senderId] });
      }
    });

    socket.on('message_sent', (payload: { senderId: string; receiverId: string }) => {
      // When the current user sends a message, refresh the inbox + the relevant thread.
      queryClient.invalidateQueries({ queryKey: ['chat_conversations'] });
      if (payload.senderId === currentUserId) {
        queryClient.invalidateQueries({ queryKey: ['messages', payload.receiverId] });
      }
    });

    socket.on('new_notification', () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    });

    socket.on('session_status_update', () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    });

    return () => {
      socket.off('connect');
      socket.off('data_update');
      socket.off('receive_message');
      socket.off('message_sent');
      socket.off('new_notification');
      socket.off('session_status_update');
    };
  }, [token, user, refreshUser, queryClient]);
};
