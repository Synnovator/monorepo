import { describe, it, expect } from 'vitest';
import { ProfileSchema } from '../profile';

const baseProfile = {
  synnovator_profile: '1.0',
  hacker: {
    github: 'alice-dev',
    name: 'Alice',
  },
};

describe('ProfileSchema (team field)', () => {
  it('accepts hacker.team as optional string', () => {
    const result = ProfileSchema.parse({
      ...baseProfile,
      hacker: { ...baseProfile.hacker, team: 'team-awesome' },
    });
    expect(result.hacker.team).toBe('team-awesome');
  });

  it('accepts profile without team', () => {
    const result = ProfileSchema.parse(baseProfile);
    expect(result.hacker.team).toBeUndefined();
  });

  it('registration does not have team field', () => {
    const result = ProfileSchema.parse({
      ...baseProfile,
      hacker: {
        ...baseProfile.hacker,
        registrations: [{
          hackathon: 'ai-hack',
          track: 'nlp',
          role: 'participant',
          registered_at: '2026-03-08',
        }],
      },
    });
    expect(result.hacker.registrations).toHaveLength(1);
  });
});
