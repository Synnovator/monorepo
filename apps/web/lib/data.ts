import { StaticDataProvider } from './static-provider';
import type { DataProvider } from '@synnovator/shared/data';

/**
 * Unified data entry point for the web application.
 *
 * Uses StaticDataProvider which reads from pre-generated JSON files,
 * compatible with Cloudflare Workers runtime (no node:fs dependency).
 */
export const data: DataProvider = new StaticDataProvider();
