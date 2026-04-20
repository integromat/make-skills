#!/usr/bin/env bash
# Copy a skills tree to a destination, stripping CLI-only content:
#   1. Remove blocks between <!-- variant:cli-start --> and <!-- variant:cli-end -->.
#   2. Leave <!-- variant:mcp-only-start --> and <!-- variant:mcp-only-end --> markers
#      in place but remove just the marker lines (content between is kept).
#   3. Delete any references/cli-*.md files.
#
# Fails with a clear error if any SKILL.md has unbalanced variant markers.
#
# Usage: strip-variants.sh <src-dir> <dest-dir>

set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <src-dir> <dest-dir>" >&2
  exit 2
fi

SRC="$1"
DEST="$2"

if [ ! -d "$SRC" ]; then
  echo "Error: source directory does not exist: $SRC" >&2
  exit 2
fi

rm -rf "$DEST"
mkdir -p "$DEST"
cp -r "$SRC/." "$DEST/"

# Check marker balance across all SKILL.md files.
check_balance() {
  local file="$1"
  awk '
    /<!-- variant:cli-start -->/  { cli++ }
    /<!-- variant:cli-end -->/    { cli-- }
    /<!-- variant:mcp-only-start -->/ { mcp++ }
    /<!-- variant:mcp-only-end -->/   { mcp-- }
    END {
      if (cli != 0) { print "unbalanced variant:cli markers (net " cli ")"; exit 1 }
      if (mcp != 0) { print "unbalanced variant:mcp-only markers (net " mcp ")"; exit 1 }
    }
  ' "$file"
}

errors=0
while IFS= read -r -d '' f; do
  if ! out=$(check_balance "$f" 2>&1); then
    echo "Error: $f: $out" >&2
    errors=$((errors + 1))
  fi
done < <(find "$DEST" -name 'SKILL.md' -print0)

if [ "$errors" -ne 0 ]; then
  echo "Aborting: $errors file(s) have unbalanced variant markers." >&2
  exit 1
fi

# Strip CLI blocks (including the marker lines themselves).
# Also strip only the mcp-only marker lines, keeping the content inside.
while IFS= read -r -d '' f; do
  awk '
    /<!-- variant:cli-start -->/ { in_cli = 1; next }
    /<!-- variant:cli-end -->/   { in_cli = 0; next }
    /<!-- variant:mcp-only-start -->/ { next }
    /<!-- variant:mcp-only-end -->/   { next }
    { if (!in_cli) print }
  ' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
done < <(find "$DEST" -name 'SKILL.md' -print0)

# Delete cli-*.md reference files.
find "$DEST" -type f -path '*/references/cli-*.md' -delete

echo "Stripped CLI content from $DEST"
