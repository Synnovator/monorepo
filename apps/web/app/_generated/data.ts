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
