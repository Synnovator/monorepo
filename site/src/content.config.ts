import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// === Shared sub-schemas ===

const timeRangeSchema = z.object({
  start: z.string(),
  end: z.string(),
});

const rewardSchema = z.object({
  type: z.string(),
  rank: z.string().optional(),
  amount: z.string().optional(),
  description: z.string().optional(),
  count: z.number().optional(),
});

const criterionSchema = z.object({
  name: z.string(),
  name_zh: z.string().optional(),
  weight: z.number(),
  description: z.string().optional(),
  score_range: z.array(z.number()).optional(),
  hard_constraint: z.boolean().optional(),
  constraint_rule: z.string().optional(),
});

const deliverableItemSchema = z.object({
  type: z.string(),
  format: z.string().optional(),
  description: z.string().optional(),
});

const trackSchema = z.object({
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

const judgeSchema = z.object({
  github: z.string(),
  name: z.string(),
  name_zh: z.string().optional(),
  title: z.string().optional(),
  affiliation: z.string().optional(),
  expertise: z.string().optional(),
  conflict_declaration: z.string().optional(),
});

const eventSchema = z.object({
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

const faqSchema = z.object({
  q: z.string(),
  q_en: z.string().optional(),
  a: z.string(),
  a_en: z.string().optional(),
});

const datasetSchema = z.object({
  name: z.string(),
  name_zh: z.string().optional(),
  version: z.string().optional(),
  description: z.string().optional(),
  access_control: z.string().optional(),
  format: z.string().optional(),
  size: z.string().optional(),
  download_url: z.string().optional(),
});

// === Hackathon Collection ===

const hackathons = defineCollection({
  loader: glob({ pattern: '**/hackathon.yml', base: '../hackathons' }),
  schema: z.object({
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
        ai_team_matching: z.boolean().optional(),
        public_vote: z.string().optional(),
        vote_emoji: z.string().optional(),
      }).optional(),
    }),
  }),
});

// === Profile Collection ===

const profiles = defineCollection({
  loader: glob({ pattern: '[!_]*.yml', base: '../profiles' }),
  schema: z.object({
    synnovator_profile: z.string(),
    hacker: z.object({
      github: z.string(),
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
        team: z.string().optional(),
        registered_at: z.string(),
      })).optional(),
    }),
  }),
});

// === Submission sub-schemas ===

const submissionTeamMemberSchema = z.object({
  github: z.string(),
  role: z.string().optional(),
});

const submissionDeliverablesSchema = z.object({
  repo: z.string().optional(),
  demo: z.string().optional(),
  video: z.string().optional(),
  document: z.object({
    local_path: z.string().optional(),
    r2_url: z.string().optional(),
  }).optional(),
});

const submissionSchema = z.object({
  synnovator_submission: z.string(),
  project: z.object({
    name: z.string(),
    name_zh: z.string().optional(),
    tagline: z.string().optional(),
    tagline_zh: z.string().optional(),
    track: z.string(),
    team: z.array(submissionTeamMemberSchema),
    deliverables: submissionDeliverablesSchema.optional(),
    tech_stack: z.array(z.string()).optional(),
    description: z.string().optional(),
    description_zh: z.string().optional(),
    likes: z.number().optional(),
  }),
});

// === Submission Collection ===

const submissions = defineCollection({
  loader: glob({ pattern: '**/submissions/*/project.yml', base: '../hackathons' }),
  schema: submissionSchema,
});

const readmes = defineCollection({
  loader: glob({ pattern: '**/submissions/*/README.{md,mdx}', base: '../hackathons' }),
});

const results = defineCollection({
  loader: glob({ pattern: '**/results/*.json', base: '../hackathons' }),
  schema: z.object({
    calculated_at: z.string(),
    total_judges: z.number(),
    total_teams: z.number(),
    rankings: z.array(z.object({
      rank: z.number(),
      team: z.string(),
      final_score: z.number(),
      criteria_breakdown: z.array(z.object({
        criterion: z.string(),
        weight: z.number(),
        average: z.number(),
      })).optional(),
    })),
  }),
});

export const collections = { hackathons, profiles, submissions, readmes, results };
