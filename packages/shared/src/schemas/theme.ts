import { z } from 'zod';

// === OKLCH Color Validation ===

/**
 * Matches OKLCH color values in CSS functional notation:
 *   oklch(L C H)           — e.g. oklch(0.55 0.2 35)
 *   oklch(L C H / alpha%)  — e.g. oklch(1 0 0 / 10%)
 *   oklch(L C H / alpha)   — e.g. oklch(1 0 0 / 0.1)
 *
 * L: 0–1 (lightness), C: 0+ (chroma), H: 0–360 (hue)
 */
const OKLCH_RE =
  /^oklch\(\s*(?:\d+(?:\.\d+)?)\s+(?:\d+(?:\.\d+)?)\s+(?:\d+(?:\.\d+)?)(?:\s*\/\s*(?:\d+(?:\.\d+)?%?))?\s*\)$/;

export const oklchValue = z
  .string()
  .regex(OKLCH_RE, 'Must be a valid oklch() color value');

// === Token Names ===

export const TOKEN_NAMES = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'destructive-foreground',
  'border',
  'input',
  'ring',
  'brand',
  'brand-foreground',
  'highlight',
  'highlight-foreground',
  'info',
  'info-foreground',
] as const;

export type TokenName = (typeof TOKEN_NAMES)[number];

// === Token Map ===

const tokenMapSchema = z.record(
  z.enum(TOKEN_NAMES),
  oklchValue,
);

// === Full Token Map (all tokens required) ===

const fullTokenMapSchema = z.object(
  Object.fromEntries(TOKEN_NAMES.map((name) => [name, oklchValue])) as {
    [K in TokenName]: typeof oklchValue;
  },
);

// === Partial Token Map (for overrides) ===

const partialTokenMapSchema = z.object(
  Object.fromEntries(
    TOKEN_NAMES.map((name) => [name, oklchValue.optional()]),
  ) as {
    [K in TokenName]: z.ZodOptional<typeof oklchValue>;
  },
);

// === Theme Config Schema ===

export const themeConfigSchema = z.object({
  light: fullTokenMapSchema,
  dark: fullTokenMapSchema,
  fonts: z
    .object({
      heading: z.string().optional(),
      sans: z.string().optional(),
      code: z.string().optional(),
      zh: z.string().optional(),
    })
    .optional(),
  radius: z.string().optional(),
});

export type ThemeConfig = z.infer<typeof themeConfigSchema>;

// === Platform Theme Schema (full theme + metadata) ===

export const platformThemeSchema = z.object({
  name: z.string().min(1),
  name_zh: z.string().optional(),
  description: z.string().optional(),
  light: fullTokenMapSchema,
  dark: fullTokenMapSchema,
  fonts: z
    .object({
      heading: z.string().optional(),
      sans: z.string().optional(),
      code: z.string().optional(),
      zh: z.string().optional(),
    })
    .optional(),
  radius: z.string().optional(),
});

export type PlatformTheme = z.infer<typeof platformThemeSchema>;

// === Platform Theme Meta (for listing) ===

export const platformThemeMetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  name_zh: z.string().optional(),
  active: z.boolean(),
});

export type PlatformThemeMeta = z.infer<typeof platformThemeMetaSchema>;

// === Hackathon Theme Schema (partial overrides) ===

export const hackathonThemeSchema = z.object({
  light: partialTokenMapSchema.optional(),
  dark: partialTokenMapSchema.optional(),
});

export type HackathonTheme = z.infer<typeof hackathonThemeSchema>;

// === Theme Submission Schema (POST body) ===

export const themeSubmissionSchema = z.object({
  type: z.enum(['platform', 'hackathon-variant', 'activate']),
  themeName: z.string().min(1),
  hackathonSlug: z.string().optional(),
  name: z.string().optional(),
  name_zh: z.string().optional(),
  description: z.string().optional(),
  light: tokenMapSchema.optional(),
  dark: tokenMapSchema.optional(),
  fonts: z
    .object({
      heading: z.string().optional(),
      sans: z.string().optional(),
      code: z.string().optional(),
      zh: z.string().optional(),
    })
    .optional(),
  radius: z.string().optional(),
  message: z.string().optional(),
});

export type ThemeSubmission = z.infer<typeof themeSubmissionSchema>;
