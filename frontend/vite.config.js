import path from 'path';
import { defineConfig, searchForWorkspaceRoot } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// React 설계서 5.4 — 개발 서버 연결 및 공통 설정
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // import '@/components/...'
      '@mock': path.resolve(__dirname, '../mock-data'), // MSW Mock 데이터·핸들러 (프로젝트 루트의 mock-data/가 유일한 원본)
    },
    dedupe: ['msw'], // frontend 밖(mock-data/msw)의 import 'msw'도 frontend/node_modules에서 찾도록
  },
  server: {
    port: 5173,
    fs: { allow: [searchForWorkspaceRoot(process.cwd()), path.resolve(__dirname, '../mock-data')] },
    proxy: {
      // Mock(MSW)을 끄면 /api 요청이 Spring 서버(8080)로 전달된다
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
});
