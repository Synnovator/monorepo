import { describe, it, expect } from 'vitest';
import { criterionSchema, timeRangeSchema, HackathonSchema } from '../hackathon';

describe('criterionSchema', () => {
  it('accepts decimal weight 0-1', () => {
    const result = criterionSchema.safeParse({
      name: 'Innovation',
      weight: 0.35,
    });
    expect(result.success).toBe(true);
  });

  it('rejects weight > 1', () => {
    const result = criterionSchema.safeParse({
      name: 'Innovation',
      weight: 35,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative weight', () => {
    const result = criterionSchema.safeParse({
      name: 'Innovation',
      weight: -0.1,
    });
    expect(result.success).toBe(false);
  });
});

describe('timeRangeSchema', () => {
  it('accepts start and end only', () => {
    const result = timeRangeSchema.safeParse({
      start: '2026-04-01T00:00:00Z',
      end: '2026-04-15T23:59:59Z',
    });
    expect(result.success).toBe(true);
  });

  it('accepts start, end, and description', () => {
    const result = timeRangeSchema.safeParse({
      start: '2026-04-01T00:00:00Z',
      end: '2026-04-15T23:59:59Z',
      description: 'Open registration period',
      description_zh: '开放报名阶段',
    });
    expect(result.success).toBe(true);
  });
});

describe('HackathonSchema timeline validation', () => {
  const minimalHackathon = {
    synnovator_version: '2.0',
    hackathon: {
      name: 'Test',
      slug: 'test',
      type: 'community' as const,
      timeline: {
        registration: {
          start: '2026-04-01T00:00:00Z',
          end: '2026-04-15T23:59:59Z',
        },
      },
    },
  };

  it('accepts timeline with registration dates', () => {
    const result = HackathonSchema.safeParse(minimalHackathon);
    expect(result.success).toBe(true);
  });

  it('accepts timeline stages with descriptions', () => {
    const result = HackathonSchema.safeParse({
      ...minimalHackathon,
      hackathon: {
        ...minimalHackathon.hackathon,
        timeline: {
          registration: {
            start: '2026-04-01T00:00:00Z',
            end: '2026-04-15T23:59:59Z',
            description: 'Sign up here',
            description_zh: '在此报名',
          },
        },
      },
    });
    expect(result.success).toBe(true);
  });
});
