import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://synnovator.github.io',
  base: '/page',
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});
