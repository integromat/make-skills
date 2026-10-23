import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const checker = fileURLToPath(new URL('./check-custom-app-examples.mjs', import.meta.url));
const examples = fileURLToPath(new URL('../plugins/make-skills-codex/skills/make-custom-apps/examples/', import.meta.url));

function run(root) {
  return spawnSync(process.execPath, [checker, ...(root ? ['--examples-root', root] : [])], {
    cwd: tmpdir(), encoding: 'utf8', timeout: 30000,
  });
}

function withCopy(fn) {
  const temp = mkdtempSync(join(tmpdir(), 'make-custom-app-examples-'));
  const copy = join(temp, 'copied-plugin', 'skills', 'make-custom-apps', 'examples');
  try {
    cpSync(examples, copy, { recursive: true });
    return fn(copy);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

function changeJson(root, file, mutate) {
  const path = join(root, file);
  const value = JSON.parse(readFileSync(path, 'utf8'));
  mutate(value);
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

test('checks shipped JSON and runs the actual helper tests from another working directory', () => {
  const result = run();
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.match(result.stdout, /JSON files/);
  assert.match(result.stdout, /preserves supported scalar values/);
  assert.match(result.stdout, /Offline static\/unit only/);
  assert.match(result.stdout, /no Make\/provider runtime/);
});

test('rejects page + 1 regressions in either one-based example', () => {
  for (const example of ['github-search', 'github-polling']) {
    withCopy((root) => {
      changeJson(root, `${example}/api.imljson`, (value) => {
        value.pagination.qs.page = '{{pagination.page + 1}}';
      });
      const result = run(root);
      assert.equal(result.status, 1, `${example}: ${result.stdout}`);
      assert.match(result.stderr, /pagination.page.*without.*1|one-based page/);
    });
  }
});

test('rejects malformed JSON rather than reporting a parse-only success', () => {
  withCopy((root) => {
    writeFileSync(join(root, 'github-search/expect.imljson'), '{ // not JSON\n');
    const result = run(root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Invalid JSON.*expect.imljson/);
  });
});

test('rejects a missing component dependency', () => {
  withCopy((root) => {
    rmSync(join(root, 'github-webhook/connection/api.imljson'));
    const result = run(root);
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /Missing required component.*connection\/api.imljson/);
  });
});

test('rejects an invalid README component link', () => {
  withCopy((root) => {
    const path = join(root, 'github-webhook/README.md');
    writeFileSync(path, readFileSync(path, 'utf8').replace('(webhook/api.imljson)', '(webhook/missing.imljson)'));
    const result = run(root);
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /Broken local link.*missing.imljson/);
  });
});

test('a falsy-handling mutation fails the actual copied helper tests', () => {
  withCopy((root) => {
    const path = join(root, 'custom-iml/defaultIfNull.js');
    const original = readFileSync(path, 'utf8');
    const mutated = original.replace('value === null || value === undefined ? fallback : value', 'value || fallback');
    assert.notEqual(mutated, original, 'Mutation must alter the implementation');
    writeFileSync(path, mutated);
    const result = run(root);
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /Helper unit tests failed/);
    assert.match(result.stderr, /preserve 0/);
  });
});

for (const [label, file, mutate, message] of [
  ['undeclared input', 'github-search/api.imljson', (v) => { v.qs.q = '{{parameters.missingQuery}}'; }, /Undeclared input.*missingQuery/],
  ['output schema drift', 'github-search/interface.imljson', (v) => { v[0].name = 'wrongId'; }, /Projection\/Interface mismatch/],
  ['mistyped sample', 'github-search/samples.imljson', (v) => { v.archived = 'false'; }, /Sample type.*archived/],
  ['missing helper dependency', 'custom-iml/output.imljson', (v) => { v.count = '{{missingHelper(parameters.count, 10)}}'; }, /defaultIfNull.*dependency/],
]) {
  test(`rejects ${label}`, () => withCopy((root) => {
    changeJson(root, file, mutate);
    const result = run(root);
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, message);
  }));
}

for (const [label, mutate, message] of [
  ['unknown catalog dependency', (m) => { m.entries[0].dependencies = ['absent-component']; }, /Unknown snippet dependency/],
  ['duplicate catalog id', (m) => { m.entries[1].id = m.entries[0].id; }, /Duplicate snippet id/],
  ['missing provenance', (m) => { delete m.entries[0].source; }, /Missing snippet provenance/],
]) {
  test(`rejects ${label}`, () => withCopy((root) => {
    changeJson(root, 'copied-snippets/manifest.json', mutate);
    const result = run(root);
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, message);
  }));
}

test('rejects an unindexed copied JSON file', () => withCopy((root) => {
  writeFileSync(join(root, 'copied-snippets/orphan.json'), '{}\n');
  const result = run(root);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /Manifest\/file coverage/);
}));

test('rejects an RPC reference that does not match its catalog dependency', () => withCopy((root) => {
  changeJson(root, 'copied-snippets/rpcs/base-select.imljson', (value) => {
    value[0].options = 'rpc://notProvided';
  });
  const result = run(root);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /Unresolved RPC dependency.*notProvided/);
}));

test('rejects duplicate snippet content even with a new id and reordered object keys', () => withCopy((root) => {
  const original = JSON.parse(readFileSync(join(root, 'copied-snippets/base/base-bearer.imljson'), 'utf8'));
  const reordered = Object.fromEntries(Object.entries(original).reverse());
  writeFileSync(join(root, 'copied-snippets/base/duplicate-copy.imljson'), JSON.stringify(reordered));
  changeJson(root, 'copied-snippets/manifest.json', (manifest) => {
    manifest.entries.push({ ...manifest.entries[0], id: 'duplicate-copy', file: 'base/duplicate-copy.imljson' });
  });
  const result = run(root);
  assert.equal(result.status, 1, 'duplicate content wrongly accepted');
  assert.match(result.stderr, /Duplicate snippet content/);
}));

test('validates an intact synchronized-style copy without using repository-relative helper paths', () => {
  withCopy((root) => {
    const result = run(root);
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.match(result.stdout, /preserves supported scalar values/);
  });
});

for (const [label, file, mutate, message] of [
  ['polling order drift', 'github-polling/api.imljson', (v) => { v.response.trigger.order = 'asc'; }, /Polling trigger contract/],
  ['extra Epoch identity field', 'github-polling/epoch.imljson', (v) => { v.response.output.id = '{{item.id}}'; }, /Epoch output/],
  ['erasing the Dropbox refresh token', 'dropbox-oauth/api.imljson', (v) => { v.refresh.response.data.refreshToken = '{{body.refresh_token}}'; }, /Dropbox refresh token/],
  ['wrong OAuth expiry location', 'dropbox-oauth/api.imljson', (v) => { v.token.response.expires = v.token.response.data.expires; delete v.token.response.data.expires; }, /OAuth token expiry/],
  ['missing credential log mask', 'dropbox-oauth/api.imljson', (v) => { v.token.log.sanitize = []; }, /Secret log mask/],
  ['enabled webhook receiver', 'github-webhook/webhook/api.imljson', (v) => { v.condition = true; }, /Webhook deployment block/],
  ['broken attach-to-detach identity', 'github-webhook/webhook/attach.imljson', (v) => { delete v.response.data.externalHookId; }, /Webhook saved identity/],
  ['regressed parameter validation', 'copied-snippets/parameters/bounded-number.imljson', (v) => { v.minimum = v.validate.min; delete v.validate; }, /Nested SDK validation/],
  ['falsy boolean fallback in a copied request', 'copied-snippets/requests/post-preserving-false.imljson', (v) => { v.body.active = '{{parameters.active || true}}'; }, /Copied boolean mapping/],
  ['wrong repeat context', 'copied-snippets/requests/bounded-async-poll.imljson', (v) => { v[1].repeat.condition = "{{body.status === 'IN_PROGRESS'}}"; }, /Repeat condition must use temp/],
]) {
  test(`rejects ${label}`, () => withCopy((root) => {
    changeJson(root, file, mutate);
    const result = run(root);
    assert.equal(result.status, 1, `${label}: checker wrongly passed`);
    assert.match(result.stderr, message);
  }));
}
