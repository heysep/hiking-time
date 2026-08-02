import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  // src/config.ts APP_NAME과 문자 단위 동일. 딥링크 intoss://hikingtime.
  appName: 'hikingtime',
  brand: {
    displayName: '등산 소요시간 계산기',
    primaryColor: '#2F9E44',
    icon: '',
  },
  web: { host: 'localhost', port: 5173, commands: { dev: 'vite', build: 'vite build' } },
  permissions: [],
  outdir: 'dist',
});
