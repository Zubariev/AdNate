import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
<<<<<<< HEAD
    port: 3000,
=======
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: 'all',
>>>>>>> c600462 (Assistant checkpoint: Allow all hosts in Vite configuration)
    headers: {
      'Content-Type': 'application/javascript',
    },
  },
  publicDir: 'public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
