import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 서버 없는 단독 미니앱: 운세 콘텐츠는 전부 번들 내 문장 풀 + 결정적 시드 계산.
export default defineConfig({
  plugins: [react()],
});
