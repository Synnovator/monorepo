import { z } from 'zod';
import { HackerRoleSchema } from './roles';

export const TeamStatusSchema = z.enum(['recruiting', 'formed', 'disbanded']);
export type TeamStatus = z.infer<typeof TeamStatusSchema>;

export const teamMemberSchema = z.object({
  github: z.string(),
  role: HackerRoleSchema,
  joined_at: z.string(),
});

export const teamHackathonSchema = z.object({
  hackathon: z.string(),
  track: z.string(),
  registered_at: z.string(),
});

export const TeamSchema = z.object({
  synnovator_team: z.string(),
  name: z.string(),
  name_zh: z.string().optional(),
  description: z.string().optional(),
  description_zh: z.string().optional(),
  github_url: z.string().url().optional(),
  status: TeamStatusSchema,
  leader: z.string(),
  members: z.array(teamMemberSchema),
  looking_for: z.object({
    roles: z.array(HackerRoleSchema).optional(),
    description: z.string().optional(),
  }).optional(),
  hackathons: z.array(teamHackathonSchema).optional(),
  created_at: z.string(),
});

export type Team = z.infer<typeof TeamSchema>;
export type TeamMember = z.infer<typeof teamMemberSchema>;
