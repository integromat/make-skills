#!/usr/bin/env bash
# Build script for make-skills distribution packages
# Creates zip files for Claude Desktop/Claude.ai (individual skills) and Claude Code (bundle)
#
# Output: dist/<name>.zip, committed for the raw.githubusercontent download links
# and attached to each GitHub Release by release.yml. The file names carry no
# version so /releases/latest/download/<name>.zip resolves in every release.
#
# The skills packaged into individual zips AND into the bundle are those with
# "publish": true in skills.json, the single source of truth. Every skills/
# folder must be listed there (enforced by scripts/check-skill-manifests.mjs).

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"

# jq parses skills.json below; fail early with a clear message rather
# than an opaque error at the process-substitution read (jq is not preinstalled
# on fresh macOS).
command -v jq >/dev/null 2>&1 || {
    echo "Error: jq is required but not installed (e.g. 'brew install jq')." >&2
    exit 1
}

node "$REPO_ROOT/scripts/sync-plugins.mjs"

DIST_DIR="$REPO_ROOT/dist"
VERSION=$(jq -r '.version' "$REPO_ROOT/package.json")

# Skills to publish
# (read loop rather than mapfile for portability with macOS bash 3.2)
SKILLS=()
while IFS= read -r _skill; do
    [ -n "$_skill" ] && SKILLS+=("$_skill")
done < <(jq -r '.skills | to_entries[] | select(.value.publish) | .key' "$REPO_ROOT/skills.json")

# Cleanup temp dirs on exit/error/interrupt
_CLEANUP_DIRS=()
cleanup() {
  for d in "${_CLEANUP_DIRS[@]}"; do rm -rf "$d" 2>/dev/null; done
}
trap cleanup EXIT

echo "Building make-skills distribution packages v${VERSION}..."
echo ""

# Clean and create dist/
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Build individual skill zips (for Claude Desktop / Claude.ai)
# Structure: skill-name/ at zip root
echo "Building individual skill zips..."

for skill in "${SKILLS[@]}"; do
    echo "  - $skill"
    TMPDIR=$(mktemp -d "${TMPDIR:-/tmp}/make-skills.XXXXXX")
    _CLEANUP_DIRS+=("$TMPDIR")
    cp -r "$REPO_ROOT/skills/$skill" "$TMPDIR/$skill"
    (cd "$TMPDIR" && zip -rq "$DIST_DIR/${skill}.zip" "$skill/" -x "*.DS_Store")
done

# Build complete bundle (for Claude Code) — only published skills
echo "Building complete bundle..."

TMPDIR=$(mktemp -d "${TMPDIR:-/tmp}/make-skills.XXXXXX")
_CLEANUP_DIRS+=("$TMPDIR")
BUNDLE="$TMPDIR/make-skills"
mkdir -p "$BUNDLE"
cp -r "$REPO_ROOT/plugins/make-skills-claude/.claude-plugin" "$BUNDLE/.claude-plugin"
mkdir -p "$BUNDLE/skills"
for skill in "${SKILLS[@]}"; do
    cp -r "$REPO_ROOT/skills/$skill" "$BUNDLE/skills/$skill"
done
cp "$REPO_ROOT/plugins/make-skills-claude/.mcp.json" "$BUNDLE/.mcp.json"
cp "$REPO_ROOT/README.md" "$BUNDLE/README.md"
cp "$REPO_ROOT/LICENSE" "$BUNDLE/LICENSE"
(cd "$TMPDIR" && zip -rq "$DIST_DIR/make-skills.zip" "make-skills/" -x "*.DS_Store")

# Results
echo ""
echo "Build complete! Files in dist/:"
echo ""
echo "Individual skills (Claude Desktop / Claude.ai):"
for skill in "${SKILLS[@]}"; do
    SIZE=$(du -h "$DIST_DIR/${skill}.zip" | cut -f1)
    echo "  ${skill}.zip  ${SIZE}"
done
echo ""
echo "Complete bundle (Claude Code):"
SIZE=$(du -h "$DIST_DIR/make-skills.zip" | cut -f1)
echo "  make-skills.zip  ${SIZE}"
