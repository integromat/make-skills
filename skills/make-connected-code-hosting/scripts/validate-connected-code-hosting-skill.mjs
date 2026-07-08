#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const skillRoot = path.resolve(new URL('..', import.meta.url).pathname);
const repoRoot = path.resolve(skillRoot, '../..');
const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
};
const exists = (relativePath) => fs.existsSync(path.join(skillRoot, relativePath));
const read = (relativePath) => fs.readFileSync(path.join(skillRoot, relativePath), 'utf8');
const readRepo = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
const requiredFiles = [
  'SKILL.md',
  'connected-code-contract.md',
  'connection-patterns.md',
  'trigger-and-blueprint-patterns.md',
  'verification-and-live-tests.md',
  'examples/http-api-key-fetch.js',
  'examples/http-post-json.js',
  'examples/postgres-query.js',
  'examples/supabase-rest.js',
  'examples/webhook-normalize.js',
  'examples/blueprints/on-demand-connected-code.json',
  'examples/blueprints/scheduled-postgres-smoke.json',
  'examples/blueprints/webhook-normalize.json',
];

for (const file of requiredFiles) {
  if (!exists(file)) fail(`missing required file ${file}`);
}

if (exists('SKILL.md')) {
  const skill = read('SKILL.md');
  if (!skill.startsWith('---\n')) fail('SKILL.md must start with YAML frontmatter');
  const close = skill.indexOf('\n---\n', 4);
  if (close < 0) fail('SKILL.md must close YAML frontmatter');
  const frontmatter = close >= 0 ? skill.slice(4, close) : '';
  if (!frontmatter.includes('name: make-connected-code-hosting')) fail('frontmatter must name make-connected-code-hosting');
  if (!frontmatter.includes('repository: https://github.com/integromat/make-skills')) fail('frontmatter must point at integromat/make-skills');
  if (!skill.includes('## Quick routing')) fail('SKILL.md must contain Quick routing');
  for (const file of requiredFiles.filter((f) => f !== 'SKILL.md')) {
    if (!skill.includes(file)) fail(`SKILL.md must reference ${file}`);
  }
  const requiredPhrases = [
    'Default to Connected Code',
    'connected-code:ExecuteConnectedCode',
    'Blueprint generated. Please create or select the required Make connection in the scenario editor, then reply when it is ready.',
    'No credential-request flow',
    'No E2B flow',
    'No API-shell flow',
  ];
  for (const phrase of requiredPhrases) {
    if (!skill.includes(phrase)) fail(`SKILL.md must include ${JSON.stringify(phrase)}`);
  }
}

const scannedFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') fail('skill folder must not contain .DS_Store');
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(abs);
    else if (/\.(md|js|json|mjs)$/i.test(entry.name)) scannedFiles.push(abs);
  }
}
walk(skillRoot);

const banned = [
  ['Cer', 'ebras'],
  ['Gr', 'oq'],
  ['Hub', 'Spot'],
  ['Sales', 'force'],
  ['Sl', 'ack'],
  ['Gm', 'ail'],
  ['Goo', 'gle'],
  ['Base', 'row'],
  ['Air', 'table'],
  ['Not', 'ion'],
  ['Ji', 'ra'],
  ['Zen', 'desk'],
  ['Shop', 'ify'],
  ['Str', 'ipe'],
  ['Open', 'AI'],
  ['Anth', 'ropic'],
  ['LLM ', 'provider'],
  ['Sa', 'aS'],
  ['Em', 'ail'],
  ['My', 'SQL'],
].map((parts) => parts.join(''));
for (const abs of scannedFiles) {
  const rel = path.relative(skillRoot, abs);
  if (rel.startsWith('scripts/')) continue;
  const text = fs.readFileSync(abs, 'utf8');
  for (const name of banned) {
    const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(text)) fail(`${rel} mentions banned service/category ${name}`);
  }
}

for (const rel of [
  'examples/blueprints/on-demand-connected-code.json',
  'examples/blueprints/scheduled-postgres-smoke.json',
  'examples/blueprints/webhook-normalize.json',
]) {
  if (!exists(rel)) continue;
  try {
    JSON.parse(read(rel));
  } catch (error) {
    fail(`${rel} is invalid JSON: ${error.message}`);
  }
}

const packageJson = JSON.parse(readRepo('package.json'));
const agentSkillNames = packageJson.agents?.skills?.map((entry) => entry.name) ?? [];
if (!agentSkillNames.includes('make-connected-code-hosting')) fail('package.json agents.skills must include make-connected-code-hosting');
const build = readRepo('build.sh');
if (!build.includes('"make-connected-code-hosting"')) fail('build.sh must include make-connected-code-hosting');
const readme = readRepo('README.md');
if (!readme.includes('make-connected-code-hosting.zip')) fail('README.md must link make-connected-code-hosting.zip');

if (!process.exitCode) console.log('CONNECTED_CODE_HOSTING_SKILL_VALIDATION_OK');
