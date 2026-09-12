# Mylingo — Deployment Guide (Agent 5)

## Deployment topology for this codebase version: single-origin is mandatory

This codebase version relies entirely on relative links and per-origin `localStorage`.
**Single-origin deployment is mandatory, not just recommended**, unless one of the two
mitigations below is applied first. Deploying to six separate repos without a mitigation
will break navigation and silently split each learner's progress data by level.

## Recommended topology: one origin

Every link in this codebase is **relative** (`../shared/quiz.html`, `../a1/index.html`,
`./quizzes.json`, etc.). This was the right call for a manifest-first, JSON-driven
architecture (Agent 1's decision, preserved through Agents 2–4) — but it means the
whole thing needs to be served from **one origin** (one domain, with subfolders) for
every relative link to resolve.

**Recommended:** deploy `site/` as a single GitHub Pages site (one repo, or the `site/`
folder of a monorepo) with this structure at the served root:

```
https://<user>.github.io/mylingo/
  main/index.html
  a1/  a2/  b1/  b2/  c1/  c2/
  shared/quiz.html
```

This is exactly the current folder layout — deploy `site/` as-is and every relative
link works with no changes.

## If you still want six separate repos (from the original project plan)

The early planning discussion proposed `mylingo-main`, `mylingo-a1` … `mylingo-c2` as
six independent GitHub repos, each its own Pages site. **This breaks as-is:** if
`mylingo-a1` is deployed at `https://<user>.github.io/mylingo-a1/`, that repo's root
*is* the origin's `/mylingo-a1/` path — there is no `/shared/` folder one level up on
that same domain, so every `../shared/quiz.html` link in `a1/index.html`,
`a1/dashboard.html`, and the placement links in `main/index.html` will 404.

Verified directly: serving `mylingo-a1`'s contents as its own repo root while `shared/`
sits outside it reproduces exactly this failure once the two are no longer siblings
under one origin.

Two ways to make six separate repos work:

1. **Duplicate `shared/quiz.html` into every level repo** and change each level's links
   from `../shared/quiz.html` to `./shared/quiz.html` (i.e., make `shared` a subfolder
   of each level repo, not a sibling). Simple, but means six copies of the runtime to
   keep in sync — pick this only if the repos genuinely need to be release-independent.
2. **Point every level at one centrally-hosted `shared/quiz.html`** by using an absolute
   URL (e.g. `https://<user>.github.io/mylingo-shared/quiz.html?quiz=...`) instead of a
   relative one. Requires one more repo (`mylingo-shared`) but keeps one runtime.

Either way, this is a decision to make **before** deploying six repos — it is not
something that can be patched after the fact without touching every level's HTML.

## Cross-origin progress (flagged since Agent 1, still open)

`localStorage` is per-origin. If levels are deployed as separate origins (option 1 or 2
above), a learner's `mylingo.progress.v1` data in the A1 app will **not** be visible to
the A2 app, the dashboard, or the main hub — each origin keeps its own copy.

- **Single-origin deployment (recommended path, above): this is a non-issue.** One
  origin, one `localStorage`, progress is already shared correctly across the six
  level folders — verified in QA.
- **Multi-origin deployment:** the placement-routing hook (Agent 4) currently only
  passes a redirect *URL* across origins, not the score itself. If cross-level score
  continuity is required with separate origins, either (a) append the score to the
  redirect URL and have the destination page read it, or (b) introduce a backend/shared
  storage. Out of scope for this pass; flagging the decision point clearly.

## Pre-deploy checklist

- [ ] Decide topology: one origin (recommended) vs. six repos + one of the two mitigations above.
- [ ] If single origin: deploy `site/` as-is, no changes needed.
- [ ] If six repos: apply mitigation 1 or 2 above **before** deploying, and update
      `main/index.html`'s six level links + six placement sample links from relative
      paths to the real deployed URLs (the file already has a note marking exactly
      where to do this).
- [ ] Re-run `python3 build.py validate` after any future content changes to
      `master_source.csv` before regenerating.
- [ ] Confirm HTTPS is enabled (GitHub Pages does this by default) — `localStorage`
      behaves normally either way, but mixed content would break image support if any
      quiz later adds an `http://` `imageUrl`.
- [ ] No environment variables, secrets, or backend config exist in this codebase —
      nothing else to provision. This remains a fully static, no-backend deployment.

## What does NOT need to change for deployment

- No build step is required at deploy time beyond what Agent 3's `build.py` already
  does at content-authoring time — `site/` is deployable static output as-is.
- No server-side code, API keys, or environment configuration exists anywhere in this
  project.
