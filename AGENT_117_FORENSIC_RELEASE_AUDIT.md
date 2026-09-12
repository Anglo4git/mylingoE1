# AGENT 117 — Release Candidate Forensic Audit

Anti-blind-spot pass. Previous agents' reports were treated as claims to
verify, not facts — every PASS below is backed by a command run or a file
read in this session, not by trusting the prior agent's own summary line.

## CRITICAL FINDING — a real release blocker was silently dropped

`AGENT_109_CONTENT_EXPANSION.md` documents, in detail, that Agents 96/97
(course-content expansion) could **not** be completed: a real conflict
between new curated course content and the Agent 74 fresh-generation drift
guard (`test_shipped_content_matches_fresh_generation`) was found, the
trial content was reverted, and the report explicitly states:

> RELEASE BLOCKERS: 96/97 content expansion remains genuinely incomplete.
> Do not let a later agent mark it PASS without resolving the drift-guard
> conflict documented above.

`AGENT_110_QUIZ_COVERAGE.md` and `AGENT_111_JOURNEY_INTEGRATION.md` both
explicitly carried this blocker forward ("96/97 expansion remains blocked
as documented by Agent 109"). **Starting at Agent 112, no subsequent
report (112, 113, 114, 115, or this program's own 116) mentions it again.**
My own Agent 116 report last turn stated "RELEASE BLOCKERS: none
identified" — that was wrong; it should have carried this forward. This is
exactly the kind of incomplete handoff this agent exists to catch, and I
am correcting it now: **96/97 remains unresolved and is a release
blocker.** Course/unit/lesson counts are unchanged at 6/19/60 — confirmed
directly (`course_content/{courses,units,lessons}.json`), matching the
reverted state Agent 109 left behind.

## Requirement matrix — 87 through 101

| Req | Evidence | Status | Notes |
|---|---|---|---|
| 87 | `site/shared/js/app-shell.js`, `site/shared/css/app-shell.css` exist; `node --check` clean | PASS | Verified by direct file inspection this session |
| 88 | `app-shell`/`bottom-nav` references confirmed present in all 6 level `index.html` + all 6 `dashboard.html` | PASS | grep-verified |
| 89 | Confirmed present in `courses/index.html`, `course.html`, `lesson.html`, `journey.html` | PASS | grep-verified |
| 90 | Confirmed present in `shared/quiz.html`, `main/placement.html`, `main/index.html`; nav-hide-during-question logic present (`quiz.html` line ~343, ~1016) | PASS | grep-verified; exact hide/show timing not re-tested live (no browser) |
| 91 | `main/index.html`: hero + Continue-card section + level-shortcut section + recommended-courses section (4 sections total); "how it works" mini-flow relocated into hero card, "practice by goal" content lives in `main/practice.html` | PASS | Structurally verified by reading the file; exact "≤1.5 screens" claim not measured on a real viewport |
| 92 | `courses/index.html` renders a card grid with a real `%`-complete bar per course, sourced from `mylingo.progress.v1` — same key `course-progress.js` uses; `main/practice.html` exists | PASS | Verified: no new progress schema invented |
| 93 | `courses/course.html` has `.roadmap`/`.unit`/`unit-completed` CSS + JS building unit nodes from real progress | PASS | Verified by reading source |
| 94 | `AGENT_94_APP_SHELL_COMPLETION.md` present; course-context header logic exists in `quiz.html` | PASS | Doc + source both present |
| 95 | `AGENT_95_100_PARTIAL_COMPLETION.md`: reviewed, tap targets already ≥44px (`.option{min-height:58px}`), no change needed | PASS | Documented review, no regression risk since nothing changed |
| 96 | Course/unit/lesson expansion | **FAIL — BLOCKED** | See Critical Finding above; 6/19/60 unchanged, Agent 109's architectural conflict unresolved |
| 97 | Quiz bank for expanded lessons | **FAIL — BLOCKED** | Downstream of 96; `master_source.csv` still exactly 60 quizzes, 1:1 with lessons, confirmed this session |
| 98 | `main/progress.html` rewritten to a real consolidated view (Attempted/Completed/Avg score, XP, recent activity, per-level %) reading `mylingo.progress.v1` + `mylingo.gamification.v1` directly | PASS | Confirmed via `AGENT_95_100_PARTIAL_COMPLETION.md` + direct read of `progress.html` (level switcher array present) |
| 99 | 327 internal links checked statically, 0 broken; no double nav-injection found | PASS (static only) | No live click-path simulation — no browser available, consistently disclosed |
| 100 | Static a11y sweep done (img alt / icon-btn aria-label / input labels); **`tests/e2e/accessibility.spec.js` and `quiz-flow.spec.js` were NOT extended with bottom-nav-specific assertions** (no `aria-current`, landmark-role, or nav-focus-order checks found by grep this session) | **PARTIAL / GAP** | The general axe-core sweep (main hub, level index, level dashboard, 3 quiz states) would incidentally cover nav markup since the nav is now present on those pages, but the acceptance criterion's explicit ask — nav-specific test coverage — was not added. Not fixed by any later agent either (114/115 cover routes/general a11y, not this specific gap) |
| 101 | Final Integration & Release Gate deliverable `AGENT_101_RELEASE_AUDIT.md` | **FAIL — NOT DELIVERED** | No such file exists in the package (`AGENT_85_RELEASE_AUDIT.md` is a distinct, earlier release audit predating the app-shell program, not a substitute). The 109–116 program has since partially subsumed this function but never produced the specific Agent 101 deliverable |

## Requirement matrix — 109 through 116

| Req | Evidence | Status | Notes |
|---|---|---|---|
| 109 | `AGENT_109_CONTENT_EXPANSION.md` | **FAIL (self-declared)** | Honest, well-documented failure — blocker identified, trial reverted, 0 diff from v108 |
| 110 | `AGENT_110_QUIZ_COVERAGE.md`, "PASS WITH LIMITATION" | PASS WITH LIMITATION | Downstream of 109's blocker, self-disclosed |
| 111 | `AGENT_111_JOURNEY_INTEGRATION.md`, "PASS WITH LIMITATION" | PASS WITH LIMITATION | Carried 96/97 blocker forward correctly |
| 112 | `AGENT_112_QUIZ_SCREEN_AUDIT.md`, "PASS WITH LIMITATION" | PASS WITH LIMITATION | Did not re-mention 96/97 blocker (see Critical Finding) |
| 113 | `AGENT_113_RENDERER_COVERAGE.md`, "PASS WITH LIMITATION" | PASS WITH LIMITATION | Same omission |
| 114 | `AGENT_114_ROUTE_NAVIGATION_AUDIT.md`, "PASS WITH LIMITATION"; 89/89 unit tests at the time (82 prior + 7 new) | PASS WITH LIMITATION | Same omission |
| 115 | `AGENT_115_ACCESSIBILITY_MOBILE.md` + `AGENT_115_OFFLINE_PACK_ROUTE_SCOPING_AUDIT.md`; landscape + 200%-zoom static pass, 0 overflow on 7 pages | PASS WITH LIMITATION (axe-core still unavailable, disclosed) | Same omission |
| 116 | `AGENT_116_SYSTEM_REGRESSION.md`; 105/105 Python tests, 0 forked systems found | PASS, but incorrectly declared "no release blockers" | Corrected by this report |

## Packaging comparison — this candidate vs. the preceding known-good package (v116 input)

Diffed a fresh extraction of the input zip against this session's working
tree (after removing this session's own `__pycache__` build artifacts):

- **ADDED:** `AGENT_116_SYSTEM_REGRESSION.md` (Agent 116's deliverable),
  `AGENT_117_FORENSIC_RELEASE_AUDIT.md` (this file)
- **REMOVED:** none
- **MODIFIED:** none — `BUILD_REPORT.md`'s timestamp line and the offline
  pack `.zip` files initially showed as byte-different after running
  `build.py validate`/extraction in this session; re-checked and reverted:
  `BUILD_REPORT.md` restored byte-identical to the input package, and the
  offline packs were confirmed content-identical (extracted and diffed
  `a1.zip`; same size on all seven, zip-internal timestamp noise only, not
  a real change)
- **UNCHANGED:** all other 426 files (HTML, JS, CSS, course data, quiz
  data, service worker, manifests, shared components)

No generated artifacts (`__pycache__`, `.pyc`) were left in the delivered
package — verified by a final `find . -name __pycache__` sweep before
zipping.

## Missing files / dead code / stale routes / duplicated files

- No missing required artifact found for any *delivered* agent
  (87–95, 98–100 partial, 109–116) beyond the two gaps above.
- No accidentally duplicated files found (single `app-shell.js`/`.css`,
  single quiz engine, single set of course-content JSON files).
- No stale/dead legacy route found in this pass — `site/index.html` root
  stub correctly redirects to `main/index.html` (confirmed by Agent 99 and
  re-checked here); no orphaned dashboard or duplicate nav injection.
- No suspicious size changes in the release candidate itself (see
  packaging comparison above).

## Acceptance criteria status (per Agent 117's own mandate)

Every 87–101 and 109–116 requirement above has one of: verified PASS,
verified FAIL with repair required, or tooling-blocked status with
evidence. No "probably complete" was used.

**Overall: NOT READY for an unqualified final release PASS.** Two
concrete, unresolved items block it:
1. 96/97 course-content expansion — architectural conflict, needs a human
   decision among Agent 109's three documented options (a/b/c).
2. Agent 101's specific deliverable was never produced, and Agent 100's
   nav-specific automated test coverage gap was never closed.

Neither is a regression introduced by this audit — both are pre-existing,
now correctly re-surfaced.

FILES CHANGED: `AGENT_117_FORENSIC_RELEASE_AUDIT.md` (new) — no `site/` or
other source changed; `BUILD_REPORT.md` reverted to its input state after
an incidental timestamp-only change from running verification commands.

NEXT AGENT: 118 — Final Release Gate. Must not declare PASS until 96/97 is
either resolved or formally marked out-of-scope for this release, and
should decide whether Agent 100's nav-specific test gap and Agent 101's
missing deliverable are release-blocking or acceptable-with-justification.
