#!/usr/bin/env bash
# Test harness for scripts/strip-variants.sh
#
# Verifies:
#   1. Balanced markers: CLI blocks stripped, mcp-only content kept, cli-*.md deleted,
#      other reference files preserved.
#   2. Unbalanced markers: stripper exits non-zero with a clear error.

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FIXTURES="$REPO_ROOT/scripts/fixtures/strip-variants"
STRIPPER="$REPO_ROOT/scripts/strip-variants.sh"

fail() { echo "FAIL: $1" >&2; exit 1; }
pass() { echo "PASS: $1"; }

# Test 1: balanced input
OUTDIR=$(mktemp -d)
trap 'rm -rf "$OUTDIR"' EXIT
bash "$STRIPPER" "$FIXTURES/balanced-input" "$OUTDIR"

# CLI block must be gone
if grep -q 'CLI-only content' "$OUTDIR/skills/example/SKILL.md"; then
  fail "CLI block was not stripped"
fi
# variant:cli markers must be gone
if grep -q 'variant:cli-' "$OUTDIR/skills/example/SKILL.md"; then
  fail "variant:cli markers not removed"
fi
# mcp-only fallback must remain
if ! grep -q 'Fallback text used in both variants' "$OUTDIR/skills/example/SKILL.md"; then
  fail "mcp-only block was incorrectly removed"
fi
# Always-visible content must remain
if ! grep -q 'Always visible' "$OUTDIR/skills/example/SKILL.md"; then
  fail "Always-visible content missing"
fi
if ! grep -q 'The end' "$OUTDIR/skills/example/SKILL.md"; then
  fail "Footer content missing"
fi
# cli-*.md must be deleted
if [ -f "$OUTDIR/skills/example/references/cli-intro.md" ]; then
  fail "cli-intro.md was not deleted"
fi
# non-cli reference must survive
if [ ! -f "$OUTDIR/skills/example/references/mcp-intro.md" ]; then
  fail "mcp-intro.md was incorrectly deleted"
fi
pass "balanced input stripped correctly"

# Test 2: unbalanced input
OUTDIR2=$(mktemp -d)
trap 'rm -rf "$OUTDIR" "$OUTDIR2"' EXIT
if bash "$STRIPPER" "$FIXTURES/unbalanced-input" "$OUTDIR2" 2>/dev/null; then
  fail "stripper did not fail on unbalanced markers"
fi
pass "unbalanced input correctly rejected"

echo ""
echo "All strip-variants tests passed."
