import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // @ts-ignore: process is defined in Node environment for build
  const cwd = process.cwd();
  
  // Carrega variáveis de ambiente
  const env = loadEnv(mode, cwd, '');

  return {
    plugins: [react()],
    define: {
      // Injeta a API_KEY de forma segura
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    }
  };
});