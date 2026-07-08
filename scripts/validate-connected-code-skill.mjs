#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const validator = path.join(root, 'skills/make-connected-code-hosting/scripts/validate-connected-code-hosting-skill.mjs');
const result = spawnSync(process.execPath, [validator], { cwd: root, stdio: 'inherit' });
process.exitCode = result.status ?? 1;
