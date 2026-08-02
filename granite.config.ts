import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  // src/config.ts APP_NAME과 문자 단위 동일. 딥링크 intoss://hikingtime.
  appName: 'hikingtime',
  brand: {
    displayName: '등산 소요시간 계산기',
    primaryColor: '#2F9E44',
    icon: 'https://static.toss.im/appsintoss/61245/a5480dd3-2024-4cf1-9d55-a76d290c1235.png',
  },
  web: { host: 'localhost', port: 5173, commands: { dev: 'vite', build: 'vite build' } },
  permissions: [],
  outdir: 'dist',
});
