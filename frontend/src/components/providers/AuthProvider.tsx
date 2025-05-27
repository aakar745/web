'use client'

import React, { createContext, useState, useEffect, useContext } from 'react'
import { apiRequest } from '@/lib/apiClient';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from localStorage and validate token
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
              if (storedToken && storedUser && storedUser !== "undefined") {
        try {
          // Try to parse the stored user first
          const parsedUser = JSON.parse(storedUser);
          
          // Validate the token by making a request to get user profile
          const response = await apiRequest<{status: string; data: User}>('/auth/me', {
            requireAuth: true,
            noRedirect: true // Prevent automatic redirect during validation
          });
          
          // Token is valid, set the user data from response
          setToken(storedToken);
          setUser(response.data);
        } catch (error: any) {
          console.log('Token validation failed:', error.message);
          
          // If it's a network error and we have stored user data, use it temporarily
          if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            try {
              const parsedUser = JSON.parse(storedUser);
              setToken(storedToken);
              setUser(parsedUser);
              console.log('Using cached user data due to network error');
            } catch (parseError) {
              // If can't parse stored user, clear everything
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setToken(null);
              setUser(null);
            }
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
        }
      }
      
      setIsLoading(false);
    };
    
    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest<{status: string; data: {id: string; name: string; email: string; role: string; token: string}}>('auth/login', {
        method: 'POST',
        body: { email, password }
      });
      
      // Extract data from the nested response structure
      const { data } = response;
      const token = data.token;
      const user: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role
      };
      
      // Save token and user in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update state
      setToken(token);
      setUser(user);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred. Please try again later.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext); 