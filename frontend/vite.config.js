import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// React 설계서 5.4 — 개발 서버 연결 및 공통 설정
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }, // import '@/components/...'
  },
  server: {
    port: 5173,
    proxy: {
      // Mock(MSW)을 끄면 /api 요청이 Spring 서버(8080)로 전달된다
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
});
