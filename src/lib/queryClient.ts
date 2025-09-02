// Note: Keep this file minimal; shared fetch helper only.

export async function apiRequest(method: string, path: string, body?: unknown) {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
    const fullUrl = `${API_BASE_URL}${path}`;

    console.log(`Making ${method} request to ${fullUrl}`, body);
    const response = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}