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
import type { Team } from '@synnovator/shared/schemas';
import staticData from './static-data.json';

// Cast the untyped JSON to the proper schema types.
// The generate script reads the same YAML sources as the readers,
// so the data shape matches (minus Zod validation at runtime).
const hackathons = staticData.hackathons as unknown as Hackathon[];
const profiles = staticData.profiles as unknown as Profile[];
const submissions = staticData.submissions as unknown as SubmissionWithMeta[];
const results = staticData.results as unknown as Record<string, any[]>;
const teams = ((staticData as any).teams ?? []) as unknown as (Team & { _slug: string })[];
const hackathonsPublic = (staticData as any).hackathonsPublic as unknown as Hackathon[];
const submissionsPublic = (staticData as any).submissionsPublic as unknown as SubmissionWithMeta[];

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

/** @deprecated Use data provider from apps/web/lib/data.ts instead */
export function listHackathons(): Hackathon[] {
  return hackathons;
}

/** @deprecated Use data provider from apps/web/lib/data.ts instead */
export function getHackathon(slug: string): Hackathon | null {
  return hackathons.find(h => h.hackathon.slug === slug) ?? null;
}

/** @deprecated Use data provider from apps/web/lib/data.ts instead */
export function listProfiles(): Profile[] {
  return profiles;
}

/** @deprecated Use data provider from apps/web/lib/data.ts instead */
export function getProfile(github: string): Profile | null {
  return profiles.find(p => p.hacker.github === github) ?? null;
}

/** @deprecated Use data provider from apps/web/lib/data.ts instead */
export function listSubmissions(): SubmissionWithMeta[] {
  return submissions;
}

export function listPublicHackathons(): Hackathon[] {
  return hackathonsPublic;
}

export function listPublicSubmissions(): SubmissionWithMeta[] {
  return submissionsPublic;
}

/** @deprecated Use data provider from apps/web/lib/data.ts instead */
export function getResults(hackathonSlug: string): any[] {
  return results[hackathonSlug] ?? [];
}

export function listTeams(): (Team & { _slug: string })[] {
  return teams;
}

export function getTeam(slug: string): (Team & { _slug: string }) | null {
  return teams.find(t => t._slug === slug) ?? null;
}

export function getTeamsByHackathon(hackathonSlug: string): (Team & { _slug: string })[] {
  return teams.filter(t => t.hackathons?.some(h => h.hackathon === hackathonSlug));
}

// --- Theme data ---

/** @deprecated Use data provider from apps/web/lib/data.ts instead */
export function getActiveThemeName(): string {
  return themeData?.activeTheme ?? '';
}

/** @deprecated Use data provider from apps/web/lib/data.ts instead */
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

/** @deprecated Use data provider from apps/web/lib/data.ts instead */
export function getTheme(id: string): ThemeEntry | null {
  if (!themeData) return null;
  return themeData.themes.find(t => t._id === id) ?? null;
}

/** @deprecated Use data provider from apps/web/lib/data.ts instead */
export function getThemeVariant(hackathonSlug: string, themeName: string): Record<string, unknown> | null {
  if (!themeData) return null;
  return (themeData.variants[`${hackathonSlug}/${themeName}`] as Record<string, unknown>) ?? null;
}
