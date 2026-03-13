import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  transpilePackages: ['@synnovator/ui', '@synnovator/shared'],
  images: {
    unoptimized: true,
  },
  webpack(config) {
    // Support `import foo from './file.mdx?raw'` as raw text string
    config.module.rules.push({
      resourceQuery: /raw/,
      type: 'asset/source',
    });
    return config;
  },
};

export default nextConfig;
