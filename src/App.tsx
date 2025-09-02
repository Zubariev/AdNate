import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routes } from "./routes";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./components/auth/AuthProvider";
import { RootLayout } from "./components/layout/RootLayout";
import { Toaster } from "./components/ui/toaster";
import { apiClient } from './lib/apiClient';
import { useEffect } from 'react';
import { supabase } from './api/supabase';

const queryClient = new QueryClient();
const SERVER_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5001';

// Create a component that uses auth inside the router context
function AppWithAuth() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  useEffect(() => {
    apiClient.setBaseURL(SERVER_BASE_URL);
    apiClient.setAuthToken(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || null;
      } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
      }
    });
  }, []);

  return <RootLayout />;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppWithAuth />,
    children: routes,
  },
]);

function App() {
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