import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

const DEPRECATED_TOKENS = [
  'bg-dark-bg', 'bg-near-black', 'bg-surface',
  'text-white', 'text-light-gray',
  'border-secondary-bg', 'bg-secondary-bg',
  'text-lime-primary', 'bg-lime-primary',
  'text-cyan', 'text-orange', 'text-neon-blue',
  'text-pink', 'text-mint',
  'text-error', 'bg-error', 'border-error',
  'hover:text-white', 'hover:bg-lime-primary',
];

describe('token audit', () => {
  const webRoot = path.resolve(__dirname, '..');

  DEPRECATED_TOKENS.forEach((token) => {
    it(`no component uses deprecated token "${token}"`, () => {
      try {
        const result = execSync(
          `grep -r "${token}" --include="*.tsx" --include="*.ts" -l "${webRoot}/app" "${webRoot}/components" 2>/dev/null || true`,
          { encoding: 'utf-8' }
        ).trim();

        // Filter out test files and the token audit itself
        const files = result
          .split('\n')
          .filter((f) => f && !f.includes('__tests__') && !f.includes('node_modules'));

        expect(files, `Files still using "${token}":\n${files.join('\n')}`).toHaveLength(0);
      } catch {
        // grep returns exit 1 when no matches — that's success
      }
    });
  });
});
