#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/create-profile.sh <github-username>
# Example: ./scripts/create-profile.sh alice-dev

USERNAME="${1:?Usage: create-profile.sh <github-username>}"

# Generate short UUID suffix
UUID=$(head -c 4 /dev/urandom | xxd -p)
FILE="profiles/${USERNAME}-${UUID}.yml"

if ls profiles/${USERNAME}-*.yml 1>/dev/null 2>&1; then
  echo "ERROR: Profile already exists for ${USERNAME}" >&2
  ls profiles/${USERNAME}-*.yml
  exit 1
fi

cat > "$FILE" << YAML
synnovator_profile: "2.0"

hacker:
  github: "${USERNAME}"
  name: ""
  avatar: "https://github.com/${USERNAME}.png"
  bio: ""
  location: ""
  languages: ["zh", "en"]

  skills:
    - category: ""
      items: []

  interests: []

  looking_for:
    roles: []
    team_size: "3-5"
    collaboration_style: "async-friendly"
YAML

echo "Created profile: $FILE"
echo "Next: edit $FILE to fill in details, then commit and create PR"
