import { rateLimiter } from './rateLimiter';

// Generic API client with security features
interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private maxRetries: number;

  constructor(baseURL: string = '', timeout: number = 10000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.maxRetries = 3;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async request<T>(
    url: string,
    options: RequestInit & RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { timeout = this.timeout, retries = this.maxRetries, retryDelay = 1000, ...fetchOptions } = options;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${this.baseURL}${url}`, {
          ...fetchOptions,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return { data, status: response.status };
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retries) {
          await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    clearTimeout(timeoutId);
    return {
      error: lastError?.message || 'Request failed',
      status: 0
    };
  }

  async get<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'GET', ...config });
  }

  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...config
    });
  }

  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...config
    });
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE', ...config });
  }
}

export const apiClient = new ApiClient();
export { ApiClient };

class ApiClient {
  private baseURL: string;
  private defaultTimeout: number;
  private csrfToken?: string;

  constructor(baseURL: string = '', timeout: number = 30000) {
    this.baseURL = baseURL;
    this.defaultTimeout = timeout;
    this.initCSRF();
  }

  private async initCSRF() {
    // Initialize CSRF token for state-changing requests
    try {
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      if (token) {
        this.csrfToken = token;
      }
    } catch (error) {
      console.warn('Could not initialize CSRF token:', error);
    }
  }

  private sanitizeUrl(url: string): string {
    // Prevent SSRF attacks by validating URLs
    try {
      const parsed = new URL(url, this.baseURL || window.location.origin);

      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }

      // Prevent requests to private IP ranges in production
      const hostname = parsed.hostname;
      const privateIPRegex = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.|169\.254\.|::1|fc00:|fe80:)/;

      if (process.env.NODE_ENV === 'production' && privateIPRegex.test(hostname)) {
        throw new Error('Private IP addresses not allowed');
      }

      return parsed.toString();
    } catch (error) {
      throw new Error(`Invalid URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getSecurityHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };

    // Add CSRF token for state-changing requests
    if (this.csrfToken) {
      headers['X-CSRF-Token'] = this.csrfToken;
    }

    // Add security headers
    headers['X-Content-Type-Options'] = 'nosniff';
    headers['X-Frame-Options'] = 'DENY';
    headers['X-XSS-Protection'] = '1; mode=block';

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
    if (!rateLimiter.checkLimit(rateLimitKey, 100, 60000)) { // 100 requests per minute
      return {
        error: 'Rate limit exceeded. Please try again later.',
        status: 429
      };
    }

    // Sanitize endpoint URL
    let fullUrl: string;
    try {
      fullUrl = this.sanitizeUrl(`${this.baseURL}${endpoint}`);
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
          ...this.getSecurityHeaders(),
          ...headers
        };

        const response = await fetch(fullUrl, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
          credentials: 'same-origin', // Prevent credentials from being sent to third-party domains
          mode: 'cors',
          cache: 'no-cache'
        });

        clearTimeout(timeoutId);

        let data;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            data = await response.json();
          } else {
            data = await response.text();
          }
        } catch (parseError) {
          data = null;
        }

        return {
          data,
          status: response.status,
          error: response.ok ? undefined : (data?.message || data || 'Request failed')
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

  async post<T>(endpoint: string, body: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, headers });
  }

  async put<T>(endpoint: string, body: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, headers });
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}

export const apiClient = new ApiClient();