import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultAuthenticatedRoute, requiresRoleOnboarding } from '@/lib/userRouting';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('LEARNER' | 'MENTOR' | 'ADMIN')[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const onboardingRoute = user.role === 'MENTOR' ? '/onboarding/mentor' : '/onboarding/learner';
  const isOnboardingPage = location.pathname.startsWith('/onboarding/');
  const needsOnboarding = requiresRoleOnboarding(user);

  if (needsOnboarding && !isOnboardingPage && location.pathname !== '/mentor/verification-pending') {
    return <Navigate to={onboardingRoute} replace />;
  }

  if (!needsOnboarding && isOnboardingPage) {
    return <Navigate to={getDefaultAuthenticatedRoute(user)} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user is logged in but doesn't have the right role, redirect to their dashboard
    return <Navigate to={getDefaultAuthenticatedRoute(user)} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
