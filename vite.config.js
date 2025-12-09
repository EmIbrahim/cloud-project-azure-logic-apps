import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config kept lean for quick startup; extend as backend integrations land.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
});

