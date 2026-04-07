#!/usr/bin/env bash
# Build script for make-skills distribution packages
# Creates zip files for Claude Desktop/Claude.ai (individual skills) and Claude Code (bundle)

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$REPO_ROOT/dist"
VERSION=$(grep '"version"' "$REPO_ROOT/.claude-plugin/plugin.json" | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/')

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
    TMPDIR=$(mktemp -d)
    cp -r "$REPO_ROOT/skills/$skill" "$TMPDIR/$skill"
    (cd "$TMPDIR" && zip -rq "$DIST_DIR/${skill}-v${VERSION}.zip" "$skill/" -x "*.DS_Store")
    rm -rf "$TMPDIR"
done

# Build complete bundle (for Claude Code)
echo "Building complete bundle..."

TMPDIR=$(mktemp -d)
BUNDLE="$TMPDIR/make-skills"
mkdir -p "$BUNDLE"
cp -r "$REPO_ROOT/.claude-plugin" "$BUNDLE/.claude-plugin"
cp -r "$REPO_ROOT/skills" "$BUNDLE/skills"
cp "$REPO_ROOT/.mcp.json" "$BUNDLE/.mcp.json"
cp "$REPO_ROOT/README.md" "$BUNDLE/README.md"
cp "$REPO_ROOT/LICENSE" "$BUNDLE/LICENSE"
cp "$REPO_ROOT/CLAUDE.md" "$BUNDLE/CLAUDE.md"
(cd "$TMPDIR" && zip -rq "$DIST_DIR/make-skills-v${VERSION}.zip" "make-skills/" -x "*.DS_Store")
rm -rf "$TMPDIR"

# Results
echo ""
echo "Build complete! Files in dist/:"
echo ""
echo "Individual skills (Claude Desktop / Claude.ai):"
for skill in "${SKILLS[@]}"; do
    SIZE=$(du -h "$DIST_DIR/${skill}-v${VERSION}.zip" | cut -f1)
    echo "  ${skill}-v${VERSION}.zip  ${SIZE}"
done
echo ""
echo "Complete bundle (Claude Code):"
SIZE=$(du -h "$DIST_DIR/make-skills-v${VERSION}.zip" | cut -f1)
echo "  make-skills-v${VERSION}.zip  ${SIZE}"
