// Custom API layer for Royal Coast to interact with the local Express / MySQL backend.
const BASE_URL = (import.meta.env.VITE_API_URL as string) || ''; // Allows defining a custom backend URL in production (e.g. https://api.royalcoast.pt)

export async function fetchApi(
  endpoint: string,
  options: Omit<RequestInit, 'body'> & { body?: any } = {}
) {
  const token = localStorage.getItem('rc_token');
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Determine if we are sending json or form data
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
    options.body = JSON.stringify(options.body);
  }

  let response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Fallback to local dev server if remote backend returns 404 (e.g. Hostinger index.php not updated yet)
  if (!response.ok && endpoint.startsWith('/api/auth/google') && BASE_URL) {
    const fallbackRes = await fetch(endpoint, {
      ...options,
      headers,
    }).catch(() => null);
    if (fallbackRes && fallbackRes.ok) {
      response = fallbackRes;
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json().catch(() => ({ success: true }));
}

// ----------------------------------------------------
// Polling Subscription Engine (mirrors onSnapshot)
// ----------------------------------------------------

type Listener = (data: any) => void;
const activeSubscriptions = new Map<string, {
  listeners: Set<Listener>;
  intervalId: any;
  lastDataJson: string;
}>();

export function subscribeUrl<T>(url: string, callback: (data: T) => void): () => void {
  if (!activeSubscriptions.has(url)) {
    const listeners = new Set<Listener>();
    let lastDataJson = '';

    const poll = async () => {
      try {
        const res = await fetchApi(url);
        const jsonStr = JSON.stringify(res);
        if (jsonStr !== lastDataJson) {
          lastDataJson = jsonStr;
          listeners.forEach(cb => cb(res));
        }
      } catch (e) {
        console.error("Polling error for " + url, e);
        // Desencadear callback se houver erro para libertar o estado de loading do frontend
        if (!lastDataJson) {
          listeners.forEach(cb => cb([] as any));
        }
      }
    };

    // Initial fetch
    poll();

    // Poll every 4 seconds
    const intervalId = setInterval(poll, 4000);

    activeSubscriptions.set(url, { listeners, intervalId, lastDataJson });
  }

  const sub = activeSubscriptions.get(url)!;
  sub.listeners.add(callback);

  // Trigger callback immediately if we already have cache
  if (sub.lastDataJson) {
    try {
      callback(JSON.parse(sub.lastDataJson));
    } catch (e) {}
  }

  return () => {
    sub.listeners.delete(callback);
    if (sub.listeners.size === 0) {
      clearInterval(sub.intervalId);
      activeSubscriptions.delete(url);
    }
  };
}

// ==========================================
// API CLIENT
// ==========================================
export const api = {
  // Boats
  boats: {
    getAll: () => fetchApi('/api/boats'),
    create: (data: any) => fetchApi('/api/boats', { method: 'POST', body: data }),
    update: (id: string, data: any) => fetchApi(`/api/boats/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) => fetchApi(`/api/boats/${id}`, { method: 'DELETE' }),
    updateOrder: (orders: { id: string; order: number }[]) => fetchApi('/api/boats/order/bulk', { method: 'PUT', body: orders as any }),
    uploadImage: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return fetchApi('/api/boats/upload', { method: 'POST', body: formData });
    },
    subscribe: (callback: (data: any[]) => void) => subscribeUrl('/api/boats', callback),
  },

  // Tours
  tours: {
    getAll: () => fetchApi('/api/tours'),
    create: (data: any) => fetchApi('/api/tours', { method: 'POST', body: data }),
    update: (id: string, data: any) => fetchApi(`/api/tours/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) => fetchApi(`/api/tours/${id}`, { method: 'DELETE' }),
    updateOrder: (orders: { id: string; order: number }[]) => fetchApi('/api/tours/order/bulk', { method: 'PUT', body: orders as any }),
    subscribe: (callback: (data: any[]) => void) => subscribeUrl('/api/tours', callback),
  },

  // Gallery
  gallery: {
    getAll: () => fetchApi('/api/gallery'),
    uploadImage: (file: File, alt: string = 'Imagem da galeria') => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt', alt);
      return fetchApi('/api/gallery', { method: 'POST', body: formData });
    },
    delete: (id: string) => fetchApi(`/api/gallery/${id}`, { method: 'DELETE' }),
    subscribe: (callback: (data: any[]) => void) => subscribeUrl('/api/gallery', callback),
  },

  // Bookings
  bookings: {
    getAll: (filters: { confirmed?: boolean; date_start?: string; date_end?: string } = {}) => {
      const params = new URLSearchParams(filters as any);
      return fetchApi(`/api/bookings?${params.toString()}`);
    },
    create: (data: any) => fetchApi('/api/bookings', { method: 'POST', body: data }),
    update: (id: string, data: any) => fetchApi(`/api/bookings/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) => fetchApi(`/api/bookings/${id}`, { method: 'DELETE' }),
    cleanupPastUnconfirmed: () => fetchApi('/api/bookings/cleanup/past-unconfirmed', { method: 'DELETE' }),
    subscribe: (filters: { confirmed?: boolean; date_start?: string; date_end?: string } = {}, callback: (data: any[]) => void) => {
      const params = new URLSearchParams(filters as any);
      return subscribeUrl(`/api/bookings?${params.toString()}`, callback);
    },
  },

  // Expenses
  expenses: {
    getAll: (filters: { date_start?: string; date_end?: string } = {}) => {
      const params = new URLSearchParams(filters as any);
      return fetchApi(`/api/expenses?${params.toString()}`);
    },
    create: (data: any) => fetchApi('/api/expenses', { method: 'POST', body: data }),
    delete: (id: string) => fetchApi(`/api/expenses/${id}`, { method: 'DELETE' }),
    subscribe: (filters: { date_start?: string; date_end?: string } = {}, callback: (data: any[]) => void) => {
      const params = new URLSearchParams(filters as any);
      return subscribeUrl(`/api/expenses?${params.toString()}`, callback);
    },
  },

  // Settings
  settings: {
    get: (key: string) => fetchApi(`/api/settings/${key}`),
    save: (key: string, data: any) => fetchApi(`/api/settings/${key}`, { method: 'POST', body: data }),
    subscribe: (key: string, callback: (data: any) => void) => subscribeUrl(`/api/settings/${key}`, callback),
  },

  // Users
  users: {
    getAll: () => fetchApi('/api/users'),
    delete: (uid: string) => fetchApi(`/api/users/${uid}`, { method: 'DELETE' }),
    subscribe: (callback: (data: any[]) => void) => subscribeUrl('/api/users', callback),
  }
};
