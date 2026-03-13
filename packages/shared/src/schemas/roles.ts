import { z } from 'zod';

/** Hacker sub-type roles — used in team.yml members[].role */
export const HackerRoleSchema = z.enum([
  'developer',
  'product',
  'designer',
  'marketing',
  'researcher',
]);
export type HackerRole = z.infer<typeof HackerRoleSchema>;

/** Top-level platform roles */
export const TopLevelRoleSchema = z.enum([
  'hacker',
  'mentor',
  'judge',
  'observer',
]);
export type TopLevelRole = z.infer<typeof TopLevelRoleSchema>;

/** Registration roles — used in profile registrations[].role */
export const RegistrationRoleSchema = z.enum([
  'participant',
  'mentor',
  'observer',
]);
export type RegistrationRole = z.infer<typeof RegistrationRoleSchema>;
