import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../api/supabase";
import type { User } from "@supabase/supabase-js";
import { useLocation } from 'react-router-dom';
import { apiClient } from "../../lib/apiClient";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string) => Promise<{ error?: any }>;
  signInWithGoogle: () => Promise<{ error?: any }>;
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
  const [sessionExpired, setSessionExpired] = useState(false);
  const location = useLocation();

  const handleExpiredSession = async () => {
    setSessionExpired(true);
    setUser(null);
    // Clear any cached data
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.clear();

    // Show session expired message briefly, then redirect
    setTimeout(() => {
      setSessionExpired(false);
      window.location.href = '/auth?expired=true';
    }, 2000);
  };

  // Session validation function
  const validateSession = async () => {
    if (user) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          console.error('Session validation failed:', error);
          handleExpiredSession(); // Handle expired or invalid session
        } else if (session.user.id !== user.id) {
          // Session user mismatch, update user state
          setUser(session.user);
        }
      } catch (error) {
        console.error('Error validating session:', error);
        handleExpiredSession(); // Handle potential network errors
      }
    }
  };

  // Token refresh function
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Token refresh error:', error);
        if (error.message?.includes('refresh_token_not_found')) {
          await handleExpiredSession();
        }
        return;
      }

      if (data.session) {
        setUser(data.session.user);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      await handleExpiredSession();
    }
  };

  // Initialize auth state and set up listeners
  useEffect(() => {
    // Set up token provider for apiClient
    apiClient.setAuthToken(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    });

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN') {
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          await handleExpiredSession(); // Ensure cleanup on explicit sign out
        }
      }
    );

    // Set up token refresh timer
    const refreshTimer = setInterval(async () => {
      await refreshSession();
    }, 50 * 60 * 1000); // Refresh every 50 minutes

    return () => {
      subscription?.unsubscribe();
      clearInterval(refreshTimer);
    };
  }, []);

  // Validate session on route changes
  useEffect(() => {
    validateSession();
  }, [location.pathname, user?.id]);

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

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/designs`
      }
    });

    return { error };
  };

  const signOut = async () => {
    try {
      // Clear localStorage/sessionStorage
      localStorage.clear();
      sessionStorage.clear();

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }

      // Reset auth state
      setUser(null);

      // Redirect to auth page
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error in signOut:', error);
      // Force logout even if there's an error
      setUser(null);
      window.location.href = '/auth';
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    refreshSession,
  };

  // Show session expired message
  if (sessionExpired) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="p-6 text-center bg-yellow-50 rounded-lg border border-yellow-200">
          <h2 className="mb-2 text-lg font-semibold text-yellow-800">Session Expired</h2>
          <p className="text-yellow-700">Your session has expired. Redirecting to login...</p>
        </div>
      </div>
    );
  }

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