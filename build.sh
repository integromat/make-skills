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
DIST_DIR="$REPO_ROOT/dist"
VERSION=$(grep '"version"' "$REPO_ROOT/.claude-plugin/plugin.json" | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/')

# Cleanup temp dirs on exit/error/interrupt
_CLEANUP_DIRS=()
cleanup() {
  for d in "${_CLEANUP_DIRS[@]}"; do rm -rf "$d" 2>/dev/null; done
}
trap cleanup EXIT

SKILLS=(
    "make-scenario-building"
    "make-module-configuring"
    "make-interface-reference"
)

echo "Building make-skills distribution packages v${VERSION}..."
echo ""

# Clean and create dist/
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Strip CLI content from a copy of skills/ for MCP-only ZIPs
echo "Stripping CLI content for MCP-only ZIPs..."
STRIP_DIR=$(mktemp -d "${TMPDIR:-/tmp}/make-skills.XXXXXX")
_CLEANUP_DIRS+=("$STRIP_DIR")
bash "$REPO_ROOT/scripts/strip-variants.sh" "$REPO_ROOT/skills" "$STRIP_DIR/skills"
echo ""

# Build individual skill zips (for Claude Desktop / Claude.ai)
# Structure: skill-name/ at zip root
echo "Building individual skill zips..."

for skill in "${SKILLS[@]}"; do
    echo "  - $skill"
    TMPDIR_PKG=$(mktemp -d "${TMPDIR:-/tmp}/make-skills.XXXXXX")
    _CLEANUP_DIRS+=("$TMPDIR_PKG")
    cp -r "$STRIP_DIR/skills/$skill" "$TMPDIR_PKG/$skill"
    (cd "$TMPDIR_PKG" && zip -rq "$DIST_DIR/${skill}-v${VERSION}.zip" "$skill/" -x "*.DS_Store")
    # Stable alias (version-free) so docs don't 404 after a bump
    cp "$DIST_DIR/${skill}-v${VERSION}.zip" "$DIST_DIR/${skill}.zip"
done

# Deprecated alias for the old skill name (make-mcp-reference → make-interface-reference).
# Preserves the pre-rename dist/make-mcp-reference.zip URL so existing bookmarks don't 404.
# Content is identical to make-interface-reference.zip. Remove once consumers have migrated.
echo "  - make-mcp-reference (deprecated alias for make-interface-reference)"
cp "$DIST_DIR/make-interface-reference-v${VERSION}.zip" "$DIST_DIR/make-mcp-reference-v${VERSION}.zip"
cp "$DIST_DIR/make-interface-reference.zip" "$DIST_DIR/make-mcp-reference.zip"

# Build complete bundle (for Claude Desktop / Claude.ai — MCP-only, manual download)
echo "Building complete bundle..."

TMPDIR_BUNDLE=$(mktemp -d "${TMPDIR:-/tmp}/make-skills.XXXXXX")
_CLEANUP_DIRS+=("$TMPDIR_BUNDLE")
BUNDLE="$TMPDIR_BUNDLE/make-skills"
mkdir -p "$BUNDLE"
cp -r "$REPO_ROOT/.claude-plugin" "$BUNDLE/.claude-plugin"
cp -r "$STRIP_DIR/skills" "$BUNDLE/skills"
cp "$REPO_ROOT/.mcp.json" "$BUNDLE/.mcp.json"
cp "$REPO_ROOT/README.md" "$BUNDLE/README.md"
cp "$REPO_ROOT/LICENSE" "$BUNDLE/LICENSE"
cp "$REPO_ROOT/CLAUDE.md" "$BUNDLE/CLAUDE.md"
(cd "$TMPDIR_BUNDLE" && zip -rq "$DIST_DIR/make-skills-v${VERSION}.zip" "make-skills/" -x "*.DS_Store")
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
SIZE=$(du -h "$DIST_DIR/make-mcp-reference-v${VERSION}.zip" | cut -f1)
echo "  make-mcp-reference-v${VERSION}.zip  ${SIZE}  (deprecated alias)"
echo "  make-mcp-reference.zip  (deprecated alias, stable)"
echo ""
echo "Complete bundle (MCP-only, for manual Claude Code install without make-cli):"
SIZE=$(du -h "$DIST_DIR/make-skills-v${VERSION}.zip" | cut -f1)
echo "  make-skills-v${VERSION}.zip  ${SIZE}"
echo "  make-skills.zip  (stable alias)"
