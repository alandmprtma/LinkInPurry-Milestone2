import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import {TanStackRouterVite} from '@tanstack/router-vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite(),
  ],
  server: { //FE Hot reload
    watch: {
      usePolling: true,
      interval: 100,
    },
    host: true,
    port: 5173,
  },
});

// src/
// ├── pages/
// │   ├── index.tsx        // Route: /
// │   ├── about.tsx        // Route: /about
// │   ├── blog/
// │   │   ├── index.tsx    // Route: /blog
// │   │   ├── [id].tsx     // Route: /blog/:id (dynamic route)
// │   ├── contact/
// │   │   ├── index.tsx    // Route: /contact
// │   │   ├── form.tsx     // Route: /contact/form
