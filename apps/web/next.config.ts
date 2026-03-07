import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  transpilePackages: ['@synnovator/ui', '@synnovator/shared'],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
