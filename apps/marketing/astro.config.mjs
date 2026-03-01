import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://asiomarketing.com',
  output: 'hybrid',
  adapter: cloudflare({ mode: 'advanced' }),
  integrations: [react()],
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: { prefixDefaultLocale: false }
  },
  vite: {
    css: { preprocessorOptions: { scss: { quietDeps: true } } },
    optimizeDeps: { exclude: ['@astrojs/cloudflare'] }
  }
});
