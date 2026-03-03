/// <reference types="astro/client" />

declare module '*.yml' {
  const value: Record<string, unknown>;
  export default value;
}
