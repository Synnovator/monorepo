import { describe, it, expect } from 'vitest';
import { hackathonCardClass, hackathonTypeIcon } from '@/lib/hackathon-theme';

describe('hackathonCardClass', () => {
  it('returns rounded-xl with top border for community (default)', () => {
    const cls = hackathonCardClass('community');
    expect(cls).toContain('rounded-xl');
    expect(cls).toContain('border-t-');
  });

  it('returns rounded-sm with left border for enterprise', () => {
    const cls = hackathonCardClass('enterprise');
    expect(cls).toContain('rounded-sm');
    expect(cls).toContain('border-l-');
  });

  it('returns rounded-lg with dashed border and rotation for youth-league', () => {
    const cls = hackathonCardClass('youth-league');
    expect(cls).toContain('rounded-lg');
    expect(cls).toContain('border-dashed');
    expect(cls).toContain('rotate');
  });

  it('defaults to community style for unknown types', () => {
    const cls = hackathonCardClass('unknown');
    expect(cls).toContain('rounded-xl');
  });
});

describe('hackathonTypeIcon', () => {
  it('returns a function component for each type', () => {
    expect(typeof hackathonTypeIcon('community')).toBe('function');
    expect(typeof hackathonTypeIcon('enterprise')).toBe('function');
    expect(typeof hackathonTypeIcon('youth-league')).toBe('function');
  });

  it('returns different icons for different types', () => {
    const community = hackathonTypeIcon('community');
    const enterprise = hackathonTypeIcon('enterprise');
    const youth = hackathonTypeIcon('youth-league');
    expect(community).not.toBe(enterprise);
    expect(enterprise).not.toBe(youth);
  });
});
