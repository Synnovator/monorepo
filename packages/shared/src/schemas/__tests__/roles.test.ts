import { describe, it, expect } from 'vitest';
import {
  HackerRoleSchema,
  TopLevelRoleSchema,
  RegistrationRoleSchema,
} from '../roles';

describe('roles schemas', () => {
  it('HackerRoleSchema accepts valid hacker roles', () => {
    for (const role of ['developer', 'product', 'designer', 'marketing', 'researcher']) {
      expect(HackerRoleSchema.parse(role)).toBe(role);
    }
  });

  it('HackerRoleSchema rejects invalid roles', () => {
    expect(() => HackerRoleSchema.parse('leader')).toThrow();
    expect(() => HackerRoleSchema.parse('mentor')).toThrow();
  });

  it('TopLevelRoleSchema accepts all top-level roles', () => {
    for (const role of ['hacker', 'mentor', 'judge', 'observer']) {
      expect(TopLevelRoleSchema.parse(role)).toBe(role);
    }
  });

  it('RegistrationRoleSchema accepts registration roles', () => {
    for (const role of ['participant', 'mentor', 'observer']) {
      expect(RegistrationRoleSchema.parse(role)).toBe(role);
    }
  });

  it('RegistrationRoleSchema rejects team roles', () => {
    expect(() => RegistrationRoleSchema.parse('team-lead')).toThrow();
    expect(() => RegistrationRoleSchema.parse('team-member')).toThrow();
  });
});
