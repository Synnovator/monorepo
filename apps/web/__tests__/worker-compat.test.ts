import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

/**
 * Cloudflare Workers don't support Node.js-only modules (fs, path, os, etc.).
 * Importing them in app/ code passes tsc and next build but crashes at runtime
 * with HTTP 500. This test catches those imports at CI time.
 *
 * Use pre-generated data from app/_generated/data.ts instead.
 * See apps/web/CLAUDE.md "注意事项" for details.
 */

const FORBIDDEN_IMPORTS = [
  'node:fs',
  'node:path',
  'node:os',
  'node:child_process',
  'node:cluster',
  'node:dgram',
  'node:dns',
  'node:http2',
  'node:inspector',
  'node:net',
  'node:readline',
  'node:repl',
  'node:tls',
  'node:vm',
  'node:worker_threads',
];

describe('worker compat', () => {
  const webRoot = path.resolve(__dirname, '..');

  FORBIDDEN_IMPORTS.forEach((mod) => {
    it(`no app/ code imports "${mod}"`, () => {
      try {
        const result = execSync(
          `grep -rn "from ['\\"']${mod}['\\"']" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.mjs" "${webRoot}/app" 2>/dev/null || true`,
          { encoding: 'utf-8' },
        ).trim();

        const files = result
          .split('\n')
          .filter(
            (f) =>
              f &&
              !f.includes('__tests__') &&
              !f.includes('node_modules') &&
              !f.includes('/_generated/') &&
              !f.includes('.test.') &&
              !f.includes('.spec.'),
          );

        expect(
          files,
          `Files importing "${mod}" will crash on Cloudflare Workers:\n${files.join('\n')}\n\nFix: use app/_generated/data.ts instead of reading files at runtime.`,
        ).toHaveLength(0);
      } catch {
        // grep returns exit 1 when no matches — that's success
      }
    });
  });

  // Also catch bare specifiers without the node: prefix
  const BARE_FORBIDDEN = ["'fs'", "'path'", "'os'", "'child_process'"];

  BARE_FORBIDDEN.forEach((mod) => {
    it(`no app/ code imports ${mod} (bare specifier)`, () => {
      try {
        const result = execSync(
          `grep -rn "from ${mod}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.mjs" "${webRoot}/app" 2>/dev/null || true`,
          { encoding: 'utf-8' },
        ).trim();

        const files = result
          .split('\n')
          .filter(
            (f) =>
              f &&
              !f.includes('__tests__') &&
              !f.includes('node_modules') &&
              !f.includes('/_generated/') &&
              !f.includes('.test.') &&
              !f.includes('.spec.'),
          );

        expect(
          files,
          `Files importing ${mod} will crash on Cloudflare Workers:\n${files.join('\n')}\n\nFix: use app/_generated/data.ts instead of reading files at runtime.`,
        ).toHaveLength(0);
      } catch {
        // grep returns exit 1 when no matches — that's success
      }
    });
  });
});
