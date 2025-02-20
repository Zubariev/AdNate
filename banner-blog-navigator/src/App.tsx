
import { Toaster } from "..//ui/toaster";
import { Toaster as Sonner } from "..//ui/sonner";
import { TooltipProvider } from "..//ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "..//auth/AuthProvider";
import Index from "./pages/Index";
import PostDetail from "./pages/PostDetail";
import NotFound from "./pages/NotFound";
import Auth from "../../src/pages/blog/Auth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
