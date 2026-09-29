// Copies skills/ and assets/ into plugins/make-skills-claude/ as real files
// (directory submissions skip symlinks). Run: node scripts/sync-claude-plugin.mjs
// `--check` exits 1 if the copies are stale instead of writing.
import { cpSync, rmSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dest = join(root, 'plugins/make-skills-claude');
const check = process.argv.includes('--check');

const walk = (dir, base = dir) =>
  readdirSync(dir).filter((n) => n !== '.DS_Store').sort().flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p, base) : [[p.slice(base.length), readFileSync(p).toString('base64')]];
  });

let stale = false;
for (const d of ['skills', 'assets']) {
  const src = join(root, d);
  const dst = join(dest, d);
  if (check) {
    let same = false;
    try { same = JSON.stringify(walk(src)) === JSON.stringify(walk(dst)); } catch {}
    if (!same) { console.error(`✗ plugins/make-skills-claude/${d} is stale — run node scripts/sync-claude-plugin.mjs`); stale = true; }
  } else {
    rmSync(dst, { recursive: true, force: true });
    cpSync(src, dst, { recursive: true, filter: (s) => !s.endsWith('.DS_Store') });
  }
}
if (check) process.exit(stale ? 1 : 0);
console.log('✓ Synced skills/ and assets/ into plugins/make-skills-claude/');
