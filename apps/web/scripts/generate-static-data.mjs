#!/usr/bin/env node
/**
 * Pre-build script: reads all YAML data (hackathons, profiles, submissions, teams, results)
 * and writes a JSON cache file that can be imported without `fs` at runtime.
 *
 * This is necessary because Cloudflare Workers don't support Node.js `fs` module.
 * The generated data is used by static pages at build time and bundled into the worker.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { compile } from '@mdx-js/mdx';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_ROOT = path.resolve(__dirname, '../../..');
const OUT_FILE = path.resolve(__dirname, '../app/_generated/static-data.json');
const MDX_OUT_DIR = path.resolve(__dirname, '../app/_generated/static-mdx');

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

async function collectTeams() {
  const teamsDir = path.join(DATA_ROOT, 'teams');
  let entries;
  try {
    entries = await fs.readdir(teamsDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const dirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('_'));
  const results = [];
  for (const dir of dirs) {
    try {
      const data = await readYaml(path.join(teamsDir, dir.name, 'team.yml'));
      results.push({ ...data, _slug: dir.name });
    } catch {
      // Skip invalid team files
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

async function tryCompileMdx(filePath) {
  try {
    const source = await fs.readFile(filePath, 'utf-8');
    const compiled = await compile(source, {
      outputFormat: 'function-body',
      development: false,
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeHighlight],
    });
    return String(compiled);
  } catch {
    return null;
  }
}

async function collectMdx(dataRoot) {
  await fs.mkdir(MDX_OUT_DIR, { recursive: true });
  let count = 0;

  // --- Hackathon MDX ---
  const hackathonsDir = path.join(dataRoot, 'hackathons');
  try {
    const hackathonEntries = await fs.readdir(hackathonsDir, { withFileTypes: true });
    const hackathonDirs = hackathonEntries.filter(e => e.isDirectory());

    for (const dir of hackathonDirs) {
      const slug = dir.name;
      const hackathonPath = path.join(hackathonsDir, slug);
      const mdxData = {};

      // description.mdx / description.zh.mdx
      for (const variant of ['description.mdx', 'description.zh.mdx']) {
        const compiled = await tryCompileMdx(path.join(hackathonPath, variant));
        if (compiled) {
          const key = variant.replace('.mdx', '');
          mdxData[key] = compiled;
        }
      }

      // tracks/*.mdx
      const tracksDir = path.join(hackathonPath, 'tracks');
      try {
        const trackFiles = await fs.readdir(tracksDir);
        for (const tf of trackFiles.filter(f => f.endsWith('.mdx'))) {
          const compiled = await tryCompileMdx(path.join(tracksDir, tf));
          if (compiled) {
            const key = `tracks/${tf.replace('.mdx', '')}`;
            mdxData[key] = compiled;
          }
        }
      } catch {
        // No tracks directory
      }

      // stages/*.mdx
      const stagesDir = path.join(hackathonPath, 'stages');
      try {
        const stageFiles = await fs.readdir(stagesDir);
        for (const sf of stageFiles.filter(f => f.endsWith('.mdx'))) {
          const compiled = await tryCompileMdx(path.join(stagesDir, sf));
          if (compiled) {
            const key = `stages/${sf.replace('.mdx', '')}`;
            mdxData[key] = compiled;
          }
        }
      } catch {
        // No stages directory
      }

      if (Object.keys(mdxData).length > 0) {
        const outFile = path.join(MDX_OUT_DIR, `hackathon-${slug}.json`);
        await fs.writeFile(outFile, JSON.stringify(mdxData, null, 2));
        count++;
      }

      // --- Submission MDX within this hackathon ---
      const submissionsDir = path.join(hackathonPath, 'submissions');
      try {
        const teamEntries = await fs.readdir(submissionsDir, { withFileTypes: true });
        const teamDirs = teamEntries.filter(e => e.isDirectory());

        for (const teamDir of teamDirs) {
          const teamSlug = teamDir.name;
          const subMdxData = {};

          for (const variant of ['README.mdx', 'README.zh.mdx']) {
            const compiled = await tryCompileMdx(path.join(submissionsDir, teamSlug, variant));
            if (compiled) {
              const key = variant.replace('.mdx', '');
              subMdxData[key] = compiled;
            }
          }

          if (Object.keys(subMdxData).length > 0) {
            const outFile = path.join(MDX_OUT_DIR, `submission-${slug}-${teamSlug}.json`);
            await fs.writeFile(outFile, JSON.stringify(subMdxData, null, 2));
            count++;
          }
        }
      } catch {
        // No submissions directory
      }
    }
  } catch {
    // No hackathons directory
  }

  // --- Profile MDX ---
  const profilesDir = path.join(dataRoot, 'profiles');
  try {
    const profileEntries = await fs.readdir(profilesDir, { withFileTypes: true });
    const profileDirs = profileEntries.filter(e => e.isDirectory());

    for (const dir of profileDirs) {
      const filestem = dir.name;
      const profMdxData = {};

      for (const variant of ['bio.mdx', 'bio.zh.mdx']) {
        const compiled = await tryCompileMdx(path.join(profilesDir, filestem, variant));
        if (compiled) {
          const key = variant.replace('.mdx', '');
          profMdxData[key] = compiled;
        }
      }

      if (Object.keys(profMdxData).length > 0) {
        const outFile = path.join(MDX_OUT_DIR, `profile-${filestem}.json`);
        await fs.writeFile(outFile, JSON.stringify(profMdxData, null, 2));
        count++;
      }
    }
  } catch {
    // No profiles directory or no profile subdirectories
  }

  return count;
}

async function collectEditorMdx(dataRoot) {
  const result = {};
  const hackathonsDir = path.join(dataRoot, 'hackathons');

  let hackathonEntries;
  try {
    hackathonEntries = await fs.readdir(hackathonsDir, { withFileTypes: true });
  } catch {
    return result;
  }

  const hackathonDirs = hackathonEntries.filter(e => e.isDirectory());

  for (const dir of hackathonDirs) {
    const slug = dir.name;
    const hackathonPath = path.join(hackathonsDir, slug);

    // Hackathon description MDX (raw source)
    for (const suffix of ['', '.zh']) {
      const file = path.join(hackathonPath, `description${suffix}.mdx`);
      try {
        result[`hackathon:${slug}:description${suffix}`] =
          await fs.readFile(file, 'utf-8');
      } catch { /* file does not exist */ }
    }

    // Track MDX (raw source)
    const tracksDir = path.join(hackathonPath, 'tracks');
    try {
      const trackFiles = await fs.readdir(tracksDir);
      for (const tf of trackFiles.filter(f => f.endsWith('.mdx'))) {
        const key = tf.replace('.mdx', '');
        result[`track:${slug}:${key}`] =
          await fs.readFile(path.join(tracksDir, tf), 'utf-8');
      }
    } catch { /* no tracks directory */ }

    // Submission MDX (raw source)
    const submissionsDir = path.join(hackathonPath, 'submissions');
    try {
      const teamEntries = await fs.readdir(submissionsDir, { withFileTypes: true });
      const teamDirs = teamEntries.filter(e => e.isDirectory());

      for (const teamDir of teamDirs) {
        const teamSlug = teamDir.name;
        for (const variant of ['README.mdx', 'README.zh.mdx']) {
          const file = path.join(submissionsDir, teamSlug, variant);
          const suffix = variant === 'README.zh.mdx' ? '.zh' : '';
          try {
            result[`submission:${slug}:${teamSlug}${suffix}`] =
              await fs.readFile(file, 'utf-8');
          } catch { /* file does not exist */ }
        }
      }
    } catch { /* no submissions directory */ }
  }

  return result;
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

async function collectRoles() {
  const rolesFile = path.join(DATA_ROOT, 'config', 'roles.yml');
  try {
    const data = await readYaml(rolesFile);
    return {
      admin: Array.isArray(data?.admin) ? data.admin : [],
      designer: Array.isArray(data?.designer) ? data.designer : [],
    };
  } catch {
    console.warn('[generate-static-data] config/roles.yml not found, using empty roles');
    return { admin: [], designer: [] };
  }
}

async function main() {
  console.log('[generate-static-data] Reading YAML data...');

  const [hackathons, profiles, submissions, teams, results, themeData, mdxCount, editorMdx, roles] = await Promise.all([
    collectHackathons(),
    collectProfiles(),
    collectSubmissions(),
    collectTeams(),
    collectResults(),
    collectThemes(),
    collectMdx(DATA_ROOT),
    collectEditorMdx(DATA_ROOT),
    collectRoles(),
  ]);

  const data = { hackathons, profiles, submissions, teams, results, themes: themeData, roles };

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(data, null, 2));

  // Write raw MDX source for editor consumption
  const editorMdxFile = path.resolve(__dirname, '../app/_generated/editor-mdx.json');
  await fs.writeFile(editorMdxFile, JSON.stringify(editorMdx));

  console.log(`[generate-static-data] Written to ${path.relative(process.cwd(), OUT_FILE)}`);
  console.log(`  hackathons: ${hackathons.length}`);
  console.log(`  profiles: ${profiles.length}`);
  console.log(`  submissions: ${submissions.length}`);
  console.log(`  teams: ${teams.length}`);
  console.log(`  results: ${Object.keys(results).length} hackathons with results`);
  console.log(`  themes: ${themeData.themes.length} (active: ${themeData.activeTheme || 'none'}, variants: ${Object.keys(themeData.variants).length})`);
  console.log(`  mdx files: ${mdxCount}`);
  console.log(`  editor mdx entries: ${Object.keys(editorMdx).length}`);
  console.log(`  roles: ${roles.admin.length} admin, ${roles.designer.length} designer`);
}

main().catch(err => {
  console.error('[generate-static-data] Failed:', err);
  process.exit(1);
});
