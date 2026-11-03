#!/usr/bin/env node
// Content guard: fails if a skill outgrows the budget the repo's "less is more"
// rule sets, or ships links, frontmatter or text that would break or leak once
// installed. Runs on the source of truth (plugins/make-skills-codex/skills);
// sync-plugins.mjs --check already guarantees every copy matches it.
//
// Errors block the PR. Warnings are reported (as PR annotations on GitHub) but
// pass, for things that are sometimes deliberate — a pinned package version in an
// install command, say. Raise a limit here, in review, rather than working
// around it in a skill.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS = join(ROOT, 'plugins/make-skills-codex/skills');

const LIMITS = {
  skillMdChars: 10_000, // SKILL.md, frontmatter included — it is loaded whole on every trigger
  skillMdWords: 1_200,
  descriptionChars: 1_024, // Agent Skills spec maximum
  referenceWords: 2_000, // any other .md file — loaded one at a time
  skillWords: 10_000, // every text file of one skill together
  skillFiles: 40,
};

const TEXT = /\.(md|json|imljson|jsonc|js|mjs|ts|ya?ml|txt)$/;
// Forbidden anywhere: credentials and hosts that only exist inside Make.
const FORBIDDEN = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
  [/\b(ghp|gho|github_pat)_[A-Za-z0-9_]{20,}/, 'GitHub token'],
  [/\bxox[abpr]-[A-Za-z0-9-]{10,}/, 'Slack token'],
  [/\bsk-(ant-)?[A-Za-z0-9_-]{20,}/, 'API secret key'],
  [/\b[\w.-]*\.(hqrelease\.net|integromat\.(cloud|local))\b|\bwe\.make\.com\b/, 'internal Make host'],
];
// Allowed but worth a reviewer's look.
const SUSPICIOUS = [
  [/@[a-z0-9-]+\/[a-z0-9.-]+@\d+\.\d+\.\d+/, 'pinned package version — goes stale on the next release'],
  [/\bunpkg\.com\//, 'unpkg link to a pinned build'],
];

const errors = [];
const warnings = [];
const report = (list, file, line, msg) => list.push({ file: relative(ROOT, file), line, msg });

const walk = (dir) =>
  readdirSync(dir)
    .filter((n) => n !== '.DS_Store')
    .flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
const words = (s) => s.split(/\s+/).filter(Boolean).length;
const frontmatter = (s) => {
  const m = s.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return null;
  const field = (k) => m[1].match(new RegExp(`^${k}:\\s*(.*)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '');
  return { raw: m[1], name: field('name'), description: field('description') };
};

const skills = readdirSync(SKILLS).filter((n) => statSync(join(SKILLS, n)).isDirectory());

for (const skill of skills) {
  const dir = join(SKILLS, skill);
  const skillMd = join(dir, 'SKILL.md');
  if (!existsSync(skillMd)) {
    report(errors, dir, 0, 'no SKILL.md');
    continue;
  }
  const files = walk(dir);
  const texts = files.filter((f) => TEXT.test(f));

  // 1. size budget
  const md = readFileSync(skillMd, 'utf8');
  if (md.length > LIMITS.skillMdChars)
    report(errors, skillMd, 1, `SKILL.md is ${md.length} chars (limit ${LIMITS.skillMdChars}); move detail into references/`);
  if (words(md) > LIMITS.skillMdWords)
    report(errors, skillMd, 1, `SKILL.md is ${words(md)} words (limit ${LIMITS.skillMdWords}); move detail into references/`);
  for (const f of texts.filter((f) => f.endsWith('.md') && f !== skillMd)) {
    const n = words(readFileSync(f, 'utf8'));
    if (n > LIMITS.referenceWords) report(errors, f, 1, `${n} words (limit ${LIMITS.referenceWords} per reference); split or cut it`);
  }
  const total = texts.reduce((n, f) => n + words(readFileSync(f, 'utf8')), 0);
  if (total > LIMITS.skillWords) report(errors, skillMd, 1, `skill totals ${total} words across its files (limit ${LIMITS.skillWords})`);
  if (files.length > LIMITS.skillFiles) report(errors, skillMd, 1, `skill has ${files.length} files (limit ${LIMITS.skillFiles})`);

  // 2. frontmatter
  const fm = frontmatter(md);
  if (!fm) report(errors, skillMd, 1, 'missing YAML frontmatter');
  else {
    if (fm.name !== skill) report(errors, skillMd, 2, `frontmatter name "${fm.name}" does not match folder "${skill}"`);
    if (!fm.description) report(errors, skillMd, 3, 'frontmatter has no description');
    else if (fm.description.length > LIMITS.descriptionChars)
      report(errors, skillMd, 3, `description is ${fm.description.length} chars (limit ${LIMITS.descriptionChars})`);
    if (!/version:.*# x-release-please-version/.test(fm.raw))
      report(errors, skillMd, 1, 'metadata.version lacks the "# x-release-please-version" annotation');
  }

  // 3. relative links resolve, and every reference is reachable from SKILL.md
  const linked = new Set();
  for (const f of texts.filter((f) => f.endsWith('.md'))) {
    readFileSync(f, 'utf8').split('\n').forEach((text, i) => {
      for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
        if (/^(https?:|mailto:|#)/.test(target)) continue;
        const path = resolve(dirname(f), decodeURI(target.split('#')[0]));
        if (!existsSync(path)) report(errors, f, i + 1, `broken link: ${target}`);
        else if (f === skillMd) linked.add(path);
      }
    });
  }
  const refs = join(dir, 'references');
  if (existsSync(refs))
    for (const f of walk(refs).filter((f) => !linked.has(f)))
      report(errors, f, 1, 'reference is not linked from SKILL.md, so an agent never loads it');

  // 4. forbidden and suspicious text
  for (const f of texts) {
    readFileSync(f, 'utf8').split('\n').forEach((text, i) => {
      for (const [re, what] of FORBIDDEN) if (re.test(text)) report(errors, f, i + 1, what);
      for (const [re, what] of SUSPICIOUS) if (re.test(text)) report(warnings, f, i + 1, what);
    });
  }
}

const gh = process.env.GITHUB_ACTIONS === 'true';
for (const [level, list] of [['warning', warnings], ['error', errors]])
  for (const { file, line, msg } of list)
    console.log(gh ? `::${level} file=${file},line=${line}::${msg}` : `${level === 'error' ? '✗' : '!'} ${file}:${line} ${msg}`);

if (errors.length) {
  console.error(`\n✗ ${errors.length} skill content error(s). Limits live in scripts/check-skill-content.mjs.`);
  process.exit(1);
}
console.log(`✓ Skill content OK (${skills.length} skills, ${warnings.length} warning(s)).`);
