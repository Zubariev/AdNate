
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null);

  // Session validation function
  const validateSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Session validation error:', error);
        setUser(null);
        return;
      }
      
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error validating session:', error);
      setUser(null);
    }
  };

  // Token refresh function
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Token refresh error:', error);
        await signOut();
        return;
      }
      
      if (data.session) {
        setUser(data.session.user);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      await signOut();
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      await validateSession();
      setLoading(false);
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user || null);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    };
  }, []);

  // Set up token refresh timer
  useEffect(() => {
    if (user && !refreshTimer) {
      // Refresh token every 50 minutes (tokens expire in 60 minutes)
      const timer = setInterval(refreshSession, 50 * 60 * 1000);
      setRefreshTimer(timer);
    } else if (!user && refreshTimer) {
      clearInterval(refreshTimer);
      setRefreshTimer(null);
    }

    return () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    };
  }, [user, refreshTimer]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (data.session) {
      setUser(data.session.user);
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    return { error };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      
      // Clear any cached data
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear refresh timer
      if (refreshTimer) {
        clearInterval(refreshTimer);
        setRefreshTimer(null);
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
