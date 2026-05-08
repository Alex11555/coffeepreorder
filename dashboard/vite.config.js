import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// We don't proxy the API; the dashboard reads VITE_API_URL at build/dev time.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
});
