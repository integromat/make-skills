#!/usr/bin/env node
// Narrow offline checks for this repository's shipped teaching examples only.
// This is not an SDK schema validator, IML interpreter, or provider E2E test.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

export const DEFAULT_EXAMPLES = fileURLToPath(new URL(
  '../plugins/make-skills-codex/skills/make-custom-apps/examples/', import.meta.url,
));

function filesUnder(root) {
  return readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => entry.isDirectory() ? filesUnder(join(root, entry.name)) : [join(root, entry.name)]);
}

function checkInputs(communication, definitions, label) {
  const names = new Set(definitions.map((field) => field.name));
  for (const match of JSON.stringify(communication).matchAll(/parameters\.([A-Za-z_]\w*)/g)) {
    assert.ok(names.has(match[1]), `Undeclared input ${match[1]} in ${label}`);
  }
}

function checkFlatOutput(output, fields, sample, label) {
  const names = fields.map((field) => field.name);
  assert.equal(new Set(names).size, names.length, `Duplicate Interface field in ${label}`);
  assert.deepEqual(Object.keys(output).sort(), [...names].sort(), `Projection/Interface mismatch in ${label}`);
  if (sample === undefined) return;
  assert.deepEqual(Object.keys(sample).sort(), [...names].sort(), `Sample/Interface mismatch in ${label}`);
  for (const { name, type } of fields) {
    const value = sample[name];
    const valid = type === 'boolean' ? typeof value === 'boolean'
      : type === 'uinteger' ? Number.isInteger(value) && value >= 0
      : type === 'number' ? typeof value === 'number' && Number.isFinite(value)
      : type === 'date' ? typeof value === 'string' && Number.isFinite(Date.parse(value))
      : type === 'text' ? typeof value === 'string' : false;
    assert.ok(valid, `Sample type mismatch for ${label}.${name}: expected ${type}`);
  }
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

function checkSnippetManifest(root, json) {
  const directory = join(root, 'copied-snippets');
  const manifestPath = join(directory, 'manifest.json');
  const manifest = json.get(manifestPath);
  assert.equal(manifest?.format, 'make-custom-apps-copied-snippets-v1', 'Missing/invalid copied-snippet manifest');
  assert.ok(Array.isArray(manifest.entries) && manifest.entries.length > 0, 'Empty snippet manifest');
  const byId = new Map();
  const listed = [];
  for (const entry of manifest.entries) {
    assert.match(entry.id, /^[a-z][a-z0-9-]+$/, 'Invalid snippet id');
    assert.ok(!byId.has(entry.id), `Duplicate snippet id: ${entry.id}`);
    assert.ok(entry.source?.category && entry.source?.title && entry.source?.section,
      `Missing snippet provenance: ${entry.id}`);
    assert.ok(entry.topic && entry.role && entry.validation, `Missing snippet role/limitations: ${entry.id}`);
    assert.ok(Array.isArray(entry.limitations) && entry.limitations.length, `Missing snippet limitations: ${entry.id}`);
    assert.ok(Array.isArray(entry.publicDocs) && entry.publicDocs.length && entry.publicDocs.every(
      (url) => typeof url === 'string' && url.startsWith('https://developers.make.com/custom-apps-documentation/')),
    `Missing public SDK references: ${entry.id}`);
    assert.ok(['copied', 'adapted'].includes(entry.copyStatus) && Array.isArray(entry.adaptations), `Invalid copy status: ${entry.id}`);
    assert.ok(entry.copyStatus === 'copied' || entry.adaptations.length > 0, `Missing adaptations: ${entry.id}`);
    assert.ok(Array.isArray(entry.dependencies), `Missing dependency list: ${entry.id}`);
    assert.match(entry.file, /^[a-z-]+\/[a-z0-9-]+\.(?:json|imljson)$/, `Unsafe snippet path: ${entry.id}`);
    assert.ok(json.has(join(directory, entry.file)), `Missing snippet file: ${entry.file}`);
    byId.set(entry.id, entry);
    listed.push(join(directory, entry.file));
  }
  const actual = [...json.keys()].filter((file) => file.startsWith(`${directory}${sep}`) && file !== manifestPath).sort();
  assert.deepEqual(listed.sort(), actual, 'Manifest/file coverage mismatch');
  const contents = new Map();
  for (const entry of manifest.entries) {
    const canonical = JSON.stringify(stableValue(json.get(join(directory, entry.file))));
    assert.ok(!contents.has(canonical), `Duplicate snippet content: ${entry.id} and ${contents.get(canonical)}`);
    contents.set(canonical, entry.id);
    for (const dependency of entry.dependencies) {
      assert.ok(byId.has(dependency), `Unknown snippet dependency ${dependency} in ${entry.id}`);
    }
    const source = JSON.stringify(json.get(join(directory, entry.file)));
    for (const match of source.matchAll(/rpc:\/\/([A-Za-z][A-Za-z0-9_]*)/g)) {
      assert.ok(entry.dependencies.some((id) => byId.get(id)?.provides?.rpc === match[1]),
        `Unresolved RPC dependency ${match[1]} in ${entry.id}`);
    }
  }
  return manifest.entries.length;
}

function checkParameterValidation(value) {
  if (!value || typeof value !== 'object') return;
  if (typeof value.name === 'string' && typeof value.type === 'string') {
    for (const key of ['minimum', 'maximum', 'pattern']) {
      assert.ok(!Object.hasOwn(value, key), `Nested SDK validation required for ${value.name}.${key}`);
    }
  }
  for (const child of Object.values(value)) checkParameterValidation(child);
}

function checkRegressionContracts(read) {
  const search = read('github-search/api.imljson');
  assert.equal(search.response.iterate, '{{body.items}}', 'Search item container');
  assert.equal(search.response.limit, '{{parameters.limit}}', 'Search bundle limit');
  const poll = read('github-polling/api.imljson');
  assert.deepEqual(poll.response.trigger, {
    type: 'date', order: 'desc', id: '{{item.id}}', date: '{{parseDate(item.created_at)}}',
  }, 'Polling trigger contract must match created-date descending provider order');
  assert.equal(poll.qs.sort, 'created', 'Polling trigger contract: provider sort');
  assert.equal(poll.qs.direction, 'desc', 'Polling trigger contract: provider order');
  assert.equal(poll.qs.state, 'all', 'Polling trigger contract: include closed records');
  assert.equal(poll.response.iterate, '{{body}}', 'Polling item container');
  const epoch = read('github-polling/epoch.imljson');
  assert.deepEqual(Object.keys(epoch.response.output).sort(), ['date', 'label'], 'Epoch output must contain only date and label');
  assert.equal(epoch.response.output.date, poll.response.trigger.date, 'Epoch output date');
  assert.equal(epoch.response.limit, 300, 'Epoch UI record limit');

  const oauth = read('dropbox-oauth/api.imljson');
  assert.equal(oauth.authorize.qs.token_access_type, 'offline', 'Dropbox offline authorization');
  assert.equal(oauth.refresh.response.data.refreshToken, '{{data.refreshToken}}', 'Dropbox refresh token must be retained');
  assert.equal(oauth.refresh.body.refresh_token, '{{data.refreshToken}}', 'Dropbox refresh token dependency');
  for (const name of ['token', 'refresh']) {
    const request = oauth[name];
    assert.equal(request.response.data.expires, '{{addSeconds(now, body.expires_in)}}', `OAuth ${name} expiry belongs in response.data`);
    assert.equal(request.response.expires, undefined, `OAuth ${name} expiry must not invent refresh-token expiry`);
    assert.equal(request.type, 'urlencoded', 'OAuth token/refresh form encoding');
    for (const path of ['request.body.client_secret', 'response.body.access_token']) {
      assert.ok(request.log?.sanitize?.includes(path), `Secret log mask missing: ${name}.${path}`);
    }
  }
  assert.equal(oauth.token.condition, undefined, 'Do not repeat a one-use authorization code');
  assert.equal(oauth.authorize.qs.redirect_uri, oauth.token.body.redirect_uri, 'OAuth callback mismatch');
  assert.deepEqual(read('dropbox-oauth/scope.imljson'), ['account_info.read'], 'Dropbox info scope');
  assert.ok(oauth.info.log?.sanitize?.includes('request.headers.authorization'), 'Secret log mask missing: info authorization');

  const attach = read('github-webhook/webhook/attach.imljson');
  const detach = read('github-webhook/webhook/detach.imljson');
  const receive = read('github-webhook/webhook/api.imljson');
  for (const component of [attach, detach, receive, receive.verification]) {
    assert.equal(component.condition, false, 'Webhook deployment block must remain disabled');
  }
  assert.equal(attach.body.active, false, 'Webhook deployment block: inactive registration');
  assert.equal(receive.respond.status, 503, 'Webhook deployment block: no successful acknowledgement');
  assert.equal(receive.verification.respond.status, 503, 'Webhook deployment block: no successful verification');
  assert.equal(attach.response.data.externalHookId, '{{body.id}}', 'Webhook saved identity must come from provider id');
  for (const key of ['owner', 'repo']) {
    assert.equal(attach.response.data[key], `{{parameters.${key}}}`, `Webhook saved identity: ${key}`);
    assert.ok(detach.url.includes(`webhook.${key}`), `Webhook saved identity missing from detach: ${key}`);
  }
  assert.ok(detach.url.includes('{{webhook.externalHookId}}'), 'Webhook saved identity missing from detach');
  assert.ok(attach.log.sanitize.includes('request.body.config.secret'), 'Secret log mask missing: webhook signing secret');

  const post = read('copied-snippets/requests/post-preserving-false.imljson');
  assert.equal(post.body.active, '{{if(parameters.active != null && parameters.active != undefined, parameters.active, true)}}',
    'Copied boolean mapping must preserve false and handle missing values');
  const pollRequest = read('copied-snippets/requests/bounded-async-poll.imljson')[1];
  assert.equal(pollRequest.repeat.condition, "{{temp.status === 'IN_PROGRESS'}}", 'Repeat condition must use temp');
  assert.equal(pollRequest.response.temp.status, '{{body.status}}', 'Repeat status must be stored in temp');
  assert.equal(pollRequest.repeat.delay, 2000, 'Repeat delay must be a fixed number');
  assert.equal(pollRequest.repeat.limit, 10, 'Repeat must be bounded');
}

export function validateExamples(root = DEFAULT_EXAMPLES) {
  const required = {
    'github-search': ['api.imljson', 'parameters.imljson', 'expect.imljson', 'interface.imljson', 'samples.imljson'],
    'github-polling': ['api.imljson', 'parameters.imljson', 'epoch.imljson', 'interface.imljson', 'samples.imljson'],
    'dropbox-oauth': ['api.imljson', 'parameters.imljson', 'scope.imljson', 'common.example.json'],
    'github-webhook': ['connection/api.imljson', 'connection/parameters.imljson',
      'webhook/api.imljson', 'webhook/parameters.imljson', 'webhook/attach.imljson', 'webhook/detach.imljson',
      'trigger/api.imljson', 'trigger/parameters.imljson', 'trigger/interface.imljson', 'trigger/samples.imljson'],
    'custom-iml': ['defaultIfNull.js', 'default-if-null.test.mjs', 'expect.imljson',
      'output.imljson', 'interface.imljson', 'samples.imljson'],
  };
  for (const [folder, names] of Object.entries(required)) {
    for (const name of ['README.md', ...names]) {
      assert.ok(existsSync(join(root, folder, name)), `Missing required component ${folder}/${name}`);
    }
  }
  assert.ok(existsSync(join(root, 'README.md')), 'Missing examples README.md');
  const files = filesUnder(root);
  for (const file of files.filter((name) => name.endsWith('.md'))) {
    for (const match of readFileSync(file, 'utf8').matchAll(/\[[^\]]*\]\(([^\s)]+)\)/g)) {
      const target = match[1];
      if (/^(?:https?:|mailto:|#)/.test(target)) continue;
      assert.ok(existsSync(resolve(dirname(file), target.split('#')[0])),
        `Broken local link in ${file}: ${target}`);
    }
  }
  const json = new Map();
  for (const file of files.filter((path) => /\.(json|imljson)$/.test(path))) {
    try {
      json.set(file, JSON.parse(readFileSync(file, 'utf8')));
    } catch (error) {
      throw new Error(`Invalid JSON in ${file}: ${error.message}`);
    }
  }
  assert.ok(json.size > 0, 'No example JSON files found');
  const read = (name) => json.get(join(root, name));
  for (const name of ['github-search', 'github-polling']) {
    const api = read(`${name}/api.imljson`);
    const inputs = [...read(`${name}/parameters.imljson`), ...(read(`${name}/expect.imljson`) ?? [])];
    checkInputs(api, inputs, name);
    checkFlatOutput(api.response.output, read(`${name}/interface.imljson`), read(`${name}/samples.imljson`), name);
    assert.equal(api?.qs?.page, 1, `${name}: first one-based page must be 1`);
    assert.equal(api?.pagination?.qs?.page, '{{pagination.page}}',
      `${name}: one-based page must use pagination.page without + 1`);
  }
  checkInputs(read('github-webhook/webhook/attach.imljson'), read('github-webhook/webhook/parameters.imljson'), 'webhook attach');
  checkInputs(read('github-webhook/connection/api.imljson'), read('github-webhook/connection/parameters.imljson'), 'webhook connection');
  checkFlatOutput(read('github-webhook/webhook/api.imljson').output, read('github-webhook/trigger/interface.imljson'),
    read('github-webhook/trigger/samples.imljson'), 'webhook trigger');
  const helperOutput = read('custom-iml/output.imljson');
  assert.deepEqual(helperOutput, {
    count: '{{defaultIfNull(parameters.count, 10)}}', active: '{{defaultIfNull(parameters.active, true)}}',
  }, 'defaultIfNull caller dependency must match the shipped function');
  checkInputs(helperOutput, read('custom-iml/expect.imljson'), 'helper caller');
  checkFlatOutput(helperOutput, read('custom-iml/interface.imljson'), read('custom-iml/samples.imljson'), 'helper caller');
  const copiedSnippets = checkSnippetManifest(root, json);
  for (const value of json.values()) checkParameterValidation(value);
  checkRegressionContracts(read);
  checkInputs(read('copied-snippets/requests/message-request.imljson'), read('copied-snippets/requests/message-inputs.imljson'), 'copied message');
  checkFlatOutput(read('copied-snippets/requests/message-request.imljson').response.output,
    read('copied-snippets/requests/message-interface.imljson'), undefined, 'copied message');
  return { jsonFiles: json.size, copiedSnippets };
}

export function runHelperTests(root = DEFAULT_EXAMPLES) {
  // An outer node:test runner sets this; inheriting it suppresses nested tests' reporting.
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const result = spawnSync(process.execPath, ['--test', join(root, 'custom-iml/default-if-null.test.mjs')], {
    cwd: root, encoding: 'utf8', timeout: 30000, env,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`Helper unit tests failed:\n${result.error?.message ?? ''}${result.stdout ?? ''}${result.stderr ?? ''}`);
  }
  return result.stdout;
}

function main() {
  const args = process.argv.slice(2);
  assert.ok(args.length === 0 || (args.length === 2 && args[0] === '--examples-root'),
    'Usage: node scripts/check-custom-app-examples.mjs [--examples-root PATH]');
  const root = args.length ? resolve(args[1]) : DEFAULT_EXAMPLES;
  const result = validateExamples(root);
  process.stdout.write(runHelperTests(root));
  console.log(`Checked ${result.jsonFiles} JSON files and ${result.copiedSnippets} indexed snippets. Offline static/unit only; no Make/provider runtime.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    main();
  } catch (error) {
    console.error(`Example check failed: ${error.message}`);
    process.exitCode = 1;
  }
}
