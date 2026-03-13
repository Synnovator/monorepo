import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { listTeams, getTeamBySlug, getTeamsByHackathon, getTeamByMember } from '../teams';
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
const TEAMS_DIR = path.join(DATA_ROOT, 'teams');
const TEST_TEAM_DIR = path.join(TEAMS_DIR, '_test-team-alpha');
const TEST_TEAM_DIR_2 = path.join(TEAMS_DIR, '_test-team-beta');

const TEAM_YAML_1 = `synnovator_team: "1.0"
name: Test Team Alpha
status: recruiting
leader: alice-dev
members:
  - github: bob-ai
    role: developer
    joined_at: "2026-03-10"
  - github: carol-ml
    role: researcher
    joined_at: "2026-03-11"
hackathons:
  - hackathon: ai-hack-2026
    track: nlp
    registered_at: "2026-03-10"
created_at: "2026-03-10"
`;

const TEAM_YAML_2 = `synnovator_team: "1.0"
name: Test Team Beta
status: formed
leader: dave-ops
members:
  - github: eve-design
    role: designer
    joined_at: "2026-03-12"
hackathons:
  - hackathon: web3-hack-2026
    track: defi
    registered_at: "2026-03-12"
created_at: "2026-03-12"
`;

describe('team readers', () => {
  beforeAll(() => {
    // Note: dirs start with _ so they won't be picked up by listTeams normally,
    // but we test using a custom data root approach below.
    // Actually, listTeams filters out dirs starting with '_', so we need non-underscore dirs.
    // Let's create properly named dirs instead.
    const dir1 = path.join(TEAMS_DIR, 'test-team-alpha');
    const dir2 = path.join(TEAMS_DIR, 'test-team-beta');
    fs.mkdirSync(dir1, { recursive: true });
    fs.mkdirSync(dir2, { recursive: true });
    fs.writeFileSync(path.join(dir1, 'team.yml'), TEAM_YAML_1);
    fs.writeFileSync(path.join(dir2, 'team.yml'), TEAM_YAML_2);
  });

  afterAll(() => {
    const dir1 = path.join(TEAMS_DIR, 'test-team-alpha');
    const dir2 = path.join(TEAMS_DIR, 'test-team-beta');
    fs.rmSync(dir1, { recursive: true, force: true });
    fs.rmSync(dir2, { recursive: true, force: true });
  });

  it('listTeams returns parsed teams', async () => {
    const teams = await listTeams(DATA_ROOT);
    expect(teams.length).toBeGreaterThanOrEqual(2);
    const alpha = teams.find(t => t._slug === 'test-team-alpha');
    expect(alpha).toBeDefined();
    expect(alpha!.name).toBe('Test Team Alpha');
    expect(alpha!.members).toHaveLength(2);
  });

  it('getTeamBySlug returns specific team', async () => {
    const team = await getTeamBySlug('test-team-alpha', DATA_ROOT);
    expect(team).toBeDefined();
    expect(team!.name).toBe('Test Team Alpha');
    expect(team!._slug).toBe('test-team-alpha');
    expect(team!.leader).toBe('alice-dev');
  });

  it('getTeamBySlug returns undefined for missing team', async () => {
    const team = await getTeamBySlug('nonexistent-team-xyz', DATA_ROOT);
    expect(team).toBeUndefined();
  });

  it('getTeamsByHackathon filters correctly', async () => {
    const teams = await getTeamsByHackathon('ai-hack-2026', DATA_ROOT);
    expect(teams.length).toBeGreaterThanOrEqual(1);
    expect(teams.every(t => t.hackathons?.some(h => h.hackathon === 'ai-hack-2026'))).toBe(true);

    const web3Teams = await getTeamsByHackathon('web3-hack-2026', DATA_ROOT);
    expect(web3Teams.length).toBeGreaterThanOrEqual(1);
    expect(web3Teams.some(t => t._slug === 'test-team-beta')).toBe(true);

    const noTeams = await getTeamsByHackathon('nonexistent-hack', DATA_ROOT);
    expect(noTeams).toEqual([]);
  });

  it('getTeamByMember finds by member github', async () => {
    const team = await getTeamByMember('bob-ai', DATA_ROOT);
    expect(team).toBeDefined();
    expect(team!._slug).toBe('test-team-alpha');
  });

  it('getTeamByMember finds by leader github', async () => {
    const team = await getTeamByMember('alice-dev', DATA_ROOT);
    expect(team).toBeDefined();
    expect(team!._slug).toBe('test-team-alpha');
  });
});
