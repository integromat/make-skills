#!/usr/bin/env bash
# Copy a skills tree to a destination, stripping CLI-only content:
#   1. Remove blocks between <!-- variant:cli-start --> and <!-- variant:cli-end -->.
#   2. Keep the content between <!-- variant:mcp-only-start --> and
#      <!-- variant:mcp-only-end -->, but remove the marker lines themselves.
#   3. Delete any cli-*.md files anywhere under the destination tree.
#
# Fails with a clear error if any .md file has unbalanced variant markers.
#
# Usage: strip-variants.sh <src-dir> <dest-dir>
#   <dest-dir> must not already exist — the script creates it. This keeps a
#   stray invocation (e.g. `… /tmp`) from `rm -rf`ing an existing directory.

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

case "$DEST" in
  "." | ".." | "./" | "../")
    echo "Error: refusing to use '.' or '..' as destination" >&2
    exit 2
    ;;
esac

SRC_ABS="$(cd "$SRC" && pwd -P)"
CWD_ABS="$(pwd -P)"

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

if [ "$DEST_ABS" = "$CWD_ABS" ]; then
  echo "Error: destination must not resolve to the current working directory" >&2
  exit 2
fi

case "$DEST_ABS/" in
  "$SRC_ABS"/*)
    echo "Error: destination must not be inside the source directory: $DEST_ABS" >&2
    exit 2
    ;;
esac

if [ -e "$DEST" ]; then
  echo "Error: destination already exists; pass a non-existent path: $DEST" >&2
  exit 2
fi

mkdir "$DEST"
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
done < <(find "$DEST" -type f -name '*.md' -print0)

if [ "$errors" -ne 0 ]; then
  echo "Aborting: $errors file(s) have unbalanced variant markers." >&2
  exit 1
fi

# Strip CLI blocks (including the marker lines themselves). Uses a depth counter so
# nested CLI markers — permitted by the balance check above — strip correctly.
# Also strip only the mcp-only marker lines, keeping the content inside.
while IFS= read -r -d '' f; do
  awk '
    /<!-- variant:cli-start -->/ { cli_depth++; next }
    /<!-- variant:cli-end -->/   { cli_depth--; next }
    /<!-- variant:mcp-only-start -->/ { next }
    /<!-- variant:mcp-only-end -->/   { next }
    { if (cli_depth == 0) print }
  ' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
done < <(find "$DEST" -type f -name '*.md' -print0)

# Delete any cli-*.md file anywhere inside a skill tree, not just under references/,
# so CLI-only docs in sibling subdirs (examples/, guides/, …) don't leak into ZIPs.
find "$DEST" -type f -name 'cli-*.md' -delete

echo "Stripped CLI content from $DEST"
