import { QueryClient } from '@tanstack/react-query';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

export async function fetchApi(path: string, init?: RequestInit) {
  const fullUrl = `${baseUrl}${path}`;
  const response = await fetch(fullUrl, init);
  
  if (!response.ok) {
    throw new Error('API request failed');
  }
  
  return response.json();
} 