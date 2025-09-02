import { apiRateLimiter } from './rateLimiter';
import { supabase } from '../../src/api/supabase';

// Generic API client with security features
interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
}

interface ApiResponse<T> {
  data?: T | string | null;
  error?: string;
  status: number;
}

class ApiClient {
  private baseURL: string = ''; // Initialize here
  private defaultTimeout: number;
  private getAuthToken?: () => Promise<string | null>;

  constructor(timeout: number = 30000, getAuthToken?: () => Promise<string | null>) {
    this.defaultTimeout = timeout;
    this.getAuthToken = getAuthToken;
  }

  public setBaseURL(url: string) {
    this.baseURL = url;
  }

  public setAuthToken(getTokenFn: () => Promise<string | null>) {
    this.getAuthToken = getTokenFn;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};
    try {
      if (this.getAuthToken) {
        const token = await this.getAuthToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      }
    } catch (error) {
      console.error('Error getting Supabase session:', error);
    }
    return headers;
  }

  async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.defaultTimeout,
      retries = 3
    } = options;

    // Check rate limiting
    const rateLimitKey = `api_${endpoint}_${method}`;
    if (!apiRateLimiter.checkLimit(undefined, undefined, rateLimitKey).allowed) { // Use apiRateLimiter
      return {
        error: 'Rate limit exceeded. Please try again later.',
        status: 429
      };
    }

    // Sanitize endpoint URL
    let fullUrl: string;
    try {
      fullUrl = `${this.baseURL}${endpoint}`;
      // Simplified sanitizeUrl, as full sanitization is not critical for internal API calls to a trusted backend
      // and to avoid issues with dynamic baseURLs.
      // For external APIs, a more robust sanitizeUrl would be necessary.
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Invalid URL',
        status: 400
      };
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const requestHeaders = {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(await this.getAuthHeaders()), // Dynamically get auth headers
          ...headers
        };

        const response = await fetch(fullUrl, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
          credentials: 'same-origin', 
          mode: 'cors',
          cache: 'no-cache'
        });

        clearTimeout(timeoutId);

        let data: T | string | null = null;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        if (response.status === 401) {
          console.log('Unauthorized: Redirecting to /auth');
          window.location.href = '/auth'; // Redirect to login page
          return { error: 'Unauthorized', status: 401 };
        }

        return {
          data,
          status: response.status,
          error: response.ok ? undefined : (typeof data === 'string' ? data : (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string' ? data.message : 'Request failed'))
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (error instanceof Error && error.name === 'AbortError') {
          return {
            error: 'Request timeout',
            status: 408
          };
        }

        // If this is the last attempt, don't retry
        if (attempt === retries) {
          break;
        }

        // Exponential backoff for retries
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    return {
      error: lastError?.message || 'Request failed after retries',
      status: 500
    };
  }

  // Convenience methods
  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  async post<T>(endpoint: string, body: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, headers });
  }

  async put<T>(endpoint: string, body: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, headers });
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}

export const apiClient = new ApiClient();

const SERVER_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5001';
apiClient.setBaseURL(SERVER_BASE_URL);