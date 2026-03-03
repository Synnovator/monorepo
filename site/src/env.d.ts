/// <reference types="astro/client" />

declare module '*.yml' {
  const value: Record<string, unknown>;
  export default value;
}

type Runtime = import('@astrojs/cloudflare').Runtime<{
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  AUTH_SECRET: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_ENDPOINT: string;
  R2_BUCKET_NAME: string;
  SITE_URL: string;
}>;

declare namespace App {
  interface Locals extends Runtime {}
}
