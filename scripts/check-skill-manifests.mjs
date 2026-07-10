#!/usr/bin/env node
// Drift guard: fails if the skill lists that must stay in sync disagree.
//
// skills.publish.json is the single source of truth for which skills ship.
// build.sh (zips + bundle) and actions-toolkit.config.mjs (release-please
// SKILL.md bump targets) both derive from it, so those can't drift. This guard
// covers the two lists that are still hand-maintained/independent:
//   - package.json agents.skills[] (consumed by the Open Agent Skills tooling)
//   - every skills/ folder must be consciously classified as published or
//     internal, so a newly added skill fails CI loudly instead of being
//     silently forgotten.

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

const publish = readJson('skills.publish.json');
const internal = readJson('skills.internal.json');
const pkg = readJson('package.json');

const errors = [];
const asSet = (arr) => new Set(arr);
const sorted = (s) => [...s].sort();
const diff = (a, b) => sorted(a).filter((x) => !b.has(x));

const publishSet = asSet(publish);
const internalSet = asSet(internal);

// 1. publish and internal must not overlap
const overlap = [...publishSet].filter((s) => internalSet.has(s));
if (overlap.length) {
  errors.push(`Skills listed in BOTH skills.publish.json and skills.internal.json: ${overlap.join(', ')}`);
}

// 2. every skills/ folder must be classified as published or internal
const onDisk = asSet(
  readdirSync(join(ROOT, 'skills'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name),
);
const classified = new Set([...publishSet, ...internalSet]);
const unclassified = diff(onDisk, classified);
if (unclassified.length) {
  errors.push(
    `Skill folder(s) present in skills/ but not classified: ${unclassified.join(', ')}. ` +
      `Add each to skills.publish.json (to ship it) or skills.internal.json (to hold it back).`,
  );
}
const missingOnDisk = [...classified].filter((s) => !onDisk.has(s));
if (missingOnDisk.length) {
  errors.push(`Listed skill(s) with no folder in skills/: ${missingOnDisk.join(', ')}`);
}

// 3. package.json agents.skills[] names must equal the publish list
const pkgSkills = asSet((pkg.agents?.skills ?? []).map((s) => s.name));
const pkgMissing = diff(publishSet, pkgSkills);
const pkgExtra = diff(pkgSkills, publishSet);
if (pkgMissing.length || pkgExtra.length) {
  errors.push(
    `package.json agents.skills is out of sync with skills.publish.json` +
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

console.log(`✓ Skill manifests in sync (${publish.length} published, ${internal.length} internal).`);
