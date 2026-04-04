import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyAuthToken = (authToken: string) => {
    setToken(authToken);
    localStorage.setItem('token', authToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  };

  const fetchUserProfile = async (authToken: string) => {
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
  };

  const syncSupabaseUser = async (authToken: string) => {
    applyAuthToken(authToken);
    await api.post('/auth/supabase/sync');
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token || null;
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (accessToken) {
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
          await syncSupabaseUser(accessToken);
          await fetchUserProfile(accessToken);
        } else if (storedToken) {
          applyAuthToken(storedToken);
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
          await fetchUserProfile(storedToken);
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
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (!accessToken) {
        if (storedToken) {
          applyAuthToken(storedToken);
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
        setIsLoading(false);
        return;
      }

      syncSupabaseUser(accessToken)
        .then(() => fetchUserProfile(accessToken))
        .finally(() => setIsLoading(false));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = (userData: User, authToken: string) => {
    applyAuthToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    if (token) {
      supabase.auth.signOut().catch(() => {});
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
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
