#!/usr/bin/env bash
# Build script for make-skills distribution packages
# Creates zip files for Claude Desktop/Claude.ai (individual skills) and Claude Code (bundle)
#
# Artifact strategy:
#   dist/<name>.zip          — stable alias, committed (download links point at
#                              raw.githubusercontent until the first GitHub
#                              Release exists) and uploaded as a Release asset
#   dist/<name>-v<ver>.zip   — versioned, gitignored, uploaded as a Release
#                              asset only
#
# Both are produced here and attached to the release by CI
# (.github/workflows/build-release-assets.yml).
#
# The set of skills packaged into individual zips AND into the bundle is the
# single source of truth in skills.publish.json. A skill folder present in
# skills/ but absent from that list is NOT published (enforced by
# scripts/check-skill-manifests.mjs).

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"

# jq parses skills.publish.json below; fail early with a clear message rather
# than an opaque error at the process-substitution read (jq is not preinstalled
# on fresh macOS).
command -v jq >/dev/null 2>&1 || {
    echo "Error: jq is required but not installed (e.g. 'brew install jq')." >&2
    exit 1
}

DIST_DIR="$REPO_ROOT/dist"
VERSION=$(jq -r '.version' "$REPO_ROOT/.claude-plugin/plugin.json")

# Skills to publish — single source of truth
# (read loop rather than mapfile for portability with macOS bash 3.2)
SKILLS=()
while IFS= read -r _skill; do
    [ -n "$_skill" ] && SKILLS+=("$_skill")
done < <(jq -r '.[]' "$REPO_ROOT/skills.publish.json")

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
    (cd "$TMPDIR" && zip -rq "$DIST_DIR/${skill}-v${VERSION}.zip" "$skill/" -x "*.DS_Store")
    # Stable alias (version-free) so docs don't 404 after a bump
    cp "$DIST_DIR/${skill}-v${VERSION}.zip" "$DIST_DIR/${skill}.zip"
done

# Build complete bundle (for Claude Code) — only published skills
echo "Building complete bundle..."

TMPDIR=$(mktemp -d "${TMPDIR:-/tmp}/make-skills.XXXXXX")
_CLEANUP_DIRS+=("$TMPDIR")
BUNDLE="$TMPDIR/make-skills"
mkdir -p "$BUNDLE"
cp -r "$REPO_ROOT/.claude-plugin" "$BUNDLE/.claude-plugin"
mkdir -p "$BUNDLE/skills"
for skill in "${SKILLS[@]}"; do
    cp -r "$REPO_ROOT/skills/$skill" "$BUNDLE/skills/$skill"
done
cp "$REPO_ROOT/.mcp.json" "$BUNDLE/.mcp.json"
cp "$REPO_ROOT/README.md" "$BUNDLE/README.md"
cp "$REPO_ROOT/LICENSE" "$BUNDLE/LICENSE"
cp "$REPO_ROOT/CLAUDE.md" "$BUNDLE/CLAUDE.md"
(cd "$TMPDIR" && zip -rq "$DIST_DIR/make-skills-v${VERSION}.zip" "make-skills/" -x "*.DS_Store")
# Stable alias
cp "$DIST_DIR/make-skills-v${VERSION}.zip" "$DIST_DIR/make-skills.zip"

# Build Codex/ChatGPT plugin bundle (symlinked skills/assets/.mcp.json materialized)
# Note: the official `codex plugin pack` command additionally generates plugin.lock.json
# with per-skill integrity hashes; run it on this materialized folder before submission.
echo "Building Codex plugin bundle..."

TMPDIR=$(mktemp -d "${TMPDIR:-/tmp}/make-skills.XXXXXX")
_CLEANUP_DIRS+=("$TMPDIR")
CODEX_BUNDLE="$TMPDIR/make-skills-codex"
mkdir -p "$CODEX_BUNDLE"
cp -RL "$REPO_ROOT/plugins/make-skills-codex/." "$CODEX_BUNDLE/"
(cd "$TMPDIR" && zip -rq "$DIST_DIR/make-skills-codex-v${VERSION}.zip" "make-skills-codex/" -x "*.DS_Store")
# Stable alias
cp "$DIST_DIR/make-skills-codex-v${VERSION}.zip" "$DIST_DIR/make-skills-codex.zip"

# Results
echo ""
echo "Build complete! Files in dist/:"
echo ""
echo "Individual skills (Claude Desktop / Claude.ai):"
for skill in "${SKILLS[@]}"; do
    SIZE=$(du -h "$DIST_DIR/${skill}-v${VERSION}.zip" | cut -f1)
    echo "  ${skill}-v${VERSION}.zip  ${SIZE}"
    echo "  ${skill}.zip  (stable alias)"
done
echo ""
echo "Complete bundle (Claude Code):"
SIZE=$(du -h "$DIST_DIR/make-skills-v${VERSION}.zip" | cut -f1)
echo "  make-skills-v${VERSION}.zip  ${SIZE}"
echo "  make-skills.zip  (stable alias)"
echo ""
echo "Codex/ChatGPT plugin bundle:"
SIZE=$(du -h "$DIST_DIR/make-skills-codex-v${VERSION}.zip" | cut -f1)
echo "  make-skills-codex-v${VERSION}.zip  ${SIZE}"
echo "  make-skills-codex.zip  (stable alias)"
