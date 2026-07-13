#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(scriptDir, '..');
const destinationRoot = path.join(skillRoot, 'references', 'connected-code-helpers');
const sourceRoot = path.resolve(process.argv[2] || process.env.CONNECTED_CODE_HELPERS_ROOT || '');

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function gitRaw(...args) {
  return execFileSync('git', ['-C', sourceRoot, ...args], { encoding: 'utf8' });
}

function git(...args) {
  return gitRaw(...args).trim();
}

if (!process.argv[2] && !process.env.CONNECTED_CODE_HELPERS_ROOT) {
  fail('pass the connected-code-helpers checkout path as the first argument or CONNECTED_CODE_HELPERS_ROOT');
}
if (!fs.existsSync(path.join(sourceRoot, '.git'))) {
  fail(`${sourceRoot} is not a git checkout`);
}
if (git('status', '--porcelain')) {
  fail('source repository has uncommitted changes; commit or discard them before syncing');
}

const files = gitRaw('ls-files', '-z').split('\0').filter(Boolean).sort();
if (files.length === 0) fail('source repository has no tracked files');
for (const relativePath of files) {
  if (path.isAbsolute(relativePath) || relativePath.split('/').includes('..')) {
    fail(`unsafe tracked path ${relativePath}`);
  }
  const sourcePath = path.join(sourceRoot, relativePath);
  if (!fs.lstatSync(sourcePath).isFile()) fail(`tracked path is not a regular file: ${relativePath}`);
}

const sourceRepository = git('remote', 'get-url', 'origin')
  .replace(/^git@github\.com:/, 'https://github.com/')
  .replace(/^ssh:\/\/git@github\.com\//, 'https://github.com/')
  .replace(/\.git$/, '');
const sourceCommit = git('rev-parse', 'HEAD');
const manifest = {
  sourceRepository,
  sourceCommit,
  sourceFileCount: files.length,
  files: files.map((relativePath) => ({
    path: relativePath,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(sourceRoot, relativePath))).digest('hex'),
  })),
};

const temporaryRoot = `${destinationRoot}.tmp-${process.pid}`;
fs.rmSync(temporaryRoot, { recursive: true, force: true });
try {
  for (const relativePath of files) {
    const sourcePath = path.join(sourceRoot, relativePath);
    const destinationPath = path.join(temporaryRoot, relativePath);
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.copyFileSync(sourcePath, destinationPath);
  }
  fs.writeFileSync(path.join(temporaryRoot, 'SOURCE.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  fs.rmSync(destinationRoot, { recursive: true, force: true });
  fs.renameSync(temporaryRoot, destinationRoot);
} catch (error) {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
  throw error;
}

console.log(`Synced ${files.length} files from ${sourceRepository}@${sourceCommit}`);
