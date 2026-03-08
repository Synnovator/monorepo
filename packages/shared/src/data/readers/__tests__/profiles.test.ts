import { describe, it, expect } from 'vitest';
import { listProfiles, getProfile } from '../profiles';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
function findDataRoot(from: string): string {
  let dir = from;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'profiles'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error('Could not find monorepo root with profiles/ directory');
}
const DATA_ROOT = findDataRoot(__dirname);

describe('profile readers', () => {
  it('listProfiles returns parsed profiles', async () => {
    const profiles = await listProfiles(DATA_ROOT);
    expect(profiles.length).toBeGreaterThan(0);
    expect(profiles[0].hacker.github).toBeDefined();
  });

  it('getProfile returns null for missing github', async () => {
    const result = await getProfile('nonexistent-user-xyz', DATA_ROOT);
    expect(result).toBeNull();
  });

  it('getProfile returns data for existing user', async () => {
    const all = await listProfiles(DATA_ROOT);
    if (all.length > 0) {
      const github = all[0].hacker.github;
      const result = await getProfile(github, DATA_ROOT);
      expect(result).not.toBeNull();
      expect(result!.hacker.github).toBe(github);
    }
  });
});
