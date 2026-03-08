import { describe, it, expect } from 'vitest';
import { listHackathons, getHackathon } from '../hackathons';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve monorepo root: walk up from this file until we find hackathons/
import fs from 'node:fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findDataRoot(from: string): string {
  let dir = from;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'hackathons'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error('Could not find monorepo root with hackathons/ directory');
}
const DATA_ROOT = findDataRoot(__dirname);

describe('hackathon readers', () => {
  it('listHackathons returns parsed hackathons', async () => {
    const hackathons = await listHackathons(DATA_ROOT);
    expect(hackathons.length).toBeGreaterThan(0);
    expect(hackathons[0].hackathon.slug).toBeDefined();
  });

  it('getHackathon returns null for missing slug', async () => {
    const result = await getHackathon('nonexistent-slug-xyz', DATA_ROOT);
    expect(result).toBeNull();
  });

  it('getHackathon returns data for existing slug', async () => {
    const all = await listHackathons(DATA_ROOT);
    if (all.length > 0) {
      const slug = all[0].hackathon.slug;
      const result = await getHackathon(slug, DATA_ROOT);
      expect(result).not.toBeNull();
      expect(result!.hackathon.slug).toBe(slug);
    }
  });
});
