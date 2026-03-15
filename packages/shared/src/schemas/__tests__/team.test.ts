import { describe, it, expect } from 'vitest';
import { TeamSchema, TeamStatusSchema } from '../team';

const validTeam = {
  synnovator_team: '1.0',
  name: 'Team Awesome',
  status: 'recruiting',
  leader: 'alice-dev',
  members: [
    { github: 'bob-ai', role: 'developer', joined_at: '2026-03-10' },
  ],
  created_at: '2026-03-10',
};

describe('TeamSchema', () => {
  it('parses a valid team with all fields', () => {
    const full = {
      ...validTeam,
      name_zh: '牛逼队',
      looking_for: {
        roles: ['researcher', 'designer'],
        description: 'Need ML researcher',
      },
      hackathons: [
        { hackathon: 'ai-hack-2026', track: 'nlp', registered_at: '2026-03-10' },
      ],
    };
    const result = TeamSchema.parse(full);
    expect(result.name).toBe('Team Awesome');
    expect(result.members).toHaveLength(1);
    expect(result.hackathons).toHaveLength(1);
  });

  it('parses minimal team (no optional fields)', () => {
    const result = TeamSchema.parse(validTeam);
    expect(result.leader).toBe('alice-dev');
    expect(result.looking_for).toBeUndefined();
    expect(result.hackathons).toBeUndefined();
  });

  it('rejects invalid status', () => {
    expect(() => TeamSchema.parse({ ...validTeam, status: 'active' })).toThrow();
  });

  it('rejects invalid member role', () => {
    const bad = {
      ...validTeam,
      members: [{ github: 'x', role: 'leader', joined_at: '2026-01-01' }],
    };
    expect(() => TeamSchema.parse(bad)).toThrow();
  });

  it('accepts empty members array', () => {
    const result = TeamSchema.parse({ ...validTeam, members: [] });
    expect(result.members).toEqual([]);
  });

  it('TeamStatusSchema accepts all valid statuses', () => {
    for (const s of ['recruiting', 'formed', 'disbanded']) {
      expect(TeamStatusSchema.parse(s)).toBe(s);
    }
  });
});
