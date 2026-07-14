// Config for @integromat/actions-toolkit (org-managed release-please + PR validation).
// The release-please + validate-pr workflows themselves are generated from mono
// (libs/github-resources/src/repositories/make-skills.ts) — do not add them here.
//
// This file only supplies the extra version-bump targets release-please can't infer
// from the `node` release type (which already bumps package.json + package-lock.json).
// The per-skill SKILL.md targets are DERIVED from skills.publish.json so there is no
// second skill list to drift; adding/removing a published skill needs no edit here.
//
// SKILL.md files use release-please's `generic` updater — the version line carries a
// trailing `# x-release-please-version` annotation.

import { readFileSync } from 'node:fs';

const publish = JSON.parse(
  readFileSync(new URL('./skills.publish.json', import.meta.url), 'utf8'),
);

/** @type {import('@integromat/actions-toolkit').ConfigSchema} */
const config = {
  releasePlease: {
    releaseType: 'node',
    targetBranch: 'develop',
    extraFiles: [
      { type: 'json', path: '.claude-plugin/plugin.json', jsonpath: '$.version' },
      { type: 'json', path: 'plugins/make-skills-codex/.codex-plugin/plugin.json', jsonpath: '$.version' },
      { type: 'json', path: '.claude-plugin/marketplace.json', jsonpath: '$.plugins[0].version' },
      ...publish.map((skill) => ({ type: 'generic', path: `skills/${skill}/SKILL.md` })),
    ],
  },
};

export default config;
