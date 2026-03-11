#!/usr/bin/env node
/**
 * Pre-build script: reads all YAML data (hackathons, profiles, submissions, results)
 * and writes a JSON cache file that can be imported without `fs` at runtime.
 *
 * This is necessary because Cloudflare Workers don't support Node.js `fs` module.
 * The generated data is used by static pages at build time and bundled into the worker.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_ROOT = path.resolve(__dirname, '../../..');
const OUT_FILE = path.resolve(__dirname, '../app/_generated/static-data.json');

async function readYaml(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  return yaml.load(content);
}

async function collectHackathons() {
  const hackathonsDir = path.join(DATA_ROOT, 'hackathons');
  const entries = await fs.readdir(hackathonsDir, { withFileTypes: true });
  const dirs = entries.filter(e => e.isDirectory());

  const results = [];
  for (const dir of dirs) {
    try {
      const data = await readYaml(path.join(hackathonsDir, dir.name, 'hackathon.yml'));
      // Normalize integer weights to decimal
      normaliseWeights(data);
      results.push(data);
    } catch {
      // Skip directories without valid hackathon.yml
    }
  }
  return results;
}

async function collectProfiles() {
  const profilesDir = path.join(DATA_ROOT, 'profiles');
  const entries = await fs.readdir(profilesDir);
  const ymlFiles = entries.filter(f => f.endsWith('.yml') && !f.startsWith('_'));

  const results = [];
  for (const file of ymlFiles) {
    try {
      const data = await readYaml(path.join(profilesDir, file));
      results.push(data);
    } catch {
      // Skip invalid profiles
    }
  }
  return results;
}

async function collectSubmissions() {
  const hackathonsDir = path.join(DATA_ROOT, 'hackathons');
  const hackathonEntries = await fs.readdir(hackathonsDir, { withFileTypes: true });
  const hackathonDirs = hackathonEntries.filter(e => e.isDirectory());

  const results = [];
  for (const hackathonDir of hackathonDirs) {
    const submissionsDir = path.join(hackathonsDir, hackathonDir.name, 'submissions');
    try {
      const teamEntries = await fs.readdir(submissionsDir, { withFileTypes: true });
      const teamDirs = teamEntries.filter(e => e.isDirectory());

      for (const teamDir of teamDirs) {
        try {
          const data = await readYaml(path.join(submissionsDir, teamDir.name, 'project.yml'));
          results.push({
            ...data,
            _hackathonSlug: hackathonDir.name,
            _teamSlug: teamDir.name,
          });
        } catch {
          // Skip invalid submissions
        }
      }
    } catch {
      // No submissions directory
    }
  }
  return results;
}

async function collectThemes() {
  const themesDir = path.join(DATA_ROOT, 'config', 'themes');

  // Read .active file
  let activeTheme = '';
  try {
    activeTheme = (await fs.readFile(path.join(themesDir, '.active'), 'utf-8')).trim();
  } catch {
    // No .active file
  }

  // Read all theme YAML files
  const entries = await fs.readdir(themesDir);
  const ymlFiles = entries.filter(f => f.endsWith('.yml'));
  const themes = [];
  for (const file of ymlFiles) {
    try {
      const data = await readYaml(path.join(themesDir, file));
      const id = file.replace(/\.yml$/, '');
      themes.push({ ...data, _id: id });
    } catch {
      // Skip invalid theme files
    }
  }

  // Read hackathon theme variants
  const hackathonsDir = path.join(DATA_ROOT, 'hackathons');
  const variants = {};
  try {
    const hackathonEntries = await fs.readdir(hackathonsDir, { withFileTypes: true });
    for (const entry of hackathonEntries.filter(e => e.isDirectory())) {
      const variantsDir = path.join(hackathonsDir, entry.name, 'themes');
      try {
        const variantFiles = await fs.readdir(variantsDir);
        for (const vf of variantFiles.filter(f => f.endsWith('.yml'))) {
          try {
            const data = await readYaml(path.join(variantsDir, vf));
            const themeName = vf.replace(/\.yml$/, '');
            const key = `${entry.name}/${themeName}`;
            variants[key] = data;
          } catch {
            // Skip invalid variant files
          }
        }
      } catch {
        // No themes directory for this hackathon
      }
    }
  } catch {
    // No hackathons directory
  }

  return { activeTheme, themes, variants };
}

async function collectResults() {
  const hackathonsDir = path.join(DATA_ROOT, 'hackathons');
  const hackathonEntries = await fs.readdir(hackathonsDir, { withFileTypes: true });
  const hackathonDirs = hackathonEntries.filter(e => e.isDirectory());

  const resultsByHackathon = {};
  for (const hackathonDir of hackathonDirs) {
    const resultsDir = path.join(hackathonsDir, hackathonDir.name, 'results');
    try {
      const entries = await fs.readdir(resultsDir);
      const jsonFiles = entries.filter(f => f.endsWith('.json'));
      const items = [];

      for (const file of jsonFiles) {
        try {
          const content = await fs.readFile(path.join(resultsDir, file), 'utf-8');
          const data = JSON.parse(content);
          items.push({
            ...data,
            _hackathonSlug: hackathonDir.name,
            _fileName: file.replace(/\.json$/, ''),
          });
        } catch {
          // Skip invalid result files
        }
      }

      if (items.length > 0) {
        resultsByHackathon[hackathonDir.name] = items;
      }
    } catch {
      // No results directory
    }
  }
  return resultsByHackathon;
}

function normaliseWeights(data) {
  const hackathon = data?.hackathon;
  if (!hackathon?.tracks) return;

  for (const track of hackathon.tracks) {
    const criteria = track?.judging?.criteria;
    if (!Array.isArray(criteria)) continue;

    const weights = criteria.map(c => Number(c.weight ?? 0));
    const sum = weights.reduce((a, b) => a + b, 0);
    if (sum > 1) {
      for (let i = 0; i < criteria.length; i++) {
        criteria[i].weight = weights[i] / sum;
      }
    }
  }
}

async function main() {
  console.log('[generate-static-data] Reading YAML data...');

  const [hackathons, profiles, submissions, results, themeData] = await Promise.all([
    collectHackathons(),
    collectProfiles(),
    collectSubmissions(),
    collectResults(),
    collectThemes(),
  ]);

  const data = { hackathons, profiles, submissions, results, themes: themeData };

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(data, null, 2));

  console.log(`[generate-static-data] Written to ${path.relative(process.cwd(), OUT_FILE)}`);
  console.log(`  hackathons: ${hackathons.length}`);
  console.log(`  profiles: ${profiles.length}`);
  console.log(`  submissions: ${submissions.length}`);
  console.log(`  results: ${Object.keys(results).length} hackathons with results`);
  console.log(`  themes: ${themeData.themes.length} (active: ${themeData.activeTheme || 'none'}, variants: ${Object.keys(themeData.variants).length})`);
}

main().catch(err => {
  console.error('[generate-static-data] Failed:', err);
  process.exit(1);
});
