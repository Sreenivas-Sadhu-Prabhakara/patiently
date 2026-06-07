import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Load VITE_* vars from the repo-root .env so config lives in one place.
export default defineConfig({
  plugins: [react()],
  envDir: resolve(__dirname, '../../'),
  server: { port: 5173 },
});
