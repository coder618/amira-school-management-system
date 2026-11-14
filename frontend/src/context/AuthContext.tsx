import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';
import { APP_CONFIG } from '../app/config';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, password_confirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved =
      localStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER) ||
      localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return (
      localStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN) ||
      localStorage.getItem('token')
    );
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const saveAuthSession = (authToken: string, authUser: User) => {
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN, authToken);
    localStorage.setItem('token', authToken);

    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER, JSON.stringify(authUser));
    localStorage.setItem('user', JSON.stringify(authUser));

    if (authUser.school_id) {
      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.TENANT_SCHOOL, String(authUser.school_id));
    }
    setToken(authToken);
    setUser(authUser);
  };

  const clearAuthSession = () => {
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER);
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.TENANT_SCHOOL);
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.TENANT_YEAR);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const verifyUser = async () => {
      const storedToken =
        localStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN) ||
        localStorage.getItem('token');

      if (storedToken) {
        try {
          const res = await authApi.me();
          saveAuthSession(storedToken, res.user);
        } catch {
          clearAuthSession();
        }
      }
      setIsLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    saveAuthSession(data.token, data.user);
  };

  const register = async (name: string, email: string, password: string, password_confirmation: string) => {
    const data = await authApi.register({ name, email, password, password_confirmation });
    saveAuthSession(data.token, data.user);
  };

  const logout = async () => {
    try {
      if (token) {
        await authApi.logout();
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      clearAuthSession();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

