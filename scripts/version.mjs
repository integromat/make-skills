#!/usr/bin/env node
// Writes the package.json version into every file that publishes one, so all channels
// (plugin marketplaces, ClawHub, the MCP Registry) ship the same release.
// Runs as the npm `version` lifecycle hook; `--check` exits 1 on drift instead of writing.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const check = process.argv.includes('--check');
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

// Regex edits keep each file's own formatting; `count` limits how many "version" keys are
// touched, so a lockfile's dependency versions stay as they are.
const JSON_VERSION = /("version"\s*:\s*")[^"]*(")/g;
const targets = [
  ['package-lock.json', JSON_VERSION, 2],
  ['server.json', JSON_VERSION, 1],
  ['.claude-plugin/marketplace.json', JSON_VERSION, Infinity],
  ['plugins/make-skills-claude/.claude-plugin/plugin.json', JSON_VERSION, 1],
  ['plugins/make-skills-codex/.codex-plugin/plugin.json', JSON_VERSION, 1],
  ['plugins/make-skills-cursor/.cursor-plugin/plugin.json', JSON_VERSION, 1],
  ['plugins/make-skills-grok/.grok-plugin/plugin.json', JSON_VERSION, 1],
  ['plugins/make-skills-copilot/plugin.json', JSON_VERSION, 1],
  ['plugins/make-skills-openclaw/package.json', JSON_VERSION, 1],
  ['plugins/make-skills-openclaw/openclaw.plugin.json', JSON_VERSION, 1],
];

let drift = false;
for (const [file, pattern, count] of targets) {
  const path = join(root, file);
  const before = readFileSync(path, 'utf8');
  let seen = 0;
  const after = before.replace(pattern, (match, head, tail) => (++seen <= count ? `${head}${version}${tail}` : match));
  if (!seen) {
    console.error(`✗ ${file} has no version field`);
    drift = true;
  } else if (after !== before) {
    if (check) {
      console.error(`✗ ${file} is not at ${version} — run npm run version:sync`);
      drift = true;
    } else writeFileSync(path, after);
  }
}
if (drift) process.exit(1);
console.log(check ? `✓ every version is ${version}` : `✓ set every version to ${version}`);
