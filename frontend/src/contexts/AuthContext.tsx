import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'LEARNER' | 'MENTOR' | 'ADMIN';
  learnerProfile?: any;
  mentorProfile?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const authIdentityRef = useRef<string | null>(null);

  const clearCachedUserState = useCallback(() => {
    queryClient.clear();
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  }, [queryClient]);

  const syncIdentityBoundary = useCallback((nextIdentityKey: string | null) => {
    if (authIdentityRef.current && authIdentityRef.current !== nextIdentityKey) {
      clearCachedUserState();
    }

    authIdentityRef.current = nextIdentityKey;
  }, [clearCachedUserState]);

  const applyAuthToken = useCallback((authToken: string) => {
    setToken(authToken);
    localStorage.setItem('token', authToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  }, []);

  const logout = useCallback(() => {
    const hadToken = token;
    authIdentityRef.current = null;
    clearCachedUserState();
    if (hadToken) {
      supabase.auth.signOut().catch(() => {});
    }
  }, [clearCachedUserState, token]);

  const fetchUserProfile = useCallback(async (authToken: string) => {
    try {
      applyAuthToken(authToken);
      const response = await api.get('/users/me');
      const userData = response.data.data;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      logout();
    }
  }, [applyAuthToken, logout]);

  const syncSupabaseUser = useCallback(async (authToken: string) => {
    applyAuthToken(authToken);
    await api.post('/auth/supabase/sync');
  }, [applyAuthToken]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token || null;
        const authIdentity = data.session?.user?.id || null;
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (accessToken) {
          syncIdentityBoundary(authIdentity);
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
          await syncSupabaseUser(accessToken);
          await fetchUserProfile(accessToken);
        } else if (storedToken) {
          syncIdentityBoundary(`legacy:${storedToken}`);
          applyAuthToken(storedToken);
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
          await fetchUserProfile(storedToken);
        } else {
          syncIdentityBoundary(null);
        }
      } catch (error) {
        console.error('Failed to initialize Supabase auth:', error);
        logout();
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const accessToken = session?.access_token || null;
      const authIdentity = session?.user?.id || null;
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (!accessToken) {
        if (storedToken) {
          syncIdentityBoundary(`legacy:${storedToken}`);
          applyAuthToken(storedToken);
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        } else {
          syncIdentityBoundary(null);
        }
        setIsLoading(false);
        return;
      }

      syncIdentityBoundary(authIdentity);
      syncSupabaseUser(accessToken)
        .then(() => fetchUserProfile(accessToken))
        .finally(() => setIsLoading(false));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [applyAuthToken, fetchUserProfile, logout, syncIdentityBoundary, syncSupabaseUser]);

  const login = (userData: User, authToken: string) => {
    syncIdentityBoundary(userData.id);
    applyAuthToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUserProfile(token);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, setUser, updateUser, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
