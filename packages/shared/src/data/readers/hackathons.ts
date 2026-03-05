import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import { HackathonSchema, type Hackathon } from '../../schemas/hackathon';

/**
 * List all hackathons from the data root directory.
 *
 * Uses safeParse so that hackathons with integer weights (e.g. 35 instead of
 * 0.35) are logged as warnings rather than silently dropped. Integer-weight
 * data will be fixed in Task 25; until then the reader normalises them
 * on-the-fly by dividing by 100 when the sum of weights exceeds 1.
 */
export async function listHackathons(dataRoot: string): Promise<Hackathon[]> {
  const hackathonsDir = path.join(dataRoot, 'hackathons');
  const entries = await fs.readdir(hackathonsDir, { withFileTypes: true });
  const dirs = entries.filter(e => e.isDirectory());

  const results: Hackathon[] = [];
  for (const dir of dirs) {
    const filePath = path.join(hackathonsDir, dir.name, 'hackathon.yml');
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const raw = yaml.load(content) as Record<string, unknown>;

      // Try strict parse first
      const result = HackathonSchema.safeParse(raw);
      if (result.success) {
        results.push(result.data);
        continue;
      }

      // If validation failed, attempt to normalise integer weights (0-100 → 0-1)
      // This handles existing YAML data where weights are integers like 35, 25, etc.
      // Will be fixed at the data level in Task 25.
      const normalised = normaliseWeights(raw);
      const retry = HackathonSchema.safeParse(normalised);
      if (retry.success) {
        console.warn(
          `[readers/hackathons] "${dir.name}": integer weights normalised to 0–1 range (fix in Task 25)`,
        );
        results.push(retry.data);
      } else {
        console.warn(
          `[readers/hackathons] Skipping "${dir.name}": validation failed`,
          retry.error.issues.slice(0, 3),
        );
      }
    } catch {
      // Skip directories without a valid hackathon.yml
    }
  }
  return results;
}

export async function getHackathon(slug: string, dataRoot: string): Promise<Hackathon | null> {
  const hackathons = await listHackathons(dataRoot);
  return hackathons.find(h => h.hackathon.slug === slug) ?? null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Walk into hackathon.tracks[].judging.criteria[].weight and convert integer
 * weights (sum > 1) to fractional weights by dividing by the sum.
 */
function normaliseWeights(data: Record<string, unknown>): Record<string, unknown> {
  const clone = structuredClone(data);
  const hackathon = clone.hackathon as Record<string, unknown> | undefined;
  if (!hackathon) return clone;

  const tracks = hackathon.tracks as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(tracks)) return clone;

  for (const track of tracks) {
    const judging = track.judging as Record<string, unknown> | undefined;
    if (!judging) continue;

    const criteria = judging.criteria as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(criteria)) continue;

    const weights = criteria.map(c => Number(c.weight ?? 0));
    const sum = weights.reduce((a, b) => a + b, 0);

    if (sum > 1) {
      for (let i = 0; i < criteria.length; i++) {
        criteria[i].weight = weights[i] / sum;
      }
    }
  }

  return clone;
}
