import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { closeWebSocketConnection } from "@/lib/websocket";

interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  publicKey?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
  terms: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  
  // Fetch current user
  const { data: user, isLoading: isUserLoading, error } = useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.status === 401) return null;
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json();
      } catch (err) {
        console.error('Error fetching current user:', err);
        return null;
      }
    },
    retry: false,
    staleTime: Infinity,
  });
  
  // Login function
  const login = async (username: string, password: string) => {
    setIsLocalLoading(true);
    try {
      const res = await apiRequest('POST', '/api/auth/login', { username, password });
      const data = await res.json();
      
      // Update cache with user data
      queryClient.setQueryData(['/api/auth/me'], data.user);
      
      toast({
        title: "Welcome back!",
        description: `You are now logged in as ${data.user.username}`,
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid username or password",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLocalLoading(false);
    }
  };
  
  // Register function
  const register = async (userData: RegisterData) => {
    setIsLocalLoading(true);
    try {
      const res = await apiRequest('POST', '/api/auth/register', userData);
      const data = await res.json();
      
      // Update cache with user data
      queryClient.setQueryData(['/api/auth/me'], data.user);
      
      toast({
        title: "Registration successful!",
        description: `Welcome to SecureTransfer, ${data.user.username}`,
      });
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Could not create your account",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLocalLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      
      // Clear the user from cache
      queryClient.setQueryData(['/api/auth/me'], null);
      
      // Invalidate and remove all queries from cache
      await queryClient.invalidateQueries();
      queryClient.removeQueries();
      
      // Close WebSocket connection
      closeWebSocketConnection();
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "There was a problem logging you out",
        variant: "destructive",
      });
    }
  };
  
  const isLoading = isUserLoading || isLocalLoading;
  const isAuthenticated = !!user;
  
  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
