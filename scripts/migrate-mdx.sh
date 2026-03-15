#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/migrate-mdx.sh
# One-time migration: generates missing MDX files from YAML description fields.
# Safe to run multiple times — skips files that already exist.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "[migrate-mdx] Scanning hackathons..."

for hackathon_dir in "$REPO_ROOT"/hackathons/*/; do
  [ -f "${hackathon_dir}hackathon.yml" ] || continue
  slug=$(basename "$hackathon_dir")
  echo "  Processing: $slug"

  # Extract all hackathon metadata in one node call
  hackathon_json=$(node -e "
    const yaml = require('js-yaml');
    const fs = require('fs');
    const data = yaml.load(fs.readFileSync('${hackathon_dir}hackathon.yml', 'utf-8'));
    const h = data.hackathon;
    console.log(JSON.stringify({
      name: h.name || '',
      name_zh: h.name_zh || h.name || '',
      desc: h.description || '',
      desc_zh: h.description_zh || '',
      tracks: (h.tracks || []).map(t => ({
        slug: t.slug, name: t.name, name_zh: t.name_zh || t.name,
        desc: t.description || '', desc_zh: t.description_zh || ''
      }))
    }));
  ")

  # --- Hackathon description MDX ---
  if [ ! -f "${hackathon_dir}description.mdx" ]; then
    echo "$hackathon_json" | node -e "
      const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8'));
      require('fs').writeFileSync('${hackathon_dir}description.mdx', '# ' + d.name + '\n\n' + d.desc + '\n');
    "
    echo "    Created: description.mdx"
  fi
  if [ ! -f "${hackathon_dir}description.zh.mdx" ]; then
    echo "$hackathon_json" | node -e "
      const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8'));
      require('fs').writeFileSync('${hackathon_dir}description.zh.mdx', '# ' + d.name_zh + '\n\n' + d.desc_zh + '\n');
    "
    echo "    Created: description.zh.mdx"
  fi

  # --- Track MDX ---
  mkdir -p "${hackathon_dir}tracks"
  echo "$hackathon_json" | node -e "
    const fs = require('fs');
    const path = require('path');
    const d = JSON.parse(fs.readFileSync('/dev/stdin','utf-8'));
    const dir = '${hackathon_dir}tracks';
    for (const t of d.tracks) {
      const enFile = path.join(dir, t.slug + '.mdx');
      if (!fs.existsSync(enFile)) {
        fs.writeFileSync(enFile, '# ' + t.name + '\n\n' + t.desc + '\n');
        console.log('    Created: tracks/' + t.slug + '.mdx');
      }
      const zhFile = path.join(dir, t.slug + '.zh.mdx');
      if (!fs.existsSync(zhFile)) {
        fs.writeFileSync(zhFile, '# ' + t.name_zh + '\n\n' + t.desc_zh + '\n');
        console.log('    Created: tracks/' + t.slug + '.zh.mdx');
      }
    }
  "

  # --- Submission README MDX (both en and zh) ---
  if [ -d "${hackathon_dir}submissions" ]; then
    for team_dir in "${hackathon_dir}"submissions/*/; do
      [ -d "$team_dir" ] || continue
      team_slug=$(basename "$team_dir")
      [ -f "${team_dir}project.yml" ] || continue

      sub_json=$(node -e "
        const yaml = require('js-yaml');
        const fs = require('fs');
        const data = yaml.load(fs.readFileSync('${team_dir}project.yml', 'utf-8'));
        const p = data.project;
        console.log(JSON.stringify({
          name: p.name || '', name_zh: p.name_zh || p.name || '',
          desc: p.description || '', desc_zh: p.description_zh || p.description || ''
        }));
      ")

      if [ ! -f "${team_dir}README.mdx" ]; then
        echo "$sub_json" | node -e "
          const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8'));
          require('fs').writeFileSync('${team_dir}README.mdx', '# ' + d.name + '\n\n' + d.desc + '\n');
        "
        echo "    Created: submissions/${team_slug}/README.mdx"
      fi
      if [ ! -f "${team_dir}README.zh.mdx" ]; then
        echo "$sub_json" | node -e "
          const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8'));
          require('fs').writeFileSync('${team_dir}README.zh.mdx', '# ' + d.name_zh + '\n\n' + d.desc_zh + '\n');
        "
        echo "    Created: submissions/${team_slug}/README.zh.mdx"
      fi
    done
  fi
done

echo "[migrate-mdx] Done."
