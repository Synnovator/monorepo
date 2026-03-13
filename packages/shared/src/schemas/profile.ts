import { z } from 'zod';

// === Profile Schema ===

export const ProfileSchema = z.object({
  synnovator_profile: z.string(),
  hacker: z.object({
    github: z.string(),
    team: z.string().optional(),
    name: z.string(),
    name_zh: z.string().optional(),
    avatar: z.string().optional(),
    bio: z.string().optional(),
    bio_zh: z.string().optional(),
    location: z.string().optional(),
    languages: z.array(z.string()).optional(),
    identity: z.object({
      type: z.string().optional(),
      affiliation: z.string().optional(),
      degree: z.string().optional(),
      major: z.string().optional(),
      graduation_year: z.number().optional(),
    }).optional(),
    skills: z.array(z.object({
      category: z.string(),
      items: z.array(z.string()),
    })).optional(),
    interests: z.array(z.string()).optional(),
    looking_for: z.object({
      roles: z.array(z.string()).optional(),
      team_size: z.string().optional(),
      collaboration_style: z.string().optional(),
    }).optional(),
    experience: z.object({
      years: z.number().optional(),
      hackathons: z.array(z.object({
        name: z.string(),
        result: z.string().optional(),
        project_url: z.string().optional(),
      })).optional(),
      projects: z.array(z.object({
        name: z.string(),
        url: z.string().optional(),
        description: z.string().optional(),
      })).optional(),
    }).optional(),
    links: z.object({
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      website: z.string().optional(),
    }).optional(),
    judge_profile: z.object({
      available: z.boolean().optional(),
      expertise: z.array(z.string()).optional(),
      conflict_declaration: z.string().optional(),
    }).optional(),
    nda_signed: z.array(z.object({
      hackathon: z.string(),
      signed_at: z.string(),
    })).optional(),
    registrations: z.array(z.object({
      hackathon: z.string(),
      track: z.string(),
      role: z.string(),
      registered_at: z.string(),
    })).optional(),
  }),
});

// === Type aliases ===

export type Profile = z.infer<typeof ProfileSchema>;
export type ProfileData = Profile['hacker'];
