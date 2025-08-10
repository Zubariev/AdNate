
interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private retryConfig: RetryConfig;

  constructor(baseUrl = '', defaultHeaders = {}) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    };
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
    };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateRetryDelay(attempt: number): number {
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(2, attempt),
      this.retryConfig.maxDelay
    );
    return delay + Math.random() * 1000; // Add jitter
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit,
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
      });

      const data = response.headers.get('content-type')?.includes('application/json')
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        // Check if we should retry
        if (retryCount < this.retryConfig.maxRetries && 
            (response.status === 429 || response.status >= 500)) {
          await this.delay(this.calculateRetryDelay(retryCount));
          return this.makeRequest(url, options, retryCount + 1);
        }

        return {
          error: data.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      // Network errors - retry if possible
      if (retryCount < this.retryConfig.maxRetries) {
        await this.delay(this.calculateRetryDelay(retryCount));
        return this.makeRequest(url, options, retryCount + 1);
      }

      return {
        error: error instanceof Error ? error.message : 'Network error occurred',
        status: 0,
      };
    }
  }

  async get<T>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(this.baseUrl + url, {
      method: 'GET',
      headers,
    });
  }

  async post<T>(
    url: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(this.baseUrl + url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  async put<T>(
    url: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(this.baseUrl + url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  async delete<T>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(this.baseUrl + url, {
      method: 'DELETE',
      headers,
    });
  }
}

// Create API client instances
export const apiClient = new ApiClient();

// Hugging Face API client (for server-side use only)
export const huggingFaceClient = new ApiClient('https://api-inference.huggingface.co', {
  'Authorization': `Bearer ${import.meta.env.VITE_HUGGING_FACE_API_KEY || ''}`,
});

// Error types for consistent error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 0,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helper function to handle API responses
export function handleApiResponse<T>(response: ApiResponse<T>): T {
  if (response.error) {
    throw new ApiError(response.error, response.status);
  }
  return response.data as T;
}
