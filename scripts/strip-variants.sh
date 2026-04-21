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

if [ -z "$DEST" ] || [ "$DEST" = "/" ]; then
  echo "Error: refusing to use empty path or / as destination" >&2
  exit 2
fi

SRC_ABS="$(cd "$SRC" && pwd -P)"

DEST_PARENT="$(dirname "$DEST")"
if [ ! -d "$DEST_PARENT" ]; then
  echo "Error: destination parent directory does not exist: $DEST_PARENT" >&2
  exit 2
fi
DEST_ABS="$(cd "$DEST_PARENT" && pwd -P)/$(basename "$DEST")"

if [ "$DEST_ABS" = "/" ] || [ "$DEST_ABS" = "$SRC_ABS" ]; then
  echo "Error: destination must not resolve to / or the source directory" >&2
  exit 2
fi

case "$DEST_ABS/" in
  "$SRC_ABS"/*)
    echo "Error: destination must not be inside the source directory: $DEST_ABS" >&2
    exit 2
    ;;
esac

rm -rf "$DEST"
mkdir -p "$DEST"
cp -r "$SRC/." "$DEST/"

# Check marker balance across all SKILL.md files. Fails fast on an end marker
# without a matching start so we catch malformed ordering, not just net counts.
check_balance() {
  local file="$1"
  awk '
    /<!-- variant:cli-start -->/      { cli++; next }
    /<!-- variant:cli-end -->/ {
      if (cli == 0) { print "unexpected variant:cli-end at line " NR; exit 1 }
      cli--; next
    }
    /<!-- variant:mcp-only-start -->/ { mcp++; next }
    /<!-- variant:mcp-only-end -->/ {
      if (mcp == 0) { print "unexpected variant:mcp-only-end at line " NR; exit 1 }
      mcp--; next
    }
    END {
      if (cli != 0) { print "unbalanced variant:cli markers: EOF reached with " cli " open block(s)"; exit 1 }
      if (mcp != 0) { print "unbalanced variant:mcp-only markers: EOF reached with " mcp " open block(s)"; exit 1 }
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
