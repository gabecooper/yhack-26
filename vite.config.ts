import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [react()],
  envPrefix: ['VITE_', 'SUPABASE_'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/polymarket-api': {
        target: 'https://gamma-api.polymarket.com',
        changeOrigin: true,
        rewrite: currentPath => currentPath.replace(/^\/polymarket-api/, ''),
      },
    },
  },
});
