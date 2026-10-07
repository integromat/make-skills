// Source of truth: plugins/make-skills-codex/{skills,assets}. Copies them as real files
// (directory submissions skip symlinks) into every other consumer:
//   skills/ + assets/ (repo root: npx skills add, build.sh, check-skill-manifests),
//   plugins/make-skills-claude/, plugins/make-skills-cursor/, plugins/make-skills-openclaw/, plugins/make-skills-devin/, plugins/make-skills-copilot/.
// Run: node scripts/sync-plugins.mjs
// `--check` exits 1 if any copy is stale instead of writing.
import { cpSync, rmSync, readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const source = join(root, 'plugins/make-skills-codex');
const targets = [
  ['', root],
  ['plugins/make-skills-claude/', join(root, 'plugins/make-skills-claude')],
  ['plugins/make-skills-cursor/', join(root, 'plugins/make-skills-cursor')],
  ['plugins/make-skills-openclaw/', join(root, 'plugins/make-skills-openclaw')],
  ['plugins/make-skills-devin/', join(root, 'plugins/make-skills-devin')],
  ['plugins/make-skills-copilot/', join(root, 'plugins/make-skills-copilot')],
];
const check = process.argv.includes('--check');

const walk = (dir, base = dir) =>
  readdirSync(dir).filter((n) => n !== '.DS_Store').sort().flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p, base) : [[p.slice(base.length), readFileSync(p).toString('base64')]];
  });

let stale = false;
for (const d of ['skills', 'assets']) {
  const src = join(source, d);
  for (const [label, base] of targets) {
    const dst = join(base, d);
    if (check) {
      let same = false;
      try { same = JSON.stringify(walk(src)) === JSON.stringify(walk(dst)); } catch {}
      if (!same) { console.error(`✗ ${label}${d} is stale — run node scripts/sync-plugins.mjs`); stale = true; }
    } else {
      if (existsSync(dst)) rmSync(dst, { recursive: true, force: true });
      cpSync(src, dst, { recursive: true, filter: (s) => !s.endsWith('.DS_Store') });
    }
  }
}
if (check) process.exit(stale ? 1 : 0);
console.log('✓ Synced plugins/make-skills-codex/{skills,assets} to root, Claude, Cursor, OpenClaw, Devin and Copilot');
