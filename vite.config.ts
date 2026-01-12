import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente do nível do sistema (Vercel) e arquivos .env
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    define: {
      // Define process.env como um objeto contendo apenas o necessário
      // Isso evita erros de serialização no Vercel e 'process is not defined' no navegador
      'process.env': {
        API_KEY: env.API_KEY,
        NODE_ENV: process.env.NODE_ENV
      }
    }
  };
});