import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import DesignEditor from './components/DesignEditor';
import DesignsList from './components/DesignsList';
import LandingPage from './pages/LandingPage';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
        setUser(session?.user || null);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setUser(session?.user || null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="w-16 h-16 border-4 border-indigo-400 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/landing" 
        element={
          isAuthenticated ? (
            <Navigate to="/designs" replace />
          ) : (
            <LandingPage />
          )
        } 
      />
      <Route 
        path="/designs" 
        element={
          !isAuthenticated ? (
            <Navigate to="/landing" replace />
          ) : (
            <DesignsList />
          )
        } 
      />
      <Route 
        path="/editor/:designId" 
        element={
          !isAuthenticated ? (
            <Navigate to="/landing" replace />
          ) : (
            <DesignEditor />
          )
        } 
      />
      <Route 
        path="*" 
        element={
          <Navigate to={isAuthenticated ? "/designs" : "/landing"} replace />
        } 
      />
    </Routes>
  );
}

export default App;