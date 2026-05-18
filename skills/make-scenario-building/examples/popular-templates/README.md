# Popular templates — snapshots, not drop-in blueprints

These 10 files are lightly sanitized snapshots of `public-templates_get-blueprint` responses for the most-used public Make templates, kept here as canonical references for real `mapper`, `parameters`, `restore`, and `scheduling` shapes. Hardcoded resource IDs (`spreadsheetId`, `page_id`, channel IDs, etc.) have been blanked to empty strings (see below); everything else — including the original publisher's connection labels and organization labels under `metadata.restore.*` — is preserved verbatim so readers can see the canonical shape returned by the public endpoint. They are **not** ready-to-import blueprints.

## Before reusing as a scenario blueprint

1. **Fill in the emptied resource IDs.** Hardcoded resource IDs (`spreadsheetId`, `page_id`, `organization` URN, calendar IDs, channel IDs, etc.) have been replaced with empty strings (`""`) because they belonged to the original template publisher. Replace each empty value with your own resource ID, or — for downstream modules — wire it from an upstream module's output using a mapper expression (see the `{{1.\`__SPREADSHEET_ID__\`}}` pattern in [01-chatgpt-completions-from-google-sheets.json](./01-chatgpt-completions-from-google-sheets.json) module 3).

2. **Re-select connections.** Every module that needs auth carries a connection parameter — most commonly `__IMTCONN__`, but some module schemas name it differently (e.g., `account` in `google-email:ActionSendEmail`, see template 04). The exact name is listed in that module's `metadata.parameters[]` entry with a `type` starting `account:` (e.g., `account:google-restricted`). The corresponding `metadata.restore.parameters.<name>.label` carries the original publisher's connection label verbatim (e.g., `"My Google connection"`, `"My LinkedIn connection (integromat Developer)"`); use it to identify which connection slot maps to which provider, then replace with your own connection IDs (`connections_list` → pick by `accountName`) before deploying.

3. **Renumber module IDs when adapting.** Real templates often have non-1-based or non-sequential IDs (e.g., template `07` flows `id: 6` → `id: 5`; template `09` starts at `id: 4`) because of edit history in the original scenario. The project rule in [`blueprint-construction.md`](../../blueprint-construction.md) (sequential, starting at 1) applies when **constructing** new blueprints. When reusing a snippet from here, renumber the modules and update every mapper reference (`{{4.attachments}}`, `{{1.\`0\`}}`, etc.) accordingly.

4. **Replace placeholder content.** Some templates carry sample prompts, default LinkedIn/Facebook copy, example URLs (`https://www.example.com`), or even publisher typos in placeholders (e.g., `Content: {[Insert Content}` in template 08). Treat all human-readable strings inside `mapper.*` as starter text, not production copy — fix typos when adapting, not in the snapshot (a refresh would re-introduce them).

## What stays verbatim

- `blueprint`, `controller`, `scheduling` shapes — these define the structural patterns the docs reference.
- All `module` identifiers, `version` numbers, and `metadata.designer` coordinates.
- `metadata.templateUrl` and `metadata.usage` where present — these document which public template the file was sourced from and its install count.

## How to refresh a snapshot

Call `public-templates_get-blueprint` with the template ID encoded in `metadata.templateUrl` (the leading number, e.g., `10570` for template 01) and replace the file contents. Then re-apply the sanitization listed above.
