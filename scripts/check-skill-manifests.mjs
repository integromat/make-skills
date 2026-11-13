#!/usr/bin/env node
// Drift guard for skills.json, the single source of truth for which skills exist and where they ship:
//   - publish: shipped through the plugins, release zips and `npx skills add`
//   - mcp: needs the Make MCP server, which also serves it over MCP
// Every skills/ folder must be listed, so a new skill fails CI instead of being silently left out.
// package.json agents.skills[] (read by the Open Agent Skills tooling) must match the published skills.

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

const manifest = readJson('skills.json');
const pkg = readJson('package.json');

const errors = [];
const sorted = (s) => [...s].sort();
const diff = (a, b) => sorted(a).filter((x) => !b.has(x));

const FLAGS = ['publish', 'mcp'];
const entries = Object.entries(manifest.skills ?? {});
if (!entries.length) errors.push('skills.json has no "skills" entries.');

// 1. every entry declares each flag as a boolean, and nothing else
for (const [name, entry] of entries) {
  const keys = Object.keys(entry ?? {});
  const unknown = keys.filter((k) => !FLAGS.includes(k));
  const invalid = FLAGS.filter((f) => typeof entry?.[f] !== 'boolean');
  if (unknown.length) errors.push(`skills.json "${name}" has unknown field(s): ${unknown.join(', ')}`);
  if (invalid.length) errors.push(`skills.json "${name}" must set ${invalid.join(', ')} to true or false`);
  // The MCP server serves only what is also published, so the two channels never disagree on a skill's content
  if (entry?.mcp === true && entry?.publish !== true) {
    errors.push(`skills.json "${name}" sets mcp without publish`);
  }
}

const listed = new Set(entries.map(([name]) => name));
const published = new Set(entries.filter(([, e]) => e?.publish === true).map(([name]) => name));
const mcp = entries.filter(([, e]) => e?.mcp === true);

// 2. every skills/ folder is listed, and every listed skill has a folder
const onDisk = new Set(
  readdirSync(join(ROOT, 'skills'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name),
);
const unlisted = diff(onDisk, listed);
if (unlisted.length) {
  errors.push(
    `Skill folder(s) present in skills/ but not in skills.json: ${unlisted.join(', ')}. ` +
      `Add each with "publish": true to ship it, or false to hold it back.`,
  );
}
const missingOnDisk = diff(listed, onDisk);
if (missingOnDisk.length) {
  errors.push(`skills.json lists skill(s) with no folder in skills/: ${missingOnDisk.join(', ')}`);
}

// 3. package.json agents.skills[] names must equal the published skills
const pkgSkills = new Set((pkg.agents?.skills ?? []).map((s) => s.name));
const pkgMissing = diff(published, pkgSkills);
const pkgExtra = diff(pkgSkills, published);
if (pkgMissing.length || pkgExtra.length) {
  errors.push(
    `package.json agents.skills is out of sync with the published skills in skills.json` +
      (pkgMissing.length ? ` — missing: ${pkgMissing.join(', ')}` : '') +
      (pkgExtra.length ? ` — unexpected: ${pkgExtra.join(', ')}` : ''),
  );
}

if (errors.length) {
  console.error('✗ Skill manifest drift detected:\n');
  for (const e of errors) console.error(`  - ${e}`);
  console.error('\nFix the lists above so they agree, then re-run.');
  process.exit(1);
}

console.log(
  `✓ Skill manifests in sync (${published.size} published, ${listed.size - published.size} held back, ${mcp.length} served over MCP).`,
);
