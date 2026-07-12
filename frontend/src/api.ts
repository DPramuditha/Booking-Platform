const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  duration: number;
  durationUnit: string;
  price: number | string;
  isActive: boolean;
}

export interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceId: string;
  service: Service;
  bookingDate: string;
  bookingTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  createdAt: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const getAuthToken = () => localStorage.getItem('access_token');
export const setAuthToken = (token: string) => localStorage.setItem('access_token', token);
export const getRefreshToken = () => localStorage.getItem('refresh_token');
export const setRefreshToken = (token: string) => localStorage.setItem('refresh_token', token);
export const getAuthUser = (): User | null => {
  const user = localStorage.getItem('auth_user');
  return user ? JSON.parse(user) : null;
};
export const setAuthUser = (user: User | null) => {
  if (user) {
    localStorage.setItem('auth_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('auth_user');
  }
};

const request = async (path: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers || {});
  
  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && getAuthToken()) {
      // Auto logout if token expires
      localStorage.clear();
      window.dispatchEvent(new Event('auth-change'));
    }
    const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(errorData.message || 'Request failed');
  }

  return response.json().catch(() => null);
};

export const api = {
  auth: {
    register: (data: any): Promise<User> => request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    login: async (data: any): Promise<AuthResponse> => {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setAuthToken(res.accessToken);
      setRefreshToken(res.refreshToken);
      setAuthUser(res.user);
      window.dispatchEvent(new Event('auth-change'));
      return res;
    },
    logout: async (): Promise<void> => {
      try {
        await request('/auth/logout', { method: 'POST' });
      } catch (e) {
        console.error('Logout error', e);
      } finally {
        localStorage.clear();
        window.dispatchEvent(new Event('auth-change'));
      }
    },
  },
  services: {
    getAll: (activeOnly = false): Promise<Service[]> => 
      request(`/services?activeOnly=${activeOnly}`),
    getById: (id: string): Promise<Service> => 
      request(`/services/${id}`),
    create: (data: Omit<Service, 'id'>): Promise<Service> => 
      request('/services', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Service>): Promise<Service> => 
      request(`/services/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string): Promise<void> => 
      request(`/services/${id}`, { method: 'DELETE' }),
  },
  bookings: {
    create: (data: any): Promise<Booking> => 
      request('/bookings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getAll: (params: { page?: number; limit?: number; search?: string; status?: string }): Promise<{ data: Booking[]; meta: any }> => {
      const query = new URLSearchParams();
      if (params.page) query.append('page', String(params.page));
      if (params.limit) query.append('limit', String(params.limit));
      if (params.search) query.append('search', params.search);
      if (params.status) query.append('status', params.status);
      return request(`/bookings?${query.toString()}`);
    },
    getById: (id: string): Promise<Booking> => 
      request(`/bookings/${id}`),
    updateStatus: (id: string, status: string): Promise<Booking> => 
      request(`/bookings/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
    cancel: (id: string): Promise<Booking> => 
      request(`/bookings/${id}/cancel`, { method: 'PUT' }),
  },
};
