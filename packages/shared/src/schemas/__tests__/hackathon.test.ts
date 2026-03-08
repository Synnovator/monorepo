import { describe, it, expect } from 'vitest';
import { criterionSchema, HackathonSchema } from '../hackathon';

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
