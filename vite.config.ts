import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  // Firestore SDK는 공유 모드에서만 따로 불러오는 큰 청크라 경고 기준을 올린다
  build: { chunkSizeWarningLimit: 700 },
});
