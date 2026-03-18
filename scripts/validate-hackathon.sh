#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/validate-hackathon.sh <path-to-hackathon.yml>
# Exit: 0 = valid, 1 = validation errors found
# Deps: yq (https://github.com/mikefarah/yq)
#
# This script is used both locally (by synnovator-admin skill) and in CI
# (by GitHub Actions validation workflows). Keep it self-contained.

FILE="${1:?Usage: validate-hackathon.sh <path-to-hackathon.yml>}"

if [ ! -f "$FILE" ]; then
  echo "ERROR: File not found: $FILE" >&2
  exit 1
fi

# Check yq is available
if ! command -v yq &>/dev/null; then
  echo "ERROR: yq is required but not installed. Install: brew install yq" >&2
  exit 1
fi

ERRORS=()

# Helper: add error
err() { ERRORS+=("$1"); }

# --- Rule 1: synnovator_version must be "2.0" ---
VERSION=$(yq '.synnovator_version' "$FILE")
if [ "$VERSION" != "2.0" ]; then
  err "synnovator_version must be \"2.0\", got \"$VERSION\""
fi

# --- Rule 2: Required fields ---
NAME=$(yq '.hackathon.name' "$FILE")
SLUG=$(yq '.hackathon.slug' "$FILE")
TYPE=$(yq '.hackathon.type' "$FILE")
TIMELINE=$(yq '.hackathon.timeline' "$FILE")

[ "$NAME" = "null" ] || [ -z "$NAME" ] && err "hackathon.name is required"
[ "$SLUG" = "null" ] || [ -z "$SLUG" ] && err "hackathon.slug is required"
[ "$TYPE" = "null" ] || [ -z "$TYPE" ] && err "hackathon.type is required"
[ "$TIMELINE" = "null" ] && err "hackathon.timeline is required"

# --- Rule 3: type enum ---
if [ "$TYPE" != "null" ] && [ -n "$TYPE" ]; then
  case "$TYPE" in
    community|enterprise|youth-league|open-source) ;;
    *) err "hackathon.type must be one of: community, enterprise, youth-league, open-source (got \"$TYPE\")" ;;
  esac
fi

# --- Rule: visibility field validation ---
VISIBILITY=$(yq '.hackathon.visibility' "$FILE")
if [ "$VISIBILITY" = "null" ] || [ -z "$VISIBILITY" ]; then
  echo "WARNING: hackathon.visibility is not set — defaulting to 'public'. New hackathons should set visibility: private" >&2
fi
if [ "$VISIBILITY" != "null" ] && [ -n "$VISIBILITY" ]; then
  case "$VISIBILITY" in
    public|private) ;;
    *) err "hackathon.visibility must be 'public' or 'private' (got \"$VISIBILITY\")" ;;
  esac
fi

# --- Rule 4: slug format ---
if [ "$SLUG" != "null" ] && [ -n "$SLUG" ]; then
  if ! echo "$SLUG" | grep -qE '^[a-z0-9-]+$'; then
    err "hackathon.slug must match [a-z0-9-] only (got \"$SLUG\")"
  fi
fi

# --- Rule 5: Timeline stage ordering (start < end) ---
STAGES=(draft registration development submission judging announcement award)
for STAGE in "${STAGES[@]}"; do
  START=$(yq ".hackathon.timeline.${STAGE}.start" "$FILE")
  END=$(yq ".hackathon.timeline.${STAGE}.end" "$FILE")

  if [ "$START" != "null" ] && [ "$END" != "null" ] && [ -n "$START" ] && [ -n "$END" ]; then
    if [[ "$START" > "$END" ]]; then
      err "timeline.${STAGE}: start ($START) must be before end ($END)"
    fi
  fi
done

# --- Rule 6: Registration stage is required ---
REG_START=$(yq '.hackathon.timeline.registration.start' "$FILE")
REG_END=$(yq '.hackathon.timeline.registration.end' "$FILE")
if [ "$REG_START" = "null" ] || [ -z "$REG_START" ]; then
  err "hackathon.timeline.registration.start is required"
fi
if [ "$REG_END" = "null" ] || [ -z "$REG_END" ]; then
  err "hackathon.timeline.registration.end is required"
fi

# --- Rule 7: At least one track ---
TRACK_COUNT=$(yq '.hackathon.tracks | length' "$FILE")
if [ "$TRACK_COUNT" = "0" ] || [ "$TRACK_COUNT" = "null" ]; then
  err "hackathon.tracks must have at least one track"
fi

# --- Rule 8: Criteria weights sum to ~1.0 or ~100 per track ---
# Supports two conventions: decimal (0.3 + 0.7 = 1.0) or percentage (30 + 70 = 100)
if [ "$TRACK_COUNT" != "null" ] && [ "$TRACK_COUNT" -gt 0 ] 2>/dev/null; then
  for i in $(seq 0 $((TRACK_COUNT - 1))); do
    TRACK_NAME=$(yq ".hackathon.tracks[$i].name" "$FILE")
    WEIGHT_SUM=$(yq ".hackathon.tracks[$i].judging.criteria[].weight" "$FILE" 2>/dev/null | awk '{s+=$1} END {printf "%.2f", s}')

    if [ -n "$WEIGHT_SUM" ] && [ "$WEIGHT_SUM" != "0.00" ]; then
      # Accept weights summing to 1.0 (±0.01) or 100 (±1)
      DIFF_1=$(echo "$WEIGHT_SUM 1.0" | awk '{d=$1-$2; if(d<0) d=-d; print d}')
      DIFF_100=$(echo "$WEIGHT_SUM 100.0" | awk '{d=$1-$2; if(d<0) d=-d; print d}')
      OK_1=$(echo "$DIFF_1" | awk '{print ($1 <= 0.01)}')
      OK_100=$(echo "$DIFF_100" | awk '{print ($1 <= 1.0)}')
      if [ "$OK_1" != "1" ] && [ "$OK_100" != "1" ]; then
        err "track \"$TRACK_NAME\": criteria weights sum to $WEIGHT_SUM (must be 1.0 ±0.01 or 100 ±1)"
      fi
    fi
  done
fi

# --- Rule 9: At least one organizer ---
ORG_COUNT=$(yq '.hackathon.organizers | length' "$FILE")
if [ "$ORG_COUNT" = "0" ] || [ "$ORG_COUNT" = "null" ]; then
  err "hackathon.organizers must have at least one entry"
fi

# --- Rule 10: Enterprise NDA URL required ---
# Checks both field names: .url (new convention) and .document_url (legacy)
if [ "$TYPE" = "enterprise" ]; then
  NDA_REQUIRED=$(yq '.hackathon.legal.nda.required' "$FILE")
  if [ "$NDA_REQUIRED" = "true" ]; then
    NDA_URL=$(yq '.hackathon.legal.nda.url // .hackathon.legal.nda.document_url' "$FILE")
    if [ "$NDA_URL" = "null" ] || [ -z "$NDA_URL" ]; then
      err "enterprise hackathon with nda.required=true must have legal.nda.url (or document_url) set"
    fi
  fi
fi

# --- Rule 11: Deliverables must be objects, not strings ---
# The Astro content.config.ts Zod schema expects deliverables as objects with {type, format?, description?}.
# Plain strings (e.g., "- Source code repository") will cause build failures.
if [ "$TRACK_COUNT" != "null" ] && [ "$TRACK_COUNT" -gt 0 ] 2>/dev/null; then
  for i in $(seq 0 $((TRACK_COUNT - 1))); do
    TRACK_NAME=$(yq ".hackathon.tracks[$i].name" "$FILE")
    for KIND in required optional; do
      DELIV_COUNT=$(yq ".hackathon.tracks[$i].deliverables.${KIND} | length" "$FILE" 2>/dev/null)
      if [ "$DELIV_COUNT" != "null" ] && [ "$DELIV_COUNT" != "0" ] 2>/dev/null; then
        for j in $(seq 0 $((DELIV_COUNT - 1))); do
          DELIV_TYPE=$(yq ".hackathon.tracks[$i].deliverables.${KIND}[$j].type" "$FILE" 2>/dev/null)
          DELIV_TAG=$(yq ".hackathon.tracks[$i].deliverables.${KIND}[$j] | tag" "$FILE" 2>/dev/null)
          if [ "$DELIV_TAG" = "!!str" ]; then
            err "track \"$TRACK_NAME\": deliverables.${KIND}[$j] is a plain string — must be an object with {type, format, description}"
          elif [ "$DELIV_TYPE" = "null" ] || [ -z "$DELIV_TYPE" ]; then
            err "track \"$TRACK_NAME\": deliverables.${KIND}[$j] missing required 'type' field"
          fi
        done
      fi
    done
  done
fi

# --- Rule 12: Each active timeline stage must have a description ---
for STAGE in "${STAGES[@]}"; do
  START=$(yq ".hackathon.timeline.${STAGE}.start" "$FILE")
  if [ "$START" != "null" ] && [ -n "$START" ]; then
    DESC=$(yq ".hackathon.timeline.${STAGE}.description" "$FILE")
    if [ "$DESC" = "null" ] || [ -z "$DESC" ]; then
      err "timeline.${STAGE}: description is required for active stages"
    fi
  fi
done

# --- Report results ---
if [ ${#ERRORS[@]} -eq 0 ]; then
  echo "✓ Validation passed: $FILE"
  exit 0
else
  echo "✗ Validation failed: $FILE (${#ERRORS[@]} errors)" >&2
  for e in "${ERRORS[@]}"; do
    echo "  - $e" >&2
  done
  exit 1
fi
