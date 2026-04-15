# Sanitization and Sharing

Use this checklist before installing a skill globally or contributing it to a shared repository.

## Remove tenant-specific data

Do not publish any of the following:
- real user names
- personal labels in `nameOverride`
- team IDs
- organization IDs
- user IDs such as provider IDs
- workspace-specific hosts such as a private Make workspace hostname
- absolute local file paths from a personal machine

Replace them with placeholders such as:
- `TEAM_ID`
- `ORG_ID`
- `REQUEST_ID`
- `SCENARIO_ID`
- `BASE_URL`
- `CONNECTION_ID`

## Rewrite example labels

Bad:
- `personal-outlook-api-shell`
- `gmail-shell-debug`
- `tenant-scoped API shell execution`

Better:
- `outlook-api-shell`
- `gmail-api-shell`
- `generic API shell execution`

## Rewrite evidence language

Bad:
- `verified live`
- `worked in tenant X`
- `confirmed from private reverse-engineering`

Better:
- `example observed during development`
- `practical fallback`
- `current workflow recommendation`
- `workspace-specific behavior can vary`

## Public documentation style

Prefer wording like this:
- `Use current Make metadata as the source of truth.`
- `Examples are illustrative and should be validated in the active workspace.`
- `If the preferred endpoint is unavailable, try the compatibility fallback.`

Avoid wording like this:
- `This exact request shape always works.`
- `These values are confirmed globally.`
- `This private workspace proves the rule for every tenant.`

## Final pre-publish scan

Search for and remove or replace:
- personal names
- email addresses
- numeric IDs copied from private environments
- `we.make.com`
- `providerMakeUserId`
- absolute home-directory paths copied from a personal machine
- phrases such as `verified live`, `working example`, or `for debugging` if they imply private validation or tenant-specific state

## Repository fit

For public repositories:
- keep `SKILL.md` concise
- move detailed operational guidance into sibling markdown files
- keep templates generic
- use examples that teach the shape of the workflow without exposing private data
