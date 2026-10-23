import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const codeUrl = new URL('./defaultIfNull.js', import.meta.url);

function loadHelper() {
  assert.ok(existsSync(codeUrl), 'The defaultIfNull Code component must exist');
  const code = readFileSync(codeUrl, 'utf8');
  return runInNewContext(`${code}\ndefaultIfNull;`, Object.create(null), {
    filename: 'defaultIfNull.js',
    timeout: 1000,
    contextCodeGeneration: { strings: false, wasm: false },
  });
}

test('uses the supplied fallback for null and undefined', () => {
  const defaultIfNull = loadHelper();
  assert.equal(defaultIfNull(null, 10), 10);
  assert.equal(defaultIfNull(undefined, true), true);
});

test('preserves supported scalar values, including 0, false and empty text', () => {
  const defaultIfNull = loadHelper();
  for (const value of [0, -0, false, '', 12.5, -4, true, 'text']) {
    assert.ok(Object.is(defaultIfNull(value, 'fallback'), value), `preserve ${String(value)}`);
  }
  assert.equal(defaultIfNull(null, 0), 0);
  assert.equal(defaultIfNull(undefined, false), false);
});

test('rejects unsupported values and unsupported fallbacks without coercion', () => {
  const defaultIfNull = loadHelper();
  const unsupported = [
    [], {}, new Date(0), () => 1, Symbol('value'), 1n, NaN, Infinity, -Infinity,
  ];
  for (const value of unsupported) {
    assert.throws(() => defaultIfNull(value, 10), /Expected a scalar or nullish value/);
    assert.throws(() => defaultIfNull(null, value), /Expected a scalar or nullish value/);
    assert.throws(() => defaultIfNull(0, value), /Expected a scalar or nullish value/);
  }
  assert.equal(defaultIfNull(null, undefined), undefined);
  assert.equal(defaultIfNull(undefined, null), null);
});
