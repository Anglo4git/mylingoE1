#!/usr/bin/env bash
set -euo pipefail

INPUT_PATH="${INPUT_PATH:-master_source.csv}"
SRC_ROOT="${SRC_ROOT:-site}"
BUILD_DIR="${BUILD_DIR:-dist-release}"

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

python3 build.py validate --input "$INPUT_PATH"

# Runtime JavaScript syntax gate: check every production .js/.mjs/.cjs file
# shipped from the source tree. Vendored/minified assets are intentionally
# excluded because they are third-party/generated files shipped unchanged.
# node --check parses without executing application code.
mapfile -t JS_FILES < <(find "$SRC_ROOT" -type f \
  \( -name '*.js' -o -name '*.mjs' -o -name '*.cjs' \) \
  ! -path '*/vendor/*' ! -path '*/vendors/*' ! -path '*/node_modules/*' \
  ! -name '*.min.js' ! -name '*.min.mjs' ! -name '*.min.cjs' \
  | sort)
for js_file in "${JS_FILES[@]}"; do
  node --check "$js_file" >/dev/null
done

python3 content_qa.py --input "$INPUT_PATH" --out-dir "$BUILD_DIR/content_qa" --strict
python3 build.py build \
  --input "$INPUT_PATH" \
  --out "$BUILD_DIR" \
  --src-root "$SRC_ROOT" \
  --report "$BUILD_DIR/BUILD_REPORT.md"

touch "$BUILD_DIR/.nojekyll"
python3 build.py verify-output --out "$BUILD_DIR"
python3 build.py release-gate \
  --input "$INPUT_PATH" \
  --site "$BUILD_DIR" \
  --report "$BUILD_DIR/RELEASE_GATE_REPORT.md"

# Automated accessibility audit (axe-core), against the exact freshly built
# artifact that just passed the release gate above — not the working tree.
# Critical/serious findings are always blocking; moderate/minor remain
# report-only unless explicitly enabled via MYLINGO_A11Y_BLOCKING_MODERATE_MINOR.
# A missing report is a gate failure so "not run" cannot be mistaken for verified.
A11Y_DIR="${BUILD_DIR}-a11y-report"
MYLINGO_SITE_DIR="$BUILD_DIR" \
MYLINGO_A11Y_REPORT_DIR="$A11Y_DIR" \
  npx playwright test tests/e2e/accessibility.spec.js --project=chromium

if [[ ! -s "$A11Y_DIR/ACCESSIBILITY_REPORT.md" || ! -s "$A11Y_DIR/accessibility_report.json" ]]; then
  echo "Accessibility gate failed: browser audit did not produce a complete report (status is not-run/unknown)." >&2
  exit 1
fi

# Core learner-journey E2E (quiz taking, score saving, gamification, audio
# controls, offline navigation), against the exact same freshly built,
# release-gated artifact — not the working tree. Kept as a separate
# Playwright invocation from the accessibility audit above (different
# spec file, different pass/fail meaning), same pattern already used for
# a11y. Unlike accessibility, this is BLOCKING by design: it exercises
# core product functionality, not a report-only signal. release_gate.sh
# runs under `set -euo pipefail`, so a non-zero exit here already stops
# this script — and therefore the CI job — before any deploy step runs.
# Runs both configured projects (chromium + mobile-safari) since the spec
# covers mobile viewport/touch behavior too.
MYLINGO_SITE_DIR="$BUILD_DIR" \
  npx playwright test tests/e2e/quiz-flow.spec.js

# Bounded scale-throughput regression gate (Agent 66): re-runs Agent 65's
# dependency-free harness on a small synthetic row count (fast in CI, no
# repository content touched, temp fixture is self-deleting) and blocks
# release only if source-validation throughput has collapsed well below
# what the 1,200,000-question target needs. The default floor is set far
# below any measured throughput so ordinary hardware/CI variance never
# trips it; it exists to catch an accidental quadratic-time or
# whole-dataset-in-memory regression, not to track day-to-day performance.
SCALE_BENCH_REPORT="${BUILD_DIR}/SCALE_BENCHMARK.json"
python3 scripts/scale_benchmark.py --rows "${MYLINGO_SCALE_BENCH_ROWS:-3000}" > "$SCALE_BENCH_REPORT"
cat "$SCALE_BENCH_REPORT"
python3 - "$SCALE_BENCH_REPORT" "${MYLINGO_MIN_ROWS_PER_SEC:-500}" <<'PYEOF'
import json, sys
report_path, min_rate = sys.argv[1], float(sys.argv[2])
with open(report_path, encoding="utf-8") as f:
    r = json.load(f)
if r["rows_per_second"] < min_rate:
    print(f"Scale throughput gate failed: {r['rows_per_second']} rows/sec "
          f"is below the minimum {min_rate} rows/sec.", file=sys.stderr)
    sys.exit(1)
print(f"Scale throughput gate: PASS ({r['rows_per_second']} rows/sec "
      f">= {min_rate} rows/sec floor)")
PYEOF

printf '\nRelease artifact ready: %s\n' "$BUILD_DIR"
printf 'Accessibility report: %s\n' "$A11Y_DIR/ACCESSIBILITY_REPORT.md"
printf 'Core quiz-flow E2E: PASSED (blocking)\n'
