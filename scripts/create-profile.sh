#!/usr/bin/env bash
# create-profile.sh — Create a hacker profile YAML
# Usage: ./scripts/create-profile.sh <github-username>
# Example: ./scripts/create-profile.sh alice-dev

set -euo pipefail

USERNAME="${1:-}"
if [ -z "$USERNAME" ]; then
  echo "Usage: $0 <github-username>"
  echo "Example: $0 alice-dev"
  exit 1
fi

# Generate short UUID (first 8 chars)
UUID=$(uuidgen | tr '[:upper:]' '[:lower:]' | cut -c1-8)
FILENAME="profiles/${USERNAME}-${UUID}.yml"

if ls profiles/"${USERNAME}"-*.yml 1>/dev/null 2>&1; then
  echo "Warning: profile for $USERNAME already exists:"
  ls profiles/"${USERNAME}"-*.yml
  echo "Continuing will create a duplicate."
  read -rp "Continue? [y/N] " confirm
  [ "$confirm" != "y" ] && exit 0
fi

cat > "$FILENAME" << YAML
synnovator_profile: "2.0"

hacker:
  github: "$USERNAME"
  name: ""
  name_zh: ""
  avatar: "https://github.com/${USERNAME}.png"

  bio: ""
  bio_zh: ""

  location: ""
  languages: ["en"]

  identity:
    type: ""                         # student | professional | academic
    affiliation: ""

  skills:
    - category: ""
      items: []

  interests: []

  looking_for:
    roles: []
    team_size: ""
    collaboration_style: ""

  experience:
    years: 0
    hackathons: []
    projects: []

  links:
    twitter: ""
    linkedin: ""
    website: ""
YAML

echo "Created $FILENAME"
echo "Next: edit the file, then submit a PR."
