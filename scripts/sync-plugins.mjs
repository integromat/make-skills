// Source of truth: the repo-root skills/ and assets/. Copies them as real files into every
// plugins/<name>/ folder, because Codex drops symlinks when it installs a plugin and every
// client rejects skill paths outside the plugin folder.
// Run: node scripts/sync-plugins.mjs
// `--check` exits 1 if any copy is stale instead of writing.
import { cpSync, rmSync, readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const plugins = readdirSync(join(root, 'plugins'), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();
const check = process.argv.includes('--check');

const walk = (dir, base = dir) =>
  readdirSync(dir).filter((n) => n !== '.DS_Store').sort().flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p, base) : [[p.slice(base.length), readFileSync(p).toString('base64')]];
  });

let stale = false;
for (const d of ['skills', 'assets']) {
  const src = join(root, d);
  for (const plugin of plugins) {
    const dst = join(root, 'plugins', plugin, d);
    if (check) {
      let same = false;
      try { same = JSON.stringify(walk(src)) === JSON.stringify(walk(dst)); } catch {}
      if (!same) { console.error(`✗ plugins/${plugin}/${d} is stale — run node scripts/sync-plugins.mjs`); stale = true; }
    } else {
      if (existsSync(dst)) rmSync(dst, { recursive: true, force: true });
      cpSync(src, dst, { recursive: true, filter: (s) => !s.endsWith('.DS_Store') });
    }
  }
}
if (check) process.exit(stale ? 1 : 0);
console.log(`✓ Synced skills/ and assets/ to ${plugins.map((p) => `plugins/${p}`).join(', ')}`);
