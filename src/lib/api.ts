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
      try {
        return await fetchApi('/api/instagram/posts');
      } catch (e) {
        console.warn("Instagram API fetch failed, fallback to local feed", e);
        return [
          {
            id: "ig_post_1",
            caption: "A navegar pelas águas cristalinas do Ribeiro do Cavalo em Sesimbra 🌊🚤 Venha descobrir o paraíso connosco! #royalcoast #sesimbra #arrabida #boattrip #portugal",
            media_type: "IMAGE",
            media_url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=80",
            permalink: "https://www.instagram.com/royalcoast.pt",
            timestamp: "2026-08-12T14:30:00Z",
            like_count: 248,
            comments_count: 19,
            location: "Praia do Ribeiro do Cavalo, Sesimbra",
            category: "tours"
          },
          {
            id: "ig_post_2",
            caption: "Adrenalina pura no mar de Sesimbra a bordo da nossa Yamaha FX Cruiser! 🔥💨 Reserve já a sua sessão de Jetski. #royalcoast #jetski #seadoo #yamahajetski #sesimbra",
            media_type: "VIDEO",
            media_url: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1000&q=80",
            thumbnail_url: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1000&q=80",
            permalink: "https://www.instagram.com/royalcoast.pt",
            timestamp: "2026-08-10T17:15:00Z",
            like_count: 312,
            comments_count: 27,
            location: "Baía de Sesimbra",
            category: "jetski"
          },
          {
            id: "ig_post_3",
            caption: "Momentos mágicos: golfinhos a nadar ao lado do nosso barco no Estuário do Sado 🐬✨ Uma experiência inesquecível para toda a família! #royalcoast #golfinhos #sado #setubal #arrabida",
            media_type: "CAROUSEL_ALBUM",
            media_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80",
            permalink: "https://www.instagram.com/royalcoast.pt",
            timestamp: "2026-08-08T11:00:00Z",
            like_count: 489,
            comments_count: 42,
            location: "Reserva Natural do Estuário do Sado",
            category: "dolphins"
          },
          {
            id: "ig_post_4",
            caption: "Pôr do sol único sobre a Serra da Arrábida a partir do oceano 🌅🥂 Brinde a momentos inesquecíveis com a Royal Coast. #royalcoast #sunsettour #arrabida #sesimbra #champagne",
            media_type: "IMAGE",
            media_url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1000&q=80",
            permalink: "https://www.instagram.com/royalcoast.pt",
            timestamp: "2026-08-06T19:45:00Z",
            like_count: 415,
            comments_count: 31,
            location: "Parque Natural da Arrábida",
            category: "sunset"
          },
          {
            id: "ig_post_5",
            caption: "A explorar as grutas secretas da costa da Arrábida. Águas azul-turquesa de tirar o fôlego! 💙 Blue Water Tour. #royalcoast #grutas #arrabidaliving #portugaladventure",
            media_type: "IMAGE",
            media_url: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1000&q=80",
            permalink: "https://www.instagram.com/royalcoast.pt",
            timestamp: "2026-08-04T16:20:00Z",
            like_count: 276,
            comments_count: 14,
            location: "Cabo Espichel / Arrábida",
            category: "tours"
          },
          {
            id: "ig_post_6",
            caption: "Velocidade e liberdade no Atlântico! A nossa frota de Jetskis pronta para acção. Quem vem dar um passeio? 🌊🚀 #royalcoast #jetskisession #watersports #sesimbraturismo",
            media_type: "IMAGE",
            media_url: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=1000&q=80",
            permalink: "https://www.instagram.com/royalcoast.pt",
            timestamp: "2026-08-02T13:10:00Z",
            like_count: 350,
            comments_count: 22,
            location: "Sesimbra, Portugal",
            category: "jetski"
          },
          {
            id: "ig_post_7",
            caption: "Festa privada a bordo com amigos! Comemore os seus momentos especiais no mar connosco 🎉🍾 #royalcoast #privatecharter #boatparty #sesimbra #boattrip",
            media_type: "IMAGE",
            media_url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80",
            permalink: "https://www.instagram.com/royalcoast.pt",
            timestamp: "2026-07-30T18:00:00Z",
            like_count: 298,
            comments_count: 18,
            location: "Praia de Galapinhos",
            category: "tours"
          },
          {
            id: "ig_post_8",
            caption: "A vista deslumbrante de Tróia e das praias desertas da Arrábida. Reserve a sua viagem de barco! ☀️⚓ #royalcoast #troia #setubal #portugal #oceanvibes",
            media_type: "IMAGE",
            media_url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1000&q=80",
            permalink: "https://www.instagram.com/royalcoast.pt",
            timestamp: "2026-07-28T10:30:00Z",
            like_count: 265,
            comments_count: 12,
            location: "Península de Tróia",
            category: "tours"
          }
        ];
      }
    }
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
