import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  createSessionViaEdge,
  getMySessionsViaEdge,
  updateSessionStatusViaEdge,
} from '@/lib/supabaseEdgeApi';

const shouldUseEdgeSessions = import.meta.env.VITE_USE_SUPABASE_EDGE_SESSIONS === 'true';

// Mentors
export const useMentors = (filters: any = {}) => {
  return useQuery({
    queryKey: ['mentors', filters],
    queryFn: async () => {
      const response = await api.get('/mentors', { params: filters });
      return response.data.data;
    },
  });
};

export const useMentor = (id: string) => {
  return useQuery({
    queryKey: ['mentor', id],
    queryFn: async () => {
      const response = await api.get(`/mentors/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
};

export const useMyMentorProfile = () => {
  return useQuery({
    queryKey: ['mentor-profile', 'me'],
    queryFn: async () => {
      const response = await api.get('/mentor-profiles/my/profile');
      return response.data.data;
    },
  });
};

export const useUpdateMyMentorProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const profileResponse = await api.get('/mentor-profiles/my/profile');
      const profile = profileResponse.data.data;
      const response = await api.put(`/mentor-profiles/${profile.id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-profile', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['mentor'] });
      queryClient.invalidateQueries({ queryKey: ['mentors'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'mentor'] });
    },
  });
};

export const useUpdateMentorAvailability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (schedule: any) => {
      const response = await api.patch('/mentors/availability', { schedule });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-profile', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'mentor'] });
      queryClient.invalidateQueries({ queryKey: ['mentors'] });
    },
  });
};

export const useMentorByUserId = (userId: string) => {
  return useQuery({
    queryKey: ['mentor-by-user-id', userId],
    queryFn: async () => {
      const response = await api.get('/mentors');
      const mentors = response.data.data;
      return mentors.find((mentor: any) => mentor.userId === userId);
    },
    enabled: !!userId,
  });
};

// Sessions
export const useLearnerSessions = () => {
  return useQuery({
    queryKey: ['sessions', 'learner'],
    queryFn: async () => {
      if (shouldUseEdgeSessions) {
        const response = await getMySessionsViaEdge();
        return response.data;
      }

      const response = await api.get('/sessions/learner');
      return response.data.data;
    },
  });
};

export const useMentorSessions = () => {
  return useQuery({
    queryKey: ['sessions', 'mentor'],
    queryFn: async () => {
      if (shouldUseEdgeSessions) {
        const response = await getMySessionsViaEdge();
        return response.data;
      }

      const response = await api.get('/sessions/mentor');
      return response.data.data;
    },
  });
};

export const useBookSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      if (shouldUseEdgeSessions) {
        const response = await createSessionViaEdge(data);
        return response.data;
      }

      const response = await api.post('/sessions', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
};

// Wallet
export const useWallet = () => {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response = await api.get('/wallet');
      return response.data.data;
    },
  });
};

export const useUpdateSessionStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, status }: { sessionId: string; status: string }) => {
      if (shouldUseEdgeSessions) {
        const response = await updateSessionStatusViaEdge({ sessionId, status });
        return response.data;
      }

      const response = await api.patch(`/sessions/${sessionId}/status`, { status });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useWalletConfig = () => {
  return useQuery({
    queryKey: ['wallet-config'],
    queryFn: async () => {
      const response = await api.get('/wallet/config');
      return response.data.data;
    },
  });
};

export const usePaymentMethods = () => {
  return useQuery({
    queryKey: ['wallet-payment-methods'],
    queryFn: async () => {
      const response = await api.get('/wallet/payment-methods');
      return response.data.data;
    },
  });
};

export const usePayoutMethods = () => {
  return useQuery({
    queryKey: ['wallet-payout-methods'],
    queryFn: async () => {
      const response = await api.get('/wallet/payout-methods');
      return response.data.data;
    },
  });
};

export const useCreatePaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/wallet/payment-methods', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-payment-methods'] });
    },
  });
};

export const useCreatePayoutMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/wallet/payout-methods', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-payout-methods'] });
    },
  });
};

export const useCreateDepositIntent = () => {
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/wallet/deposit-intent', data);
      return response.data.data;
    },
  });
};

export const useVerifyRazorpayPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/wallet/verify-razorpay', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const useCreateWithdrawal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/wallet/withdrawals', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-payout-methods'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'mentor'] });
    },
  });
};

// Requirements
export const useRequirements = () => {
  return useQuery({
    queryKey: ['requirements'],
    queryFn: async () => {
      const response = await api.get('/requirements');
      return response.data.data;
    },
  });
};

export const useRequirement = (id: string) => {
  return useQuery({
    queryKey: ['requirement', id],
    queryFn: async () => {
      const response = await api.get(`/requirements/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
};

export const usePostRequirement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/requirements', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
    },
  });
};

// Proposals
export const useMentorProposals = () => {
  return useQuery({
    queryKey: ['proposals', 'mentor'],
    queryFn: async () => {
      const response = await api.get('/proposals/mentor');
      return response.data.data;
    },
  });
};

export const useSubmitProposal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { requirementId: string; coverLetter: string; proposedRate: number }) => {
      const response = await api.post('/proposals', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
      queryClient.invalidateQueries({ queryKey: ['requirement'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'mentor'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// Analytics
export const useLearnerAnalytics = () => {
  return useQuery({
    queryKey: ['analytics', 'learner'],
    queryFn: async () => {
      const response = await api.get('/analytics/learner');
      return response.data.data;
    },
  });
};

export const useMentorAnalytics = () => {
  return useQuery({
    queryKey: ['analytics', 'mentor'],
    queryFn: async () => {
      const response = await api.get('/analytics/mentor');
      return response.data.data;
    },
  });
};

// User Profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.patch('/users/profile', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      // Also update local storage user if needed
    },
  });
};

export const useSwitchRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (role: 'LEARNER' | 'MENTOR') => {
      const response = await api.post('/users/switch-role', { role });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
};

// Categories
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data.data;
    },
  });
};

export const useSkills = () => {
  return useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const response = await api.get('/skills');
      return response.data.data;
    },
  });
};

export const useSkillsByCategory = () => {
  return useQuery({
    queryKey: ['skills-by-category'],
    queryFn: async () => {
      const response = await api.get('/skills/grouped');
      return response.data.data;
    },
  });
};

// Messages
export const useMessages = (userId: string) => {
  return useQuery({
    queryKey: ['messages', userId],
    queryFn: async () => {
      const response = await api.get(`/chat/${userId}`);
      return response.data.data;
    },
    enabled: !!userId,
  });
};

export const useChatConversations = () => {
  return useQuery({
    queryKey: ['chat_conversations'],
    queryFn: async () => {
      const response = await api.get('/chat/conversations');
      return response.data.data;
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/chat', data);
      return response.data.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['chat_conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', data.receiverId] });
    },
  });
};

