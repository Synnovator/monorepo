import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import { ProfileSchema, type Profile } from '../../schemas/profile';

export async function listProfiles(dataRoot: string): Promise<Profile[]> {
  const profilesDir = path.join(dataRoot, 'profiles');
  const entries = await fs.readdir(profilesDir);
  const ymlFiles = entries.filter(f => f.endsWith('.yml') && !f.startsWith('_'));

  const results: Profile[] = [];
  for (const file of ymlFiles) {
    try {
      const content = await fs.readFile(path.join(profilesDir, file), 'utf-8');
      const data = yaml.load(content);
      const parsed = ProfileSchema.parse(data);
      results.push(parsed);
    } catch {
      // Skip invalid/missing entries
    }
  }
  return results;
}

export async function getProfile(github: string, dataRoot: string): Promise<Profile | null> {
  const profiles = await listProfiles(dataRoot);
  return profiles.find(p => p.hacker.github === github) ?? null;
}
