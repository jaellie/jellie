import { defineConfig } from 'vite';

// base './' so the built dist/ works from any static host or sub-path
export default defineConfig({
  base: './',
  server: { host: true },
  build: { chunkSizeWarningLimit: 1200 },
});
