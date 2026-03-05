import { z } from 'zod';

// === Result Schema ===

export const ResultSchema = z.object({
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
});

// === Type aliases ===

export type Result = z.infer<typeof ResultSchema>;
