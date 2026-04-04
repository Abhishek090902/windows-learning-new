import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

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
      const response = await api.get('/sessions/learner');
      return response.data.data;
    },
  });
};

export const useMentorSessions = () => {
  return useQuery({
    queryKey: ['sessions', 'mentor'],
    queryFn: async () => {
      const response = await api.get('/sessions/mentor');
      return response.data.data;
    },
  });
};

export const useBookSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
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
      // Get all skills from mentors and deduplicate
      const mentorsResponse = await api.get('/mentors');
      const mentors = mentorsResponse.data.data;
      const allSkills = new Set<string>();
      
      mentors.forEach((mentor: any) => {
        if (mentor.skills && Array.isArray(mentor.skills)) {
          mentor.skills.forEach((skillItem: any) => {
            if (skillItem.skill && skillItem.skill.name) {
              allSkills.add(skillItem.skill.name);
            }
          });
        }
      });
      
      // Return skills as array of objects
      return Array.from(allSkills).map(skill => ({
        id: skill.toLowerCase().replace(/\s+/g, '-'),
        name: skill,
        category: 'general' // Default category, can be enhanced later
      }));
    },
  });
};

export const useSkillsByCategory = () => {
  return useQuery({
    queryKey: ['skills-by-category'],
    queryFn: async () => {
      const mentorsResponse = await api.get('/mentors');
      const mentors = mentorsResponse.data.data;
      const skillsByCategory: Record<string, string[]> = {};
      
      // Define some common skill categories
      const categories = {
        'Programming': ['javascript', 'python', 'react', 'node.js', 'typescript', 'java', 'cpp', 'html', 'css', 'vue', 'angular', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin'],
        'Design': ['ui design', 'ux design', 'graphic design', 'web design', 'mobile design', 'figma', 'sketch', 'adobe photoshop', 'illustrator', 'xd'],
        'Business': ['marketing', 'sales', 'business strategy', 'entrepreneurship', 'finance', 'accounting', 'project management', 'leadership'],
        'Data Science': ['data analysis', 'machine learning', 'data science', 'statistics', 'sql', 'tableau', 'power bi', 'python', 'r'],
        'Marketing': ['digital marketing', 'seo', 'sem', 'content marketing', 'social media marketing', 'email marketing', 'branding'],
        'Writing': ['content writing', 'copywriting', 'technical writing', 'creative writing', 'blogging', 'editing'],
        'Languages': ['english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'hindi', 'arabic'],
        'Other': []
      };
      
      // Initialize categories
      Object.keys(categories).forEach(cat => {
        skillsByCategory[cat] = [];
      });
      
      // Categorize skills from mentors
      mentors.forEach((mentor: any) => {
        if (mentor.skills && Array.isArray(mentor.skills)) {
          mentor.skills.forEach((skillItem: any) => {
            if (skillItem.skill && skillItem.skill.name) {
              const skillName = skillItem.skill.name.toLowerCase();
              let categorized = false;
              
              // Try to categorize the skill
              for (const [category, keywords] of Object.entries(categories)) {
                if (category === 'Other') continue;
                
                if (keywords.some(keyword => skillName.includes(keyword))) {
                  if (!skillsByCategory[category].includes(skillItem.skill.name)) {
                    skillsByCategory[category].push(skillItem.skill.name);
                  }
                  categorized = true;
                  break;
                }
              }
              
              // If not categorized, add to Other
              if (!categorized && !skillsByCategory['Other'].includes(skillItem.skill.name)) {
                skillsByCategory['Other'].push(skillItem.skill.name);
              }
            }
          });
        }
      });
      
      return skillsByCategory;
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

