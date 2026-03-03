#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/create-hackathon.sh <slug> <type> <name>
# Example: ./scripts/create-hackathon.sh my-hackathon-2026 community "My Hackathon 2026"

SLUG="${1:?Usage: create-hackathon.sh <slug> <type> <name>}"
TYPE="${2:?Type required: community|enterprise|youth-league|open-source}"
NAME="${3:?Name required}"

# Validate type
case "$TYPE" in
  community|enterprise|youth-league|open-source) ;;
  *) echo "ERROR: Invalid type '$TYPE'. Must be: community|enterprise|youth-league|open-source" >&2; exit 1 ;;
esac

DIR="hackathons/${SLUG}"
FILE="${DIR}/hackathon.yml"

if [ -d "$DIR" ]; then
  echo "ERROR: Directory $DIR already exists" >&2
  exit 1
fi

mkdir -p "${DIR}/assets" "${DIR}/submissions"

cat > "$FILE" << YAML
synnovator_version: "2.0"

hackathon:
  name: "${NAME}"
  name_zh: ""
  slug: "${SLUG}"
  tagline: ""
  tagline_zh: ""
  type: "${TYPE}"
  description: ""
  description_zh: ""

  organizers:
    - name: ""
      role: "organizer"

  eligibility:
    open_to: "all"
    team_size:
      min: 1
      max: 5
    allow_solo: true

  timeline:
    registration:
      start: "$(date -u +%Y-%m-%dT00:00:00Z)"
      end: "$(date -u -v+30d +%Y-%m-%dT23:59:59Z 2>/dev/null || date -u -d '+30 days' +%Y-%m-%dT23:59:59Z)"

  tracks:
    - name: "Default Track"
      slug: "default"

  settings:
    language: ["zh", "en"]
YAML

echo "Created hackathon: $FILE"
echo "Next: edit $FILE to fill in details, then commit and create PR"
