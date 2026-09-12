# Mylingo — QA Report (Agent 5)

Scope: full QA pass against everything Agents 1–4 produced. All tests below were run
against the actual generated `site/` (not mocked) using a local static file server
plus Playwright/Chromium for real clicks, keyboard input, and mobile emulation.

## 1. Generator / data integrity

- `python3 build.py validate --input master_source.csv` → **60 rows, 60 quizzes, 0 errors, 0 warnings.**
- Re-ran `python3 build.py build` into a scratch directory and diffed every generated
  manifest and quiz JSON file against what's currently in `site/`: **zero differences**
  across all six levels. Agent 4's UX pass did not touch any generated data file.
- Deep cross-validation script checked, for all six levels: every `quizzes.json`
  manifest entry resolves to a real file; no duplicate IDs; manifest `id`/`level`/
  `questions` count matches the actual quiz file; every question has 2–9 answers
  and an in-range `correctIndex`; no empty question text. **Result: 0 issues found
  across all 60 quizzes.**

## 2. Link integrity

- Scanned all 14 HTML files (main hub, 6 catalogs, 6 dashboards, shared runtime)
  for internal `href` links and resolved each one against the filesystem.
  **Result: 0 broken links.**

## 3. Functional QA — all 60 quiz samples, all 6 levels

- Every one of the 60 generated quizzes (10 per level × 6 levels — not just A1) was
  loaded, started, answered, and completed end-to-end via real browser automation.
  **Result: all 60 completed cleanly with no JavaScript errors and a valid score.**

## 4. Edge cases (explicitly called out in Agent 4's handoff)

| Case | Result |
|---|---|
| Malformed JSON (`{ this is not valid json ]`) | Correctly caught before render; shows "Quiz data error" state, not a raw parse crash. |
| Schema-invalid quiz (`correctIndex` out of range) | Correctly caught by client-side validation; distinct error state, not a broken quiz. |
| Missing `?quiz=` parameter | Shows "Missing quiz" error state with a way back, no blank page. |
| Nonexistent quiz id (real 404) | Shows "Quiz not found" with the actual HTTP status, no raw error text. |
| Refresh mid-quiz | Returns cleanly to the start screen; no JS errors, no stuck loading state. |
| Simulated network failure + Retry | Shows "Connection problem" with a working Retry button; retry succeeds once the network call is unblocked. |
| Placement recommendation at the A1 floor | Verified with a deliberately wrong first answer (0% score): correctly says "A1 looks like a good fit" rather than suggesting a nonexistent level below A1. |
| Placement recommendation at the C2 ceiling | Verified with a correct answer (100% score): correctly stays at "good fit," does not suggest a nonexistent level above C2. |

## 5. Mobile

Checked with real iPhone 13 device emulation (390px viewport):
- Main hub, A1 catalog, and the quiz runtime: no horizontal overflow on any of them.
- "Start Quiz" button: 131×48px (meets the 44px minimum touch target).
- Answer options: 358×58px (comfortably above minimum).

## 6. Accessibility (manual + automated interaction, no axe/lighthouse run)

- Keyboard-only completion of a quiz verified (number-key answer selection, no mouse).
- Arrow-key roving-tabindex navigation between answer options present and functional.
- Focus moves to the next actionable element after answering, after quiz completion,
  and on error states (verified via Playwright's DOM inspection, not just visual read).
- `aria-live` regions confirmed present for the question counter, feedback, and result.
- **Not done:** an automated axe-core or Lighthouse accessibility audit. Recommend running
  one before a public launch — this pass verified interaction patterns, not WCAG conformance.

## 7. Deployment-topology finding — see DEPLOYMENT.md

The single most important finding from this pass is **not a bug in the code** — it's an
architecture decision that hasn't been made yet. See "Cross-repo linking" in
`DEPLOYMENT.md`. Short version: everything in this report was verified as **one origin**
(one repo / one deployed site with subfolders). The "six separate GitHub repos" idea
floated early in this project's chat history will **break relative links** (`../shared/quiz.html`,
`../a1/index.html`, etc.) unless one of the mitigations in `DEPLOYMENT.md` is applied first.
This needs a decision before deploy — it is not something QA can "fix" by itself.

## Known issues carried forward (not blocking, tracked for future work)

1. **Manifest `date` field is a fixed placeholder** (from Agent 3's handoff — unchanged).
2. **No image/audio schema fields in production content yet** — runtime supports an
   optional `imageUrl` if present, but no current quiz uses it.
3. **No true adaptive placement test** — the current placement hook demonstrates the
   routing mechanism using existing sample quizzes, not a purpose-built assessment.
4. **No automated accessibility audit tool was run** (see section 6).

## Verdict

**READY WITH WARNINGS.**

The application itself — runtime, all 60 samples across all six levels, error handling,
mobile behavior, and the progress/dashboard system — passed every functional test in
this pass with zero failures. The "warnings" are entirely about the **deployment
topology decision** in `DEPLOYMENT.md`, which must be resolved (it's a five-minute
decision, not a code fix) before this goes live as six separate repos. If deployed as
a single origin (recommended path in `DEPLOYMENT.md`), there are no known blockers.
