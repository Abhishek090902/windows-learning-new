export type AppRole = 'LEARNER' | 'MENTOR' | 'ADMIN';

export const appRoutes = {
  home: '/',
  login: '/login',
  signup: '/signup',
  settings: '/settings',
  mentors: '/mentors',
  chat: '/chat',
  help: '/help',
  supportTicket: '/support/ticket',
  learnerDashboard: '/learner/dashboard',
  learnerSessions: '/learner/sessions',
  learnerProgress: '/learner/progress',
  learnerWallet: '/learner/wallet',
  learnerPostRequirement: '/learner/requirements/post',
  learnerOnboarding: '/onboarding/learner',
  mentorDashboard: '/mentor/dashboard',
  mentorRequests: '/mentor/requests',
  mentorProposals: '/mentor/proposals',
  mentorSessions: '/mentor/sessions',
  mentorEarnings: '/mentor/earnings',
  mentorAvailability: '/mentor/availability',
  mentorProfileEdit: '/mentor/profile/edit',
  mentorOnboarding: '/onboarding/mentor',
  mentorVerificationPending: '/mentor/verification-pending',
  adminDashboard: '/admin/dashboard',
} as const;

export const getDashboardRoute = (role?: AppRole | null) => {
  if (role === 'MENTOR') return appRoutes.mentorDashboard;
  if (role === 'ADMIN') return appRoutes.adminDashboard;
  return appRoutes.learnerDashboard;
};

export const getOnboardingRoute = (role?: AppRole | null) => {
  return role === 'MENTOR' ? appRoutes.mentorOnboarding : appRoutes.learnerOnboarding;
};

export const getChatRoute = (userId?: string | null) => {
  return userId ? `${appRoutes.chat}/${userId}` : appRoutes.chat;
};

export const getRoleSwitchTarget = (role?: AppRole | null) => {
  return role === 'MENTOR' ? 'LEARNER' : 'MENTOR';
};
