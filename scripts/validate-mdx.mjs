#!/usr/bin/env node
import { compile } from '@mdx-js/mdx';
import remarkGfm from 'remark-gfm';
import fs from 'node:fs/promises';
import { execSync } from 'node:child_process';

const changedFiles = execSync('git diff --name-only origin/main...HEAD -- "*.mdx"', { encoding: 'utf-8' })
  .trim()
  .split('\n')
  .filter(Boolean);

if (changedFiles.length === 0) {
  console.log('No MDX files changed.');
  process.exit(0);
}

console.log(`Validating ${changedFiles.length} MDX file(s)...`);

let hasErrors = false;
for (const file of changedFiles) {
  try {
    const source = await fs.readFile(file, 'utf-8');
    await compile(source, {
      outputFormat: 'function-body',
      remarkPlugins: [remarkGfm],
    });
    console.log(`  OK ${file}`);
  } catch (err) {
    console.error(`  FAIL ${file}: ${err.message}`);
    hasErrors = true;
  }
}

if (hasErrors) {
  console.error('\nMDX validation failed.');
  process.exit(1);
}
console.log('\nAll MDX files valid.');
