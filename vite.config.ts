import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Isso evita o erro "process is not defined" no navegador e permite passar a API KEY
    'process.env': process.env
  }
});