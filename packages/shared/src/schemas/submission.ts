import { z } from 'zod';

// === Submission sub-schemas ===

export const submissionMentorSchema = z.object({
  github: z.string(),
  name: z.string().optional(),
  affiliation: z.string().optional(),
});

export const submissionDeliverablesSchema = z.object({
  repo: z.string().optional(),
  demo: z.string().optional(),
  video: z.string().optional(),
  document: z.object({
    local_path: z.string().optional(),
    url: z.string().optional(),
  }).optional(),
});

export const SubmissionSchema = z.object({
  synnovator_submission: z.string(),
  project: z.object({
    name: z.string(),
    name_zh: z.string().optional(),
    tagline: z.string().optional(),
    tagline_zh: z.string().optional(),
    track: z.string(),
    team_ref: z.string(),
    mentors: z.array(submissionMentorSchema).optional(),
    deliverables: submissionDeliverablesSchema.optional(),
    tech_stack: z.array(z.string()).optional(),
    description: z.string().optional(),
    description_zh: z.string().optional(),
    likes: z.number().optional(),
  }),
});

// === Type aliases ===

export type Submission = z.infer<typeof SubmissionSchema>;
export type SubmissionData = Submission['project'];
