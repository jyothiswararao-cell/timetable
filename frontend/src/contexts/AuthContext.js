'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const savedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          const response = await api.get('/auth/me');
          if (response.data.success) {
            const updatedUser = response.data.user;
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } catch (error) {
          console.error('Auth initialization failed', error);
          logout();
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      const publicRoutes = ['/login'];
      const isPublicRoute = publicRoutes.includes(pathname);

      if (!user && !isPublicRoute) {
        router.replace('/login');
      } else if (user && isPublicRoute) {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        const { token, user: loggedUser } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(loggedUser));
        setUser(loggedUser);
        router.push('/dashboard');
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Invalid credentials'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
