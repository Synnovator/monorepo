import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import yaml from '@modyfi/vite-plugin-yaml';

export default defineConfig({
  site: 'https://synnovator.github.io',
  output: 'static',
  vite: {
    plugins: [tailwindcss(), yaml()],
  },
});
