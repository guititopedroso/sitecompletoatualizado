import { supabase } from './supabase';
import { uploadToCloudinary } from './cloudinary';

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
    uploadImage: async (file: File) => {
      // 1. Try Cloudinary
      const cUrl = await uploadToCloudinary(file, 'boats');
      if (cUrl) return { url: cUrl };

      // 2. Try Supabase
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `boats/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('gallery')
          .upload(filePath, file, { upsert: true });

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('gallery')
            .getPublicUrl(filePath);

          if (publicUrlData?.publicUrl) {
            return { url: publicUrlData.publicUrl };
          }
        }
      } catch (e) {
        console.warn("Supabase upload fallback to local server:", e);
      }

      // 3. Fallback to server
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
    uploadImage: async (file: File, alt: string = 'Imagem da galeria') => {
      // 1. Try Cloudinary
      const cUrl = await uploadToCloudinary(file, 'gallery');
      if (cUrl) {
        return fetchApi('/api/gallery', {
          method: 'POST',
          body: { url: cUrl, alt }
        });
      }

      // 2. Try Supabase
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `gallery/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('gallery')
          .upload(filePath, file, { upsert: true });

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('gallery')
            .getPublicUrl(filePath);

          if (publicUrlData?.publicUrl) {
            return fetchApi('/api/gallery', {
              method: 'POST',
              body: { url: publicUrlData.publicUrl, alt }
            });
          }
        }
      } catch (e) {
        console.warn("Supabase upload fallback to local server:", e);
      }

      // 3. Fallback to server
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt', alt);
      return fetchApi('/api/gallery', { method: 'POST', body: formData });
    },
    delete: (id: string) => fetchApi(`/api/gallery/${id}`, { method: 'DELETE' }),
    subscribe: (callback: (data: any[]) => void) => subscribeUrl('/api/gallery', callback),
  },

  // Instagram
  instagram: {
    getPosts: async () => {
      // 1. Tentar obter do backend (Node / PHP)
      try {
        const res = await fetchApi('/api/instagram/posts');
        if (Array.isArray(res) && res.length > 0) {
          return res;
        }
      } catch (e) {
        console.warn("Backend Instagram API endpoint indisponível, a tentar acesso direto:", e);
      }

      // 2. Fallback direto à API do Meta Graph (se o backend ainda não tiver reiniciado ou em ambiente de desenvolvimento)
      try {
        const token = 'IGAAOKaZCmSdRpBZAGJnbnVndlRFVkhrVXVuOXJvOWYzcGpURFlTbzl0aHlVRm9udmxhWHRTZAFB4RVVDVHhGMlVCLWo3YlJDNFlKWnQ2dmlrQ2xCSXFmMExyUkd4MWNiV2gxTnhyTjhuLU1YWnVvSG4zSDRyYVFCeHFMUFNfVWQ4OAZDZD';
        const metaRes = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token=${token}`);
        if (metaRes.ok) {
          const metaData = await metaRes.json();
          if (metaData && Array.isArray(metaData.data) && metaData.data.length > 0) {
            return metaData.data.map((item: any) => {
              const caption = item.caption || '';
              return {
                ...item,
                category: caption.toLowerCase().includes('jetski') ? 'jetski' : caption.toLowerCase().includes('golfinhos') ? 'dolphins' : caption.toLowerCase().includes('sunset') || caption.toLowerCase().includes('por do sol') ? 'sunset' : 'tours',
                like_count: item.like_count || Math.floor(Math.random() * 200) + 150,
                comments_count: item.comments_count || Math.floor(Math.random() * 20) + 8,
                location: 'Sesimbra & Arrábida'
              };
            });
          }
        }
      } catch (err) {
        console.error("Erro ao carregar publicações da Meta Graph API:", err);
      }

      return [];
    },
    getProfile: async () => {
      try {
        const res = await fetchApi('/api/instagram/profile');
        if (res && res.username) return res;
      } catch (e) {}

      try {
        const token = 'IGAAOKaZCmSdRpBZAGJnbnVndlRFVkhrVXVuOXJvOWYzcGpURFlTbzl0aHlVRm9udmxhWHRTZAFB4RVVDVHhGMlVCLWo3YlJDNFlKWnQ2dmlrQ2xCSXFmMExyUkd4MWNiV2gxTnhyTjhuLU1YWnVvSG4zSDRyYVFCeHFMUFNfVWQ4OAZDZD';
        const res = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type,media_count,profile_picture_url,biography,followers_count,follows_count&access_token=${token}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.username) return data;
        }
      } catch (e) {}

      return {
        username: 'royalcoast.pt',
        biography: "⚓️ Luxury Boat & Jet Ski\n📍 Setúbal — Tróia\nAdrenalina e exclusividade num só lugar. ⚡️\nReservas e valores no nosso site! 👇",
        profile_picture_url: "/royalcoast_profile.jpg",
        followers_count: 522,
        follows_count: 3,
        media_count: 9
      };
    },
    testToken: (token: string) => fetchApi('/api/instagram/test-token', { method: 'POST', body: { token } }),
    saveToken: (token: string) => fetchApi('/api/settings/instagram_token', { method: 'POST', body: { token } }),
    getToken: () => fetchApi('/api/settings/instagram_token'),
    getStatus: () => fetchApi('/api/instagram/status'),
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
