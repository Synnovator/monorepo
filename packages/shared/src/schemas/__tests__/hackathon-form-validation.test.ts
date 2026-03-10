import { describe, it, expect } from 'vitest';

/**
 * These tests document the validation rules shared between:
 * - UI form: apps/web/components/forms/CreateHackathonForm.tsx (isStepValid)
 * - CI: scripts/validate-hackathon.sh
 *
 * If a rule changes in one place, these tests remind you to update the other.
 */

interface Stage {
  key: string;
  start: string;
  end: string;
  description: string;
  removable: boolean;
}

// Mirror of the UI's isStepValid logic for the timeline step
function isTimelineStepValid(stages: Stage[]): boolean {
  const registration = stages.find(s => s.key === 'registration');
  if (!registration) return false;
  if (!registration.start || !registration.end) return false;
  // Every active stage (has start) must have description
  for (const stage of stages) {
    if (stage.start && !stage.description) return false;
  }
  return true;
}

// Mirror of what the bash script checks (Rules 4-6, 12)
function ciTimelineValidation(timeline: Record<string, { start?: string; end?: string; description?: string }>): string[] {
  const errors: string[] = [];
  if (!timeline || Object.keys(timeline).length === 0) {
    errors.push('hackathon.timeline is required');
  }
  if (!timeline?.registration?.start) {
    errors.push('hackathon.timeline.registration.start is required');
  }
  if (!timeline?.registration?.end) {
    errors.push('hackathon.timeline.registration.end is required');
  }
  // Rule 5: start < end
  const stages = ['draft', 'registration', 'development', 'submission', 'judging', 'announcement', 'award'];
  for (const stage of stages) {
    const s = timeline?.[stage];
    if (s?.start && s?.end && s.start > s.end) {
      errors.push(`timeline.${stage}: start must be before end`);
    }
  }
  // Rule 12: active stages must have description
  for (const stage of stages) {
    const s = timeline?.[stage];
    if (s?.start && !s?.description) {
      errors.push(`timeline.${stage}: description is required for active stages`);
    }
  }
  return errors;
}

describe('Timeline validation consistency (UI ↔ CI)', () => {
  it('rejects when registration is missing', () => {
    const stages: Stage[] = [
      { key: 'draft', start: '', end: '', description: '', removable: true },
      { key: 'development', start: '', end: '', description: '', removable: true },
    ];
    expect(isTimelineStepValid(stages)).toBe(false);

    const ciErrors = ciTimelineValidation({});
    expect(ciErrors).toContain('hackathon.timeline.registration.start is required');
  });

  it('rejects when registration has no dates', () => {
    const stages: Stage[] = [
      { key: 'registration', start: '', end: '', description: '', removable: false },
    ];
    expect(isTimelineStepValid(stages)).toBe(false);

    const ciErrors = ciTimelineValidation({ registration: {} });
    expect(ciErrors).toContain('hackathon.timeline.registration.start is required');
  });

  it('accepts when registration has start and end and description', () => {
    const stages: Stage[] = [
      { key: 'registration', start: '2026-04-01T00:00:00Z', end: '2026-04-15T23:59:59Z', description: 'Sign up', removable: false },
    ];
    expect(isTimelineStepValid(stages)).toBe(true);

    const ciErrors = ciTimelineValidation({
      registration: { start: '2026-04-01T00:00:00Z', end: '2026-04-15T23:59:59Z', description: 'Sign up' },
    });
    expect(ciErrors).toHaveLength(0);
  });

  it('rejects when active stage has no description', () => {
    const stages: Stage[] = [
      { key: 'registration', start: '2026-04-01T00:00:00Z', end: '2026-04-15T23:59:59Z', description: 'Sign up', removable: false },
      { key: 'development', start: '2026-04-16T00:00:00Z', end: '2026-05-15T23:59:59Z', description: '', removable: true },
    ];
    expect(isTimelineStepValid(stages)).toBe(false);

    const ciErrors = ciTimelineValidation({
      registration: { start: '2026-04-01T00:00:00Z', end: '2026-04-15T23:59:59Z', description: 'Sign up' },
      development: { start: '2026-04-16T00:00:00Z', end: '2026-05-15T23:59:59Z' },
    });
    expect(ciErrors).toContain('timeline.development: description is required for active stages');
  });

  it('CI rejects when start > end', () => {
    const ciErrors = ciTimelineValidation({
      registration: { start: '2026-04-15T00:00:00Z', end: '2026-04-01T23:59:59Z', description: 'Sign up' },
    });
    expect(ciErrors).toContain('timeline.registration: start must be before end');
  });
});
