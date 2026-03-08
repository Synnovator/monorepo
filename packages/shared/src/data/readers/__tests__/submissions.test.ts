import { describe, it, expect } from 'vitest';
import { listSubmissions, getSubmissionsByHackathon } from '../submissions';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
function findDataRoot(from: string): string {
  let dir = from;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'hackathons'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error('Could not find monorepo root with hackathons/ directory');
}
const DATA_ROOT = findDataRoot(__dirname);

describe('submission readers', () => {
  it('listSubmissions returns parsed submissions', async () => {
    const submissions = await listSubmissions(DATA_ROOT);
    expect(submissions.length).toBeGreaterThan(0);
    expect(submissions[0].project.name).toBeDefined();
    expect(submissions[0]._hackathonSlug).toBeDefined();
    expect(submissions[0]._teamSlug).toBeDefined();
  });

  it('getSubmissionsByHackathon returns submissions for existing hackathon', async () => {
    const all = await listSubmissions(DATA_ROOT);
    if (all.length > 0) {
      const slug = all[0]._hackathonSlug;
      const filtered = await getSubmissionsByHackathon(slug, DATA_ROOT);
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every(s => s._hackathonSlug === slug)).toBe(true);
    }
  });

  it('getSubmissionsByHackathon returns empty array for missing hackathon', async () => {
    const result = await getSubmissionsByHackathon('nonexistent-slug-xyz', DATA_ROOT);
    expect(result).toEqual([]);
  });
});
