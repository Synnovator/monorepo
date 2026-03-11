/**
 * Static data accessor for Cloudflare Workers runtime.
 *
 * Imports pre-generated JSON (built by scripts/generate-static-data.mjs)
 * instead of reading YAML files with Node.js `fs`. This is necessary because
 * Cloudflare Workers don't support the `fs` module.
 *
 * The generate script runs before `next build` via the `prebuild` npm script.
 */
import type { Hackathon } from '@synnovator/shared/types';
import type { Profile } from '@synnovator/shared/types';
import type { SubmissionWithMeta } from '@synnovator/shared/data';
import staticData from './static-data.json';

// Cast the untyped JSON to the proper schema types.
// The generate script reads the same YAML sources as the readers,
// so the data shape matches (minus Zod validation at runtime).
const hackathons = staticData.hackathons as unknown as Hackathon[];
const profiles = staticData.profiles as unknown as Profile[];
const submissions = staticData.submissions as unknown as SubmissionWithMeta[];
const results = staticData.results as unknown as Record<string, any[]>;

interface ThemeEntry {
  _id: string;
  name?: string;
  name_zh?: string;
  description?: string;
  light?: Record<string, string>;
  dark?: Record<string, string>;
  fonts?: Record<string, string>;
  radius?: string;
}

const themeData = (staticData as any).themes as {
  activeTheme: string;
  themes: ThemeEntry[];
  variants: Record<string, Record<string, unknown>>;
} | undefined;

export function listHackathons(): Hackathon[] {
  return hackathons;
}

export function getHackathon(slug: string): Hackathon | null {
  return hackathons.find(h => h.hackathon.slug === slug) ?? null;
}

export function listProfiles(): Profile[] {
  return profiles;
}

export function getProfile(github: string): Profile | null {
  return profiles.find(p => p.hacker.github === github) ?? null;
}

export function listSubmissions(): SubmissionWithMeta[] {
  return submissions;
}

export function getResults(hackathonSlug: string): any[] {
  return results[hackathonSlug] ?? [];
}

// --- Theme data ---

export function getActiveThemeName(): string {
  return themeData?.activeTheme ?? '';
}

export function listThemes(): { id: string; name: string; name_zh?: string; active: boolean }[] {
  if (!themeData) return [];
  const active = themeData.activeTheme;
  return themeData.themes.map(t => ({
    id: t._id,
    name: t.name ?? t._id,
    name_zh: t.name_zh,
    active: t._id === active,
  }));
}

export function getTheme(id: string): ThemeEntry | null {
  if (!themeData) return null;
  return themeData.themes.find(t => t._id === id) ?? null;
}

export function getThemeVariant(hackathonSlug: string, themeName: string): Record<string, unknown> | null {
  if (!themeData) return null;
  return (themeData.variants[`${hackathonSlug}/${themeName}`] as Record<string, unknown>) ?? null;
}
