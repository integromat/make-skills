#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(skillRoot, '../..');
const helperRoot = path.join(skillRoot, 'references', 'connected-code-helpers');
const failures = [];

function fail(message) {
  failures.push(message);
}

function exists(relativePath) {
  return fs.existsSync(path.join(skillRoot, relativePath));
}

function read(relativePath) {
  return fs.readFileSync(path.join(skillRoot, relativePath), 'utf8');
}

function readRepo(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function walk(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') fail(`${path.relative(skillRoot, path.join(root, entry.name))} must not exist`);
    const absolutePath = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...walk(absolutePath));
    else files.push(absolutePath);
  }
  return files;
}

const requiredFiles = [
  'SKILL.md',
  'execution-surface-routing.md',
  'connected-code-contract.md',
  'connection-examples-index.md',
  'connection-patterns.md',
  'trigger-and-blueprint-patterns.md',
  'verification-and-live-tests.md',
  'scripts/sync-connected-code-helpers.mjs',
  'references/connected-code-helpers/SOURCE.json',
  'references/connected-code-helpers/README.md',
  'references/connected-code-helpers/docs/connection-reference.md',
  'examples/http-api-key-fetch.js',
  'examples/http-post-json.js',
  'examples/postgres-query.js',
  'examples/supabase-rest.js',
  'examples/webhook-normalize.js',
  'examples/blueprints/on-demand-connected-code.json',
  'examples/blueprints/scheduled-postgres-smoke.json',
  'examples/blueprints/webhook-normalize.json',
];

for (const relativePath of requiredFiles) {
  if (!exists(relativePath)) fail(`missing required file ${relativePath}`);
}

const skill = exists('SKILL.md') ? read('SKILL.md') : '';
if (!skill.startsWith('---\n')) fail('SKILL.md must start with YAML frontmatter');
const frontmatterEnd = skill.indexOf('\n---\n', 4);
if (frontmatterEnd < 0) fail('SKILL.md must close YAML frontmatter');
const frontmatter = frontmatterEnd >= 0 ? skill.slice(4, frontmatterEnd) : '';
for (const phrase of [
  'name: make-connected-code-hosting',
  'description: This skill should be used',
  'repository: https://github.com/integromat/make-skills',
]) {
  if (!frontmatter.includes(phrase)) fail(`frontmatter must include ${JSON.stringify(phrase)}`);
}
for (const phrase of [
  'Connected Code is the preferred execution surface, not an assumption',
  'connected-code:ExecuteConnectedCode',
  'make-api-shell-connection-workflow',
  'Broker is not configured for this connection',
  '__IMTCONN__',
  'use the normal Make Code module (`code:ExecuteCode`) for custom code',
  'This repository does not document or provision an E2B workaround',
  'do not continue into Connected Code-only steps 3–7',
  'a Make Code route uses the verified `code:ExecuteCode` module/version',
  'Blueprint generated. Please create or select the required Make connection in the scenario editor, then reply when it is ready.',
]) {
  if (!skill.includes(phrase)) fail(`SKILL.md must include ${JSON.stringify(phrase)}`);
}
for (const relativePath of [
  'execution-surface-routing.md',
  'connected-code-contract.md',
  'connection-examples-index.md',
  'connection-patterns.md',
  'trigger-and-blueprint-patterns.md',
  'verification-and-live-tests.md',
  'references/connected-code-helpers/docs/connection-reference.md',
  'examples/http-api-key-fetch.js',
  'examples/http-post-json.js',
  'examples/postgres-query.js',
  'examples/supabase-rest.js',
  'examples/webhook-normalize.js',
  'examples/blueprints/on-demand-connected-code.json',
  'examples/blueprints/scheduled-postgres-smoke.json',
  'examples/blueprints/webhook-normalize.json',
]) {
  if (!skill.includes(relativePath)) fail(`SKILL.md must link ${relativePath}`);
}
if (skill.includes('No API-shell flow')) fail('SKILL.md still forbids the required API-shell fallback');

const routing = exists('execution-surface-routing.md') ? read('execution-surface-routing.md') : '';
for (const phrase of [
  'route: connected-code',
  'route: make-api-shell',
  'make-api-shell-connection-workflow',
  'data: {{3.body}}',
  '`make-e2b-code-execution` is deprecated and removed',
  'route: make-code',
  'Do not provide E2B setup, credential, runner, or workaround instructions here',
]) {
  if (!routing.includes(phrase)) fail(`execution-surface-routing.md must include ${JSON.stringify(phrase)}`);
}

const contract = exists('connected-code-contract.md') ? read('connected-code-contract.md') : '';
if (!contract.includes('Current Connected Code 1.2.2 uses one account binder')) fail('contract must document the 1.2.2 one-binder model');
const supabaseExample = exists('examples/supabase-rest.js') ? read('examples/supabase-rest.js') : '';
if (!supabaseExample.includes("throw new Error('Invalid Supabase table name')")) {
  fail('Supabase example must reject unsafe table path input');
}
const syncScript = exists('scripts/sync-connected-code-helpers.mjs') ? read('scripts/sync-connected-code-helpers.mjs') : '';
if (!syncScript.includes("replace(/^ssh:\\\/\\\/git@github\\.com\\\//, 'https://github.com/')")) {
  fail('helper sync must canonicalize ssh:// GitHub origins');
}

const manifestPath = path.join(helperRoot, 'SOURCE.json');
let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch (error) {
  fail(`invalid helper SOURCE.json: ${error.message}`);
}

if (manifest) {
  if (manifest.sourceRepository !== 'https://github.com/MAKESEB/connected-code-helpers') {
    fail('helper source repository must be MAKESEB/connected-code-helpers');
  }
  if (!/^[0-9a-f]{40}$/.test(manifest.sourceCommit || '')) fail('helper source commit must be a full git SHA');
  if (manifest.sourceFileCount !== manifest.files?.length) fail('helper sourceFileCount must match manifest files');
  if ((manifest.files?.length || 0) < 17) fail('helper corpus must contain at least the current 17 tracked source files');

  const expected = new Map((manifest.files || []).map((entry) => [entry.path, entry.sha256]));
  const actual = walk(helperRoot)
    .map((absolutePath) => path.relative(helperRoot, absolutePath))
    .filter((relativePath) => relativePath !== 'SOURCE.json')
    .sort();
  const expectedPaths = [...expected.keys()].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expectedPaths)) fail('vendored helper file list does not match SOURCE.json');

  for (const relativePath of expectedPaths) {
    const absolutePath = path.join(helperRoot, relativePath);
    const digest = crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex');
    if (digest !== expected.get(relativePath)) fail(`helper hash mismatch for ${relativePath}`);
  }
}

const connectionReferencePath = path.join(helperRoot, 'docs', 'connection-reference.md');
const connectionReference = fs.existsSync(connectionReferencePath) ? fs.readFileSync(connectionReferencePath, 'utf8') : '';
if ((connectionReference.match(/^```/gm) || []).length % 2 !== 0) fail('connection reference has unbalanced code fences');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const referenceJavaScript = [...connectionReference.matchAll(/```js\n([\s\S]*?)```/g)].map((match) => match[1]);
if (referenceJavaScript.length < 8) fail('connection reference must contain its complete JavaScript example set');
for (const [index, code] of referenceJavaScript.entries()) {
  if (/\binput\.(?:apiKey|token|password|secret|connectionString|host|hostname|baseUrl)\b/i.test(code)) {
    fail(`connection reference JavaScript example ${index + 1} maps connection or scope data through input`);
  }
  if (/console\.(?:log|info|warn|error)\s*\([^)]*\bconnection\b/.test(code)) {
    fail(`connection reference JavaScript example ${index + 1} logs the connection capability`);
  }
  try {
    new AsyncFunction('input', 'connection', code);
  } catch (error) {
    fail(`connection reference JavaScript example ${index + 1} is invalid: ${error.message}`);
  }
}
const catalogSection = connectionReference.split('## App catalog\n', 2)[1] || '';
const catalogRows = catalogSection
  .split('\n')
  .filter((line) => line.startsWith('| ') && !line.startsWith('| App ') && !line.startsWith('| ---'));
if (catalogRows.length !== 159) fail(`connection reference must contain 159 app rows, found ${catalogRows.length}`);
for (const phrase of [
  'Connected Code 1.2.2 catalog shape: 159 apps',
  '| google-email | Gmail | account:google-email |',
  '| sage-accounting | Sage Business Cloud Accounting | account:sage-accounting |',
  '| sage-intacct | Sage Intacct | account:sage-intacct2 |',
  'Broker is not configured for this connection',
  "connection.fetch('/messages'",
  "connection.fetch('/businesses'",
  "connection.fetch('/services/core/query'",
]) {
  if (!connectionReference.includes(phrase)) fail(`connection reference must include ${JSON.stringify(phrase)}`);
}
if (/\| google-email \| Gmail \| account:google-restricted \|/.test(connectionReference)) {
  fail('Gmail catalog row uses the stale google-restricted account binding');
}

const helperExamplesRoot = path.join(helperRoot, 'examples');
const helperExamples = fs.existsSync(helperExamplesRoot)
  ? walk(helperExamplesRoot).filter((absolutePath) => absolutePath.endsWith('.js'))
  : [];
if (helperExamples.length < 15) fail('all 15 connected-code-helpers examples must be vendored');
const exampleIndex = exists('connection-examples-index.md') ? read('connection-examples-index.md') : '';
for (const absolutePath of helperExamples) {
  const relativePath = path.relative(helperRoot, absolutePath).split(path.sep).join('/');
  if (!exampleIndex.includes(`references/connected-code-helpers/${relativePath}`)) {
    fail(`connection-examples-index.md must link ${relativePath}`);
  }
}
function validateSnippet(absolutePath) {
  const relativePath = path.relative(skillRoot, absolutePath);
  const code = fs.readFileSync(absolutePath, 'utf8');
  if (/\b(?:async\s+)?function\s+main\s*\(/.test(code)) {
    fail(`${relativePath} defines main() instead of returning from the Connected Code top-level wrapper`);
  }
  if (/\binput\.(?:apiKey|token|password|secret|connectionString|host|hostname|baseUrl)\b/i.test(code)) {
    fail(`${relativePath} maps connection or scope data through input`);
  }
  if (/console\.(?:log|info|warn|error)\s*\([^)]*\bconnection\b/.test(code)) {
    fail(`${relativePath} logs the connection capability`);
  }
  try {
    new AsyncFunction('input', 'connection', code);
  } catch (error) {
    fail(`${relativePath} is invalid in the Connected Code async wrapper: ${error.message}`);
  }
}
for (const absolutePath of helperExamples) validateSnippet(absolutePath);

const allFiles = walk(skillRoot);
const primaryExamples = allFiles.filter((absolutePath) =>
  absolutePath.startsWith(path.join(skillRoot, 'examples') + path.sep) && absolutePath.endsWith('.js'),
);
if (primaryExamples.length < 5) fail('the five primary Connected Code examples must exist');
for (const absolutePath of primaryExamples) validateSnippet(absolutePath);
for (const absolutePath of allFiles.filter((file) => file.endsWith('.json'))) {
  try {
    JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    fail(`${path.relative(skillRoot, absolutePath)} is invalid JSON: ${error.message}`);
  }
}
for (const absolutePath of allFiles.filter((file) => file.endsWith('.md'))) {
  const text = fs.readFileSync(absolutePath, 'utf8');
  const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g;
  for (const match of text.matchAll(linkPattern)) {
    const target = match[1].split('#')[0];
    if (!target || /^(https?:|mailto:)/.test(target)) continue;
    const resolved = path.resolve(path.dirname(absolutePath), decodeURIComponent(target));
    if (!fs.existsSync(resolved)) fail(`${path.relative(skillRoot, absolutePath)} has broken link ${match[1]}`);
  }
}

for (const absolutePath of allFiles.filter((file) => /examples\/.*\.json$/.test(file))) {
  const text = fs.readFileSync(absolutePath, 'utf8');
  if (/__IMTCONN_[234]__/.test(text)) fail(`${path.relative(skillRoot, absolutePath)} contains a stale sharded binder`);
}

const publicText = allFiles
  .filter((file) => /\.(md|js|json|mjs)$/i.test(file))
  .map((file) => fs.readFileSync(file, 'utf8'))
  .join('\n');
for (const [label, pattern] of [
  ['tenant-specific host', /\bwe\.make\.com\b/i],
  ['local user path', /\/Users\/[^/]+\//],
  ['personal email', /s\.mertens@/i],
  ['personal name', /Sebastian\s+Mertens/i],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/],
  ['JWT bearer token', /Bearer\s+eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/],
]) {
  if (pattern.test(publicText)) fail(`public skill contains ${label}`);
}

const packageJson = JSON.parse(readRepo('package.json'));
const agentSkillNames = packageJson.agents?.skills?.map((entry) => entry.name) ?? [];
if (!agentSkillNames.includes('make-connected-code-hosting')) fail('package.json agents.skills must include make-connected-code-hosting');
if (packageJson.scripts?.['validate:connected-code'] !== 'node scripts/validate-connected-code-skill.mjs') {
  fail('package.json must expose validate:connected-code');
}
const buildScript = readRepo('build.sh');
if (!buildScript.includes('"make-connected-code-hosting"')) fail('build.sh must include make-connected-code-hosting');
if (buildScript.includes('cp -r "$REPO_ROOT/skills" "$BUNDLE/skills"')) {
  fail('build.sh must package the complete bundle from the SKILLS allowlist, not every local skills directory');
}
if (!buildScript.includes('for skill in "${SKILLS[@]}"')) {
  fail('complete bundle must use the SKILLS allowlist');
}
if (buildScript.includes('make-e2b-code-execution') || fs.existsSync(path.join(repoRoot, 'skills', 'make-e2b-code-execution'))) {
  fail('deprecated make-e2b-code-execution must be removed from source and packaging');
}
const wrapperScript = readRepo('scripts/validate-connected-code-skill.mjs');
if (!wrapperScript.includes("fileURLToPath(new URL('..', import.meta.url))")) {
  fail('validator wrapper must decode URL-escaped checkout paths with fileURLToPath');
}
if (!readRepo('README.md').includes('make-connected-code-hosting.zip')) fail('README.md must link make-connected-code-hosting.zip');
if (!readRepo('README.md').includes('`make-e2b-code-execution` is deprecated and removed')) fail('README.md must document E2B removal');
if (!readRepo('CLAUDE.md').includes('make-connected-code-hosting')) fail('CLAUDE.md must document make-connected-code-hosting');
if (!readRepo('CLAUDE.md').includes('`make-e2b-code-execution` is deprecated and removed')) fail('CLAUDE.md must document E2B removal');

const apiShellSkill = readRepo('skills/make-api-shell-connection-workflow/SKILL.md');
if (!apiShellSkill.includes('receives explicit fallback handoffs from `make-connected-code-hosting`')) {
  fail('make-api-shell-connection-workflow must accept the Connected Code fallback handoff');
}
const apiShellConnectionRequests = readRepo('skills/make-api-shell-connection-workflow/connection-requests.md');
if (/\be2b\b/i.test(apiShellConnectionRequests)) {
  fail('make-api-shell-connection-workflow must not retain an E2B credential route');
}
const scenarioSkill = readRepo('skills/make-scenario-building/SKILL.md');
for (const phrase of ['Select the Custom-Code Execution Surface', 'make-connected-code-hosting', 'make-api-shell-connection-workflow', 'normal Make Code module (`code:ExecuteCode`)', '`make-e2b-code-execution` is deprecated and removed']) {
  if (!scenarioSkill.includes(phrase)) fail(`make-scenario-building must include ${JSON.stringify(phrase)}`);
}
const publicMarkdownText = allFiles
  .filter((file) => file.endsWith('.md'))
  .map((file) => fs.readFileSync(file, 'utf8'))
  .join('\n');
for (const forbidden of ['arbitrary custom-code execution is reported as blocked', 'no supported hosted-code runtime is available', 'route: blocked — Connected Code unavailable for hosted-code migration']) {
  if (publicMarkdownText.includes(forbidden)) fail(`public skill must not claim unavailable Connected Code blocks custom code: ${JSON.stringify(forbidden)}`);
}

if (failures.length) {
  for (const message of failures) console.error(`FAIL: ${message}`);
  process.exit(1);
}

console.log(
  `CONNECTED_CODE_HOSTING_SKILL_VALIDATION_OK helperFiles=${manifest.files.length} helperExamples=${helperExamples.length} referenceExamples=${referenceJavaScript.length} catalogRows=${catalogRows.length} primaryExamples=${primaryExamples.length}`,
);