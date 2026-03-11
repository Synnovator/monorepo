#!/usr/bin/env node
/**
 * Static check: scan app/ source files for Node.js-only imports that will
 * crash on Cloudflare Workers at runtime (e.g. node:fs, node:path).
 *
 * Runs as part of prebuild so `pnpm build` fails early instead of producing
 * a worker bundle that 500s in production.
 *
 * Allowed exclusions:
 *   - scripts/           (build-time only, never bundled into the worker)
 *   - _generated/        (auto-generated, imports JSON not fs)
 *   - *.test.*  *.spec.* (test files run in Node, not Workers)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, '../app');

// Node.js built-in modules that don't exist in Cloudflare Workers
const FORBIDDEN_MODULES = [
  'node:fs', 'node:path', 'node:os', 'node:child_process',
  'node:cluster', 'node:dgram', 'node:dns', 'node:http2',
  'node:inspector', 'node:net', 'node:readline', 'node:repl',
  'node:tls', 'node:vm', 'node:worker_threads',
  // Bare specifiers (without node: prefix)
  "'fs'", "'path'", "'os'", "'child_process'",
  '"fs"', '"path"', '"os"', '"child_process"',
];

// Regex that matches import/require of forbidden modules
const IMPORT_RE = new RegExp(
  `(?:import|require)\\s*(?:\\(|\\s).*(?:${FORBIDDEN_MODULES.map(m => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
);

// Files/directories to skip
function shouldSkip(relPath) {
  return (
    relPath.includes('/scripts/') ||
    relPath.includes('/_generated/') ||
    relPath.includes('.test.') ||
    relPath.includes('.spec.') ||
    relPath.includes('node_modules')
  );
}

async function scanDir(dir) {
  const violations = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(APP_DIR, full);

    if (entry.isDirectory()) {
      if (!shouldSkip(rel + '/')) {
        violations.push(...await scanDir(full));
      }
      continue;
    }

    if (!/\.(ts|tsx|js|mjs)$/.test(entry.name)) continue;
    if (shouldSkip(rel)) continue;

    const content = await fs.readFile(full, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (IMPORT_RE.test(line)) {
        violations.push({ file: `app/${rel}`, line: i + 1, text: line.trim() });
      }
    }
  }

  return violations;
}

async function main() {
  const violations = await scanDir(APP_DIR);

  if (violations.length === 0) {
    console.log('[check-worker-compat] ✓ No forbidden Node.js imports found in app/');
    return;
  }

  console.error('[check-worker-compat] ✗ Found Node.js-only imports that will crash on Cloudflare Workers:\n');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    ${v.text}\n`);
  }
  console.error(
    'Fix: Use pre-generated data from app/_generated/data.ts instead of reading files at runtime.\n' +
    'See apps/web/CLAUDE.md "注意事项" for details.\n'
  );
  process.exit(1);
}

main().catch(err => {
  console.error('[check-worker-compat] Failed:', err);
  process.exit(1);
});
