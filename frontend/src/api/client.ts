const API_BASE = ((import.meta as any).env?.VITE_API_BASE || '') + '/api/v1';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('access_token');
  const demoRole = localStorage.getItem('demo_role');

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (demoRole) {
    headers['X-Demo-Role'] = demoRole;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If unauthorized, redirect to signin if not already there
    if (!window.location.pathname.startsWith('/signin') && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_info');
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const apiClient = {
  get: <T = any>(url: string) => apiRequest<T>(url, { method: 'GET' }),
  post: <T = any>(url: string, data?: any) => 
    apiRequest<T>(url, { 
      method: 'POST', 
      body: data instanceof FormData ? data : (data !== undefined ? JSON.stringify(data) : undefined) 
    }),
  patch: <T = any>(url: string, data?: any) => 
    apiRequest<T>(url, { 
      method: 'PATCH', 
      body: data instanceof FormData ? data : (data !== undefined ? JSON.stringify(data) : undefined) 
    }),
  put: <T = any>(url: string, data?: any) => 
    apiRequest<T>(url, { 
      method: 'PUT', 
      body: data instanceof FormData ? data : (data !== undefined ? JSON.stringify(data) : undefined) 
    }),
  delete: <T = any>(url: string) => apiRequest<T>(url, { method: 'DELETE' }),
};
