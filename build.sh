#!/usr/bin/env bash
# Build script for make-skills distribution packages
# Creates zip files for Claude Desktop/Claude.ai (individual skills) and Claude Code (bundle)
#
# Artifact strategy:
#   dist/<name>.zip          — stable aliases, committed to main for raw downloads
#   dist/<name>-v<ver>.zip   — versioned, gitignored, attached to GitHub Releases
#
# After building, publish versioned artifacts to a release:
#   gh release create v${VERSION} dist/*-v${VERSION}.zip

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_ROOT="$REPO_ROOT/plugins/make-skills"
DIST_DIR="$REPO_ROOT/dist"
VERSION=$(grep '"version"' "$PLUGIN_ROOT/.claude-plugin/plugin.json" | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/')

# Cleanup temp dirs on exit/error/interrupt
_CLEANUP_DIRS=()
cleanup() {
  for d in "${_CLEANUP_DIRS[@]}"; do rm -rf "$d" 2>/dev/null; done
}
trap cleanup EXIT

SKILLS=(
    "make-scenario-building"
    "make-module-configuring"
    "make-mcp-reference"
)

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
    cp -r "$PLUGIN_ROOT/skills/$skill" "$TMPDIR/$skill"
    (cd "$TMPDIR" && zip -rq "$DIST_DIR/${skill}-v${VERSION}.zip" "$skill/" -x "*.DS_Store")
    # Stable alias (version-free) so docs don't 404 after a bump
    cp "$DIST_DIR/${skill}-v${VERSION}.zip" "$DIST_DIR/${skill}.zip"
done

# Build complete bundle (for Claude Code)
echo "Building complete bundle..."

TMPDIR=$(mktemp -d "${TMPDIR:-/tmp}/make-skills.XXXXXX")
_CLEANUP_DIRS+=("$TMPDIR")
BUNDLE="$TMPDIR/make-skills"
mkdir -p "$BUNDLE"
cp -r "$PLUGIN_ROOT/.claude-plugin" "$BUNDLE/.claude-plugin"
cp -r "$PLUGIN_ROOT/skills" "$BUNDLE/skills"
cp "$PLUGIN_ROOT/.mcp.json" "$BUNDLE/.mcp.json"
cp "$REPO_ROOT/README.md" "$BUNDLE/README.md"
cp "$REPO_ROOT/LICENSE" "$BUNDLE/LICENSE"
cp "$REPO_ROOT/CLAUDE.md" "$BUNDLE/CLAUDE.md"
(cd "$TMPDIR" && zip -rq "$DIST_DIR/make-skills-v${VERSION}.zip" "make-skills/" -x "*.DS_Store")
# Stable alias
cp "$DIST_DIR/make-skills-v${VERSION}.zip" "$DIST_DIR/make-skills.zip"

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
