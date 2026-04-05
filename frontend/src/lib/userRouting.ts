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
    isVerified?: boolean | null;
    rejectionReason?: string | null;
    onboardingCompleted?: boolean | null;
    onboardingCompletedAt?: string | null;
    hourlyRate?: number | string | null;
  } | null;
} | null;

const getNormalizedMentorVerificationStatus = (user: AppUser) => {
  const mentorProfile = user?.mentorProfile;
  const rawStatus = mentorProfile?.verificationStatus?.toLowerCase().trim();

  if (rawStatus === 'approved' || rawStatus === 'verified') {
    return 'approved';
  }

  if (rawStatus === 'rejected') {
    return 'rejected';
  }

  if (rawStatus === 'pending') {
    return 'pending';
  }

  if (mentorProfile?.isVerified) {
    return 'approved';
  }

  if (mentorProfile?.rejectionReason) {
    return 'rejected';
  }

  return null;
};

export const isLearnerOnboardingComplete = (user: AppUser) => {
  return Boolean(user?.learnerProfile && (user.learnerProfile.bio || user.learnerProfile.experienceLevel));
};

export const isMentorOnboardingComplete = (user: AppUser) => {
  const mentorProfile = user?.mentorProfile;
  const verificationStatus = getNormalizedMentorVerificationStatus(user);

  return Boolean(
    mentorProfile &&
      (
        mentorProfile.onboardingCompleted ||
        mentorProfile.onboardingCompletedAt ||
        verificationStatus === 'approved' ||
        mentorProfile.headline ||
        mentorProfile.title ||
        mentorProfile.bio ||
        Number(mentorProfile.hourlyRate || 0) > 0
      ),
  );
};

export const requiresRoleOnboarding = (user: AppUser) => {
  if (!user || user.role === 'ADMIN') return false;

  if (user.role === 'MENTOR' && getNormalizedMentorVerificationStatus(user) === 'approved') {
    return false;
  }

  return user.role === 'MENTOR' ? !isMentorOnboardingComplete(user) : !isLearnerOnboardingComplete(user);
};

export const requiresMentorVerification = (user: AppUser) => {
  const verificationStatus = getNormalizedMentorVerificationStatus(user);

  return Boolean(
    user?.role === 'MENTOR' &&
      isMentorOnboardingComplete(user) &&
      verificationStatus === 'pending',
  );
};

export const getDefaultAuthenticatedRoute = (user: AppUser) => {
  if (!user) return appRoutes.login;
  if (requiresRoleOnboarding(user)) return getOnboardingRoute(user.role);
  if (requiresMentorVerification(user)) return appRoutes.mentorVerificationPending;
  return getDashboardRoute(user.role);
};
