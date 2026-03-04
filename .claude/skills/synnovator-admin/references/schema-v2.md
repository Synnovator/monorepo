# Hackathon Schema V2 Reference

Load this file when executing write operations on `hackathon.yml` files. It defines the complete
field structure, validation rules, and type-specific requirements.

## Top-Level Structure

```yaml
synnovator_version: "2.0"    # REQUIRED, must be "2.0"

hackathon:
  # --- Identity (required) ---
  name: ""                   # English name (required)
  name_zh: ""                # Chinese name (optional)
  slug: ""                   # URL-safe identifier: [a-z0-9-] only (required)
  tagline: ""                # Short description (optional)
  tagline_zh: ""             # (optional)
  type: ""                   # REQUIRED: community | enterprise | youth-league | open-source
  status: ""                 # Optional: draft | active | archived (omitted = active)
  description: ""            # Full description, supports multiline |
  description_zh: ""         # (optional)

  # --- People ---
  organizers:                # REQUIRED, at least one
    - name: ""
      name_zh: ""
      role: "organizer"      # organizer | co-organizer | sponsor
      website: ""

  sponsors: []               # Optional
  partners: []               # Optional

  judges:                    # Optional (required before judging phase)
    - github: ""             # GitHub username
      name: ""
      title: ""
      affiliation: ""
      expertise: ""

  # --- Eligibility ---
  eligibility:
    open_to: "all"           # all | students | professionals | invited
    restrictions: []
    blacklist: []
    team_size:
      min: 1                 # >= 1
      max: 5                 # >= min
    allow_solo: true
    mentor_rules:            # Optional, mainly for youth-league
      allowed: false
      max_mentors: 0
      mentor_can_code: false

  # --- Legal ---
  legal:
    license: ""              # Apache-2.0 | MIT | proprietary | other
    ip_ownership: ""         # participant | organizer | shared
    nda:
      required: false
      url: ""                # REQUIRED if nda.required == true AND type == enterprise
      summary: ""
    compliance_notes: []
    data_policy: ""

  # --- Timeline (required) ---
  timeline:
    # At minimum, define registration + submission stages.
    # Full set of 7 stages (all optional except registration):
    draft:
      start: ""              # ISO 8601: YYYY-MM-DDTHH:MM:SSZ
      end: ""
    registration:            # REQUIRED stage
      start: ""
      end: ""
    development:
      start: ""
      end: ""
    submission:
      start: ""
      end: ""
    judging:
      start: ""
      end: ""
    announcement:
      start: ""
      end: ""
    award:
      start: ""
      end: ""
  # Rule: Within each stage, start < end.
  # Rule: Stages should be in chronological order (no overlap between sequential stages).

  # --- Events (optional) ---
  events:
    - name: ""
      type: ""               # ama | livestream | workshop | meetup | deadline
      datetime: ""           # ISO 8601
      duration_minutes: 0

  # --- Tracks (required, at least one) ---
  tracks:
    - name: ""               # Required
      name_zh: ""
      slug: ""               # Required, [a-z0-9-] only
      description: ""
      description_zh: ""
      rewards:
        - type: ""           # cash | prize | internship | certificate | job | other
          rank: ""           # 1st | 2nd | 3rd | Top N | etc.
          amount: ""
          description: ""
      judging:
        mode: ""             # expert_only | expert_plus_vote | weighted
        vote_weight: 0       # 0-1, weight of public vote (only for expert_plus_vote)
        criteria:
          - name: ""         # Criterion name
            name_zh: ""
            weight: 0.0      # 0.0-1.0, ALL criteria weights MUST sum to 1.0 (±0.01)
            score_range: [0, 100]
            hard_constraint: false
            constraint_rule: ""
      deliverables:
        required:            # Array of deliverable OBJECTS (not strings!)
          - type: ""         # repo | document | video | demo | model | other
            format: ""       # github-url | url | pdf | file | etc.
            description: ""  # Human-readable description
        optional:            # Same object format as required
          - type: ""
            format: ""
            description: ""

  # --- Datasets (optional, common in enterprise) ---
  datasets:
    - name: ""
      name_zh: ""
      version: ""
      description: ""
      access_control: ""     # public | nda-required | nda
      format: ""             # CSV | Parquet | JSON | etc.
      size: ""
      download_url: ""

  # --- FAQ (optional) ---
  faq:
    - q: ""
      q_en: ""
      a: ""
      a_en: ""

  # --- Settings ---
  settings:
    allow_multi_track: false
    multi_track_rule: ""     # independent | shared
    language: ["zh", "en"]
    ai_review: false
    ai_team_matching: false
    public_vote: "none"      # none | reactions
    vote_emoji: ""           # e.g., "👍" (only when public_vote == reactions)
```

## Type-Specific Requirements

### community
- `eligibility.open_to` typically `"all"`
- `legal.license` typically `"Apache-2.0"` or `"MIT"`
- `legal.ip_ownership` typically `"participant"`
- `settings.public_vote` often `"reactions"`

### enterprise
- `legal.nda.required` often `true`
- When `legal.nda.required == true`: `legal.nda.url` MUST be non-empty
- `legal.ip_ownership` typically `"organizer"`
- `legal.compliance_notes` should list IP/confidentiality terms
- `datasets` section usually present with `access_control: "nda-required"`
- `settings.public_vote` typically `"none"`

### youth-league
- `eligibility.open_to` must be `"students"`
- `eligibility.mentor_rules` should be defined
- `eligibility.team_size.allow_solo` typically `false`
- Consider adding `eligibility.identity.type: "student"` with verification

### open-source
- `legal.license` must be an OSI-approved license
- `legal.ip_ownership` must be `"participant"` or `"shared"`

## Validation Rules Summary

1. `synnovator_version` == `"2.0"`
2. `hackathon.name` non-empty
3. `hackathon.slug` matches `^[a-z0-9-]+$`
4. `hackathon.type` ∈ {community, enterprise, youth-league, open-source}
5. `hackathon.timeline` has at least `registration` with valid `start` and `end`
6. Each timeline stage: `start < end` (ISO 8601 comparison)
7. `hackathon.tracks` has at least one entry with `name` and `slug`
8. `tracks[].judging.criteria[].weight` sums to 1.0 (±0.01 tolerance)
9. `hackathon.organizers` has at least one entry with `name`
10. Enterprise + NDA required → `legal.nda.url` non-empty

These rules are enforced by `scripts/validate-hackathon.sh` — always run it before committing.

## Profile Schema (profiles/*.yml)

```yaml
synnovator_profile: "2.0"

hacker:
  github: ""                 # REQUIRED
  name: ""                   # REQUIRED
  name_zh: ""
  avatar: ""                 # Defaults to https://github.com/{username}.png
  bio: ""
  bio_zh: ""
  location: ""
  languages: []              # e.g., ["zh", "en"]

  identity:
    type: ""                 # student | professional | academic
    affiliation: ""
    degree: ""               # bachelor | master | phd (students only)
    major: ""
    graduation_year:

  skills:
    - category: ""           # e.g., "AI/ML", "Backend", "Frontend"
      items: []

  interests: []
  looking_for:
    roles: []
    team_size: ""
    collaboration_style: ""

  experience:
    years:
    hackathons:
      - name: ""
        result: ""
        project_url: ""
    projects:
      - name: ""
        url: ""
        description: ""

  links:
    twitter: ""
    linkedin: ""
    website: ""

  judge_profile:
    available: false
    expertise: []
    conflict_declaration: ""
```

File naming: `{username}-{uuid8}.yml` (the script generates the UUID automatically).

## Submission Schema (project.yml)

```yaml
synnovator_submission: "2.0"

project:
  name: ""                   # REQUIRED
  name_zh: ""
  tagline: ""
  track: ""                  # REQUIRED, must match a track slug in hackathon.yml

  team:                      # REQUIRED, at least one member
    - github: ""
      role: ""               # Lead Developer | Developer | Designer | etc.

  mentors: []

  deliverables:
    repo: ""                 # GitHub URL
    document:
      local_path: ""
      r2_url: ""
    video: ""
    demo: ""

  tech_stack: []
  references:
    - name: ""
      url: ""
      usage: ""

  description: ""
  description_zh: ""
```
