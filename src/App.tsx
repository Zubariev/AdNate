import { createBrowserRouter, RouterProvider } from 'react-router-dom';
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