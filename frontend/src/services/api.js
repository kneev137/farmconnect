const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const MEDIA_BASE_URL = import.meta.env.VITE_MEDIA_URL || '';

export function mediaUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = MEDIA_BASE_URL || '';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

class ApiService {
  getToken() {
    return localStorage.getItem('farmconnect_access_token');
  }

  getRefreshToken() {
    return localStorage.getItem('farmconnect_refresh_token');
  }

  setTokens(access, refresh) {
    if (access) localStorage.setItem('farmconnect_access_token', access);
    if (refresh) localStorage.setItem('farmconnect_refresh_token', refresh);
  }

  clearTokens() {
    localStorage.removeItem('farmconnect_access_token');
    localStorage.removeItem('farmconnect_refresh_token');
    localStorage.removeItem('farmconnect_user');
  }

  async refreshToken() {
    const refresh = this.getRefreshToken();
    if (!refresh) return null;

    try {
      const res = await fetch(`${API_BASE_URL}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh })
      });

      if (res.ok) {
        const data = await res.json();
        this.setTokens(data.access, null);
        return data.access;
      } else {
        this.clearTokens();
        return null;
      }
    } catch {
      this.clearTokens();
      return null;
    }
  }

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(url, {
      ...options,
      headers
    });

    // Handle token expiration & retry once
    if (response.status === 401 && this.getRefreshToken()) {
      const newAccessToken = await this.refreshToken();
      if (newAccessToken) {
        headers['Authorization'] = `Bearer ${newAccessToken}`;
        response = await fetch(url, {
          ...options,
          headers
        });
      }
    }

    if (response.status === 204) {
      return null;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.detail || (data.non_field_errors && data.non_field_errors[0]) || Object.values(data)[0] || 'Request failed';
      const error = new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  get(endpoint, params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request(`${endpoint}${queryString}`, { method: 'GET' });
  }

  post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  patch(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  put(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiService();
export default api;
