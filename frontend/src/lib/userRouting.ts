import { appRoutes, getDashboardRoute, getOnboardingRoute, type AppRole } from '@/lib/appRoutes';

type AppUser = {
  role: AppRole;
  learnerProfile?: {
    bio?: string | null;
    experienceLevel?: string | null;
  } | null;
  mentorProfile?: {
    bio?: string | null;
    headline?: string | null;
    title?: string | null;
    verificationStatus?: string | null;
    hourlyRate?: number | string | null;
  } | null;
} | null;

export const isLearnerOnboardingComplete = (user: AppUser) => {
  return Boolean(user?.learnerProfile && (user.learnerProfile.bio || user.learnerProfile.experienceLevel));
};

export const isMentorOnboardingComplete = (user: AppUser) => {
  return Boolean(
    user?.mentorProfile &&
      (user.mentorProfile.headline ||
        user.mentorProfile.title ||
        user.mentorProfile.bio ||
        user.mentorProfile.verificationStatus === 'pending' ||
        Number(user.mentorProfile.hourlyRate || 0) > 0),
  );
};

export const requiresRoleOnboarding = (user: AppUser) => {
  if (!user || user.role === 'ADMIN') return false;
  return user.role === 'MENTOR' ? !isMentorOnboardingComplete(user) : !isLearnerOnboardingComplete(user);
};

export const getDefaultAuthenticatedRoute = (user: AppUser) => {
  if (!user) return appRoutes.login;
  if (requiresRoleOnboarding(user)) return getOnboardingRoute(user.role);
  return getDashboardRoute(user.role);
};
