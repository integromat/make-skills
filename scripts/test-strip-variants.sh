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
TMPBASE1=$(mktemp -d)
OUTDIR="$TMPBASE1/out"
trap 'rm -rf "$TMPBASE1"' EXIT
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
TMPBASE2=$(mktemp -d)
OUTDIR2="$TMPBASE2/out"
trap 'rm -rf "$TMPBASE1" "$TMPBASE2"' EXIT
ERR_OUTPUT=""
if ERR_OUTPUT=$(bash "$STRIPPER" "$FIXTURES/unbalanced-input" "$OUTDIR2" 2>&1); then
  fail "stripper did not fail on unbalanced markers"
fi
if ! printf '%s\n' "$ERR_OUTPUT" | grep -Eq 'unbalanced variant:|unexpected variant:'; then
  fail "stripper did not emit the expected variant-marker error (got: $ERR_OUTPUT)"
fi
pass "unbalanced input correctly rejected with clear error"

# Test 3: destination inside source directory must be rejected (even when it doesn't exist yet)
NESTED_DEST="$FIXTURES/balanced-input/nested-out-$$"
ERR_OUTPUT=""
if ERR_OUTPUT=$(bash "$STRIPPER" "$FIXTURES/balanced-input" "$NESTED_DEST" 2>&1); then
  rm -rf "$NESTED_DEST"
  fail "stripper did not reject destination inside source directory"
fi
rm -rf "$NESTED_DEST"
if ! printf '%s\n' "$ERR_OUTPUT" | grep -q 'inside the source directory'; then
  fail "stripper did not emit expected 'inside the source directory' error (got: $ERR_OUTPUT)"
fi
pass "destination inside source directory correctly rejected"

# Test 4: nested CLI markers strip the full block — no content leakage between the inner
# cli-end and the outer cli-end. Guards against the old boolean-flag logic.
TMPBASE3=$(mktemp -d)
OUTDIR3="$TMPBASE3/out"
trap 'rm -rf "$TMPBASE1" "$TMPBASE2" "$TMPBASE3"' EXIT
bash "$STRIPPER" "$FIXTURES/nested-input" "$OUTDIR3"

if grep -qE 'Outer CLI|Inner CLI|LEAKS' "$OUTDIR3/skills/example/SKILL.md"; then
  fail "nested CLI block leaked content (boolean flag regression)"
fi
if grep -q 'variant:cli-' "$OUTDIR3/skills/example/SKILL.md"; then
  fail "nested variant:cli markers were not removed"
fi
if ! grep -q 'Keep this (MCP)' "$OUTDIR3/skills/example/SKILL.md"; then
  fail "MCP content before nested block was dropped"
fi
if ! grep -q 'Keep this too (MCP)' "$OUTDIR3/skills/example/SKILL.md"; then
  fail "MCP content after nested block was dropped"
fi
pass "nested CLI markers stripped without leakage"

# Test 5: DEST="." must be rejected before any filesystem mutation.
ERR_OUTPUT=""
if ERR_OUTPUT=$(bash "$STRIPPER" "$FIXTURES/balanced-input" "." 2>&1); then
  fail "stripper did not reject DEST='.'"
fi
if ! printf '%s\n' "$ERR_OUTPUT" | grep -q "refusing to use '.' or '..'"; then
  fail "stripper did not emit expected dot-dest error (got: $ERR_OUTPUT)"
fi
pass "DEST='.' correctly rejected"

# Test 6: DEST that resolves to CWD must be rejected.
ERR_OUTPUT=""
if ERR_OUTPUT=$(bash "$STRIPPER" "$FIXTURES/balanced-input" "$PWD" 2>&1); then
  fail "stripper did not reject DEST equal to CWD"
fi
if ! printf '%s\n' "$ERR_OUTPUT" | grep -q 'current working directory'; then
  fail "stripper did not emit expected CWD-guard error (got: $ERR_OUTPUT)"
fi
pass "destination equal to CWD correctly rejected"

# Test 7: existing destination must be rejected so a stray invocation can't rm -rf
# a real directory. Covers the safety contract documented in the usage header.
EXISTING_DEST=$(mktemp -d)
trap 'rm -rf "$TMPBASE1" "$TMPBASE2" "$TMPBASE3" "$EXISTING_DEST"' EXIT
ERR_OUTPUT=""
if ERR_OUTPUT=$(bash "$STRIPPER" "$FIXTURES/balanced-input" "$EXISTING_DEST" 2>&1); then
  fail "stripper did not reject an existing destination"
fi
if ! printf '%s\n' "$ERR_OUTPUT" | grep -q 'destination already exists'; then
  fail "stripper did not emit expected 'destination already exists' error (got: $ERR_OUTPUT)"
fi
# Existing dest must be untouched.
if [ ! -d "$EXISTING_DEST" ]; then
  fail "existing destination was deleted by stripper"
fi
pass "existing destination correctly rejected"

echo ""
echo "All strip-variants tests passed."
