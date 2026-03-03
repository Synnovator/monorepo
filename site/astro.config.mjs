import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://synnovator.github.io',
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});
