#!/usr/bin/env bash
# create-hackathon.sh — Scaffold a new hackathon directory with hackathon.yml
# Usage: ./scripts/create-hackathon.sh <slug>
# Example: ./scripts/create-hackathon.sh ai-agent-challenge-2026

set -euo pipefail

SLUG="${1:-}"
if [ -z "$SLUG" ]; then
  echo "Usage: $0 <slug>"
  echo "Example: $0 ai-agent-challenge-2026"
  exit 1
fi

DIR="hackathons/$SLUG"
if [ -d "$DIR" ]; then
  echo "Error: $DIR already exists"
  exit 1
fi

mkdir -p "$DIR/assets" "$DIR/submissions"

cat > "$DIR/hackathon.yml" << 'YAML'
synnovator_version: "2.0"

hackathon:
  name: ""
  name_zh: ""
  slug: ""
  tagline: ""
  tagline_zh: ""
  type: "community"              # community | enterprise | youth-league | open-source
  description: ""
  description_zh: ""

organizers:
  - github: ""
    role: "lead"

timeline:
  draft: ""                       # ISO 8601 datetime
  registration: ""
  development: ""
  submission: ""
  judging: ""
  announcement: ""
  award: ""

tracks:
  - name: ""
    name_zh: ""
    slug: ""
    description: ""
    rewards: []
    judging:
      mode: "expert_only"
      criteria: []
    deliverables:
      required: []
      optional: []

settings:
  allow_multi_track: false
  language: ["en", "zh"]
  ai_review: true
  ai_team_matching: false
  public_vote: "none"
YAML

# Fill in the slug
sed -i '' "s/^  slug: \"\"/  slug: \"$SLUG\"/" "$DIR/hackathon.yml"

echo "Created $DIR/"
echo "  - $DIR/hackathon.yml (edit this file)"
echo "  - $DIR/assets/"
echo "  - $DIR/submissions/"
echo ""
echo "Next: edit hackathon.yml, then submit a PR."
