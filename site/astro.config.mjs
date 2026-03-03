import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import yaml from '@modyfi/vite-plugin-yaml';

export default defineConfig({
  site: 'https://home.synnovator.space',
  output: 'static',
  vite: {
    plugins: [tailwindcss(), yaml()],
  },
});
