import { describe, it, expect } from 'vitest';
import { HackathonSchema } from '../hackathon';
import { SubmissionSchema } from '../submission';

describe('HackathonSchema visibility', () => {
  it('accepts visibility: public', () => {
    const data = makeMinimalHackathon({ visibility: 'public' });
    const result = HackathonSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.hackathon.visibility).toBe('public');
  });

  it('accepts visibility: private', () => {
    const data = makeMinimalHackathon({ visibility: 'private' });
    const result = HackathonSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.hackathon.visibility).toBe('private');
  });

  it('defaults to public when visibility is omitted', () => {
    const data = makeMinimalHackathon({});
    const result = HackathonSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.hackathon.visibility).toBe('public');
  });

  it('rejects invalid visibility value', () => {
    const data = makeMinimalHackathon({ visibility: 'draft' });
    const result = HackathonSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('SubmissionSchema visibility', () => {
  it('accepts visibility: private', () => {
    const data = makeMinimalSubmission({ visibility: 'private' });
    const result = SubmissionSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.project.visibility).toBe('private');
  });

  it('defaults to public when visibility is omitted', () => {
    const data = makeMinimalSubmission({});
    const result = SubmissionSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.project.visibility).toBe('public');
  });
});

function makeMinimalHackathon(overrides: Record<string, unknown>) {
  return {
    synnovator_version: '2.0',
    hackathon: {
      name: 'Test',
      slug: 'test',
      type: 'community',
      ...overrides,
    },
  };
}

function makeMinimalSubmission(overrides: Record<string, unknown>) {
  return {
    synnovator_submission: '2.0',
    project: {
      name: 'Test Project',
      track: 'default',
      team_ref: 'team-test',
      ...overrides,
    },
  };
}
