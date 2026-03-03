#!/usr/bin/env bash
# submit-project.sh — Scaffold a project submission directory
# Usage: ./scripts/submit-project.sh <hackathon-slug> <team-name>
# Example: ./scripts/submit-project.sh ai-agent-challenge-2026 team-alpha

set -euo pipefail

HACKATHON="${1:-}"
TEAM="${2:-}"

if [ -z "$HACKATHON" ] || [ -z "$TEAM" ]; then
  echo "Usage: $0 <hackathon-slug> <team-name>"
  echo "Example: $0 ai-agent-challenge-2026 team-alpha"
  exit 1
fi

HACKATHON_DIR="hackathons/$HACKATHON"
if [ ! -d "$HACKATHON_DIR" ]; then
  echo "Error: hackathon '$HACKATHON' not found at $HACKATHON_DIR"
  exit 1
fi

SUBMIT_DIR="$HACKATHON_DIR/submissions/$TEAM"
if [ -d "$SUBMIT_DIR" ]; then
  echo "Error: $SUBMIT_DIR already exists"
  exit 1
fi

mkdir -p "$SUBMIT_DIR"

cat > "$SUBMIT_DIR/submission.yml" << YAML
synnovator_submission: "2.0"

project:
  name: ""
  name_zh: ""
  tagline: ""
  track: ""                          # Must match a track slug in hackathon.yml

  team:
    - github: ""
      role: "Lead Developer"

  deliverables:
    repo: ""
    document:
      local_path: ""
      r2_url: ""
    video: ""
    demo: ""

  tech_stack: []

  description: |
    Describe your project here...
  description_zh: |
    项目描述...
YAML

echo "Created $SUBMIT_DIR/"
echo "  - $SUBMIT_DIR/submission.yml (edit this file)"
echo ""
echo "Next: edit submission.yml, then submit a PR."
