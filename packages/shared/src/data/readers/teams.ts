import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import { TeamSchema, type Team } from '../../schemas/team';

export interface TeamWithMeta extends Team {
  /** The team directory name (slug) */
  _slug: string;
}

export async function listTeams(dataRoot: string): Promise<TeamWithMeta[]> {
  const teamsDir = path.join(dataRoot, 'teams');
  let entries;
  try {
    entries = await fs.readdir(teamsDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const dirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('_'));
  const results: TeamWithMeta[] = [];

  for (const dir of dirs) {
    const filePath = path.join(teamsDir, dir.name, 'team.yml');
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = yaml.load(content);
      const parsed = TeamSchema.parse(data);
      results.push({ ...parsed, _slug: dir.name });
    } catch {
      // Skip invalid team files
    }
  }

  return results;
}

export async function getTeamBySlug(
  slug: string,
  dataRoot: string,
): Promise<TeamWithMeta | undefined> {
  const filePath = path.join(dataRoot, 'teams', slug, 'team.yml');
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = yaml.load(content);
    const parsed = TeamSchema.parse(data);
    return { ...parsed, _slug: slug };
  } catch {
    return undefined;
  }
}

export async function getTeamsByHackathon(
  hackathonSlug: string,
  dataRoot: string,
): Promise<TeamWithMeta[]> {
  const all = await listTeams(dataRoot);
  return all.filter(t =>
    t.hackathons?.some(h => h.hackathon === hackathonSlug),
  );
}

export async function getTeamByMember(
  github: string,
  dataRoot: string,
): Promise<TeamWithMeta | undefined> {
  const all = await listTeams(dataRoot);
  return all.find(
    t => t.leader === github || t.members.some(m => m.github === github),
  );
}
