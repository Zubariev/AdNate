import { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { routes } from "./routes";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./components/auth/AuthProvider";
import { RootLayout } from "./components/layout/RootLayout";
import { Toaster } from "./components/ui/toaster"

const queryClient = new QueryClient();

// Create router with auth wrapper for all routes
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthProvider>
        <RootLayout />
      </AuthProvider>
    ),
    children: routes,
  },
]);

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

    return () => subscription?.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="w-16 h-16 border-4 border-indigo-400 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;