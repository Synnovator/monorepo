import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import yaml from '@modyfi/vite-plugin-yaml';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  site: 'https://home.synnovator.space',
  integrations: [react(), mdx()],
  adapter: cloudflare({
    platformProxy: { enabled: true },
  }),
  vite: {
    plugins: [
      tailwindcss(),
      yaml(),
      svgr({
        include: '**/*.svg?react',
        svgrOptions: {
          plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
          svgoConfig: {
            plugins: [
              {
                name: 'preset-default',
                params: {
                  overrides: {
                    removeViewBox: false,
                  },
                },
              },
            ],
          },
        },
      }),
    ],
    resolve: {
      alias: import.meta.env.PROD
        ? { 'react-dom/server': 'react-dom/server.edge' }
        : {},
    },
    ssr: {
      noExternal: ['class-variance-authority', 'clsx', 'tailwind-merge'],
    },
  },
});
