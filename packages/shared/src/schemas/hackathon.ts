import { z } from 'zod';

// === Shared sub-schemas ===

export const timeRangeSchema = z.object({
  start: z.string(),
  end: z.string(),
  description: z.string().optional(),
  description_zh: z.string().optional(),
});

export const rewardSchema = z.object({
  type: z.string(),
  rank: z.string().optional(),
  amount: z.string().optional(),
  description: z.string().optional(),
  count: z.number().optional(),
});

export const criterionSchema = z.object({
  name: z.string(),
  name_zh: z.string().optional(),
  weight: z.number().min(0).max(1),
  description: z.string().optional(),
  score_range: z.array(z.number()).optional(),
  hard_constraint: z.boolean().optional(),
  constraint_rule: z.string().optional(),
  constraint_rule_zh: z.string().optional(),
});

export const deliverableItemSchema = z.object({
  type: z.string(),
  format: z.string().optional(),
  description: z.string().optional(),
});

export const trackSchema = z.object({
  name: z.string(),
  name_zh: z.string().optional(),
  slug: z.string(),
  description: z.string().optional(),
  description_zh: z.string().optional(),
  rewards: z.array(rewardSchema).optional(),
  judging: z.object({
    mode: z.string(),
    vote_weight: z.number().optional(),
    criteria: z.array(criterionSchema).optional(),
  }).optional(),
  deliverables: z.object({
    required: z.array(deliverableItemSchema).optional(),
    optional: z.array(deliverableItemSchema).optional(),
  }).optional(),
});

export const judgeSchema = z.object({
  github: z.string(),
  name: z.string(),
  name_zh: z.string().optional(),
  title: z.string().optional(),
  affiliation: z.string().optional(),
  expertise: z.string().optional(),
  conflict_declaration: z.string().optional(),
});

export const eventSchema = z.object({
  name: z.string(),
  name_zh: z.string().optional(),
  type: z.string(),
  datetime: z.string(),
  duration_minutes: z.number().optional(),
  url: z.string().optional(),
  location: z.string().optional(),
  capacity: z.number().optional(),
  description: z.string().optional(),
});

export const faqSchema = z.object({
  q: z.string(),
  q_en: z.string().optional(),
  a: z.string(),
  a_en: z.string().optional(),
});

export const datasetSchema = z.object({
  name: z.string(),
  name_zh: z.string().optional(),
  version: z.string().optional(),
  description: z.string().optional(),
  access_control: z.string().optional(),
  format: z.string().optional(),
  size: z.string().optional(),
  download_url: z.string().optional(),
});

// === Hackathon Schema ===

export const HackathonSchema = z.object({
  synnovator_version: z.string(),
  hackathon: z.object({
    name: z.string(),
    name_zh: z.string().optional(),
    slug: z.string(),
    tagline: z.string().optional(),
    tagline_zh: z.string().optional(),
    type: z.enum(['community', 'enterprise', 'youth-league', 'open-source']),
    description: z.string().optional(),
    description_zh: z.string().optional(),
    managed_by: z.array(z.string()).optional(),
    organizers: z.array(z.object({
      name: z.string().optional(),
      name_zh: z.string().optional(),
      github: z.string().optional(),
      logo: z.string().optional(),
      website: z.string().optional(),
      role: z.string().optional(),
    })).optional(),
    sponsors: z.array(z.object({
      name: z.string().optional(),
      name_zh: z.string().optional(),
      logo: z.string().optional(),
      tier: z.string().optional(),
    })).optional(),
    partners: z.array(z.object({
      name: z.string().optional(),
      name_zh: z.string().optional(),
      role: z.string().optional(),
    })).optional(),
    eligibility: z.object({
      open_to: z.string().optional(),
      restrictions: z.array(z.string()).optional(),
      blacklist: z.array(z.string()).optional(),
      team_size: z.object({
        min: z.number(),
        max: z.number(),
      }).optional(),
      allow_solo: z.boolean().optional(),
      mentor_rules: z.object({
        allowed: z.boolean().optional(),
        max_contribution_pct: z.number().optional(),
        count_in_team: z.boolean().optional(),
        count_in_award: z.boolean().optional(),
      }).optional(),
    }).optional(),
    legal: z.object({
      license: z.string().optional(),
      ip_ownership: z.string().optional(),
      nda: z.object({
        required: z.boolean().optional(),
        document_url: z.string().optional(),
        summary: z.string().optional(),
      }).optional(),
      compliance_notes: z.array(z.string()).optional(),
      data_policy: z.string().optional(),
    }).optional(),
    timeline: z.object({
      draft: timeRangeSchema.optional(),
      registration: timeRangeSchema.optional(),
      development: timeRangeSchema.optional(),
      submission: timeRangeSchema.optional(),
      judging: timeRangeSchema.optional(),
      announcement: timeRangeSchema.optional(),
      award: timeRangeSchema.optional(),
    }).optional(),
    events: z.array(eventSchema).optional(),
    tracks: z.array(trackSchema).optional(),
    judges: z.array(judgeSchema).optional(),
    datasets: z.array(datasetSchema).optional(),
    faq: z.array(faqSchema).optional(),
    settings: z.object({
      allow_multi_track: z.boolean().optional(),
      multi_track_rule: z.string().optional(),
      language: z.array(z.string()).optional(),
      ai_review: z.boolean().optional(),
      public_vote: z.string().optional(),
      vote_emoji: z.string().optional(),
    }).optional(),
  }),
});

// === Type aliases ===

export type TimeRange = z.infer<typeof timeRangeSchema>;
export type Reward = z.infer<typeof rewardSchema>;
export type Criterion = z.infer<typeof criterionSchema>;
export type DeliverableItem = z.infer<typeof deliverableItemSchema>;
export type Track = z.infer<typeof trackSchema>;
export type Judge = z.infer<typeof judgeSchema>;
export type Event = z.infer<typeof eventSchema>;
export type FAQ = z.infer<typeof faqSchema>;
export type Dataset = z.infer<typeof datasetSchema>;
export type Hackathon = z.infer<typeof HackathonSchema>;
