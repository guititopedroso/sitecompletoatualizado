import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// Backend URL on Hostinger phpMyAdmin MySQL database
const BACKEND_URL = process.env.VITE_API_URL || 'https://www.royalcoast.pt';

function googleAuthDevPlugin() {
  return {
    name: 'google-auth-dev-plugin',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url && (req.url === '/api/auth/google' || req.url.startsWith('/api/auth/google')) && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk: any) => { bodyStr += chunk; });
          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              
              // 1. Try local server first (http://localhost:3001)
              try {
                const localRes = await fetch('http://localhost:3001/api/auth/google', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body)
                });
                if (localRes.ok) {
                  const data = await localRes.json();
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                  return;
                }
              } catch (e) {
                // Local server not active
              }

              // 2. Local dev user response
              const email = body.email || '';
              const name = body.displayName || body.name || 'Utilizador Google';
              const photo = body.photoURL || body.picture || null;
              const gId = body.sub || body.googleId || Math.random().toString(36).substring(2, 15);
              const uid = 'g-' + gId;
              const namePart = name.trim().toLowerCase().replace(/\s+/g, '').slice(0, 5);
              const referralCode = `${namePart}-${Math.random().toString(36).substring(2, 6)}`;
              const token = 'g-dev-token-' + Math.random().toString(36).substring(2, 15);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                token,
                user: {
                  uid,
                  email,
                  displayName: name,
                  photoURL: photo,
                  provider: 'google.com',
                  referralCode,
                  firstName: null,
                  lastName: null,
                  phonePrefix: null,
                  phoneNumber: null,
                  birthDate: null
                }
              }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    googleAuthDevPlugin(),
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'favicon.svg'],
      manifest: {
        name: 'RoyalCoast',
        short_name: 'RoyalCoast',
        description: 'RoyalCoast - Aluguer de Motas de Água em Setúbal, Tróia e Arrábida',
        theme_color: '#ffffff',
        background_color: '#002b45',
        icons: [
          {
            src: 'web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            'lucide-react',
            'framer-motion'
          ],
          'vendor-charts': ['recharts'],
          'vendor-utils': ['date-fns', 'zod', 'clsx', 'tailwind-merge']
        }
      }
    }
  }
}));
