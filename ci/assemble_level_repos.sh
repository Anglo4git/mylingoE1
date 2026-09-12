#!/usr/bin/env bash
set -euo pipefail

# Assemble the six level repositories into the single-origin MYLINGO app.
# The level repositories are source repositories; they are NOT deployed as
# separate Pages sites. This preserves relative URLs, service-worker scope,
# and one shared browser localStorage origin.

SITE_ROOT="${SITE_ROOT:-site}"
LEVELS=(a1 a2 b1 b2 c1 c2)

for level in "${LEVELS[@]}"; do
  SRC="level-repos/$level/$level"
  DEST="$SITE_ROOT/$level"
  if [[ ! -d "$SRC" ]]; then
    echo "ERROR: missing assembled level directory: $SRC" >&2
    exit 1
  fi
  rm -rf "$DEST"
  mkdir -p "$DEST"
  cp -a "$SRC/." "$DEST/"
  echo "Assembled $level -> $DEST"
done

# Fail if an expected runtime entry point is missing.
for level in "${LEVELS[@]}"; do
  test -f "$SITE_ROOT/$level/index.html" || { echo "ERROR: $SITE_ROOT/$level/index.html missing" >&2; exit 1; }
done

test -f "$SITE_ROOT/index.html" || { echo "ERROR: site/index.html missing" >&2; exit 1; }
test -f "$SITE_ROOT/sw.js" || { echo "ERROR: site/sw.js missing" >&2; exit 1; }

echo "MYLINGO seven-repository assembly: PASS"
