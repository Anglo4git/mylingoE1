# DEPLOY.md — Hosting decision & config

## Host chosen: Netlify

### Why Netlify over the alternatives
No existing account/preference was on record (confirmed in STATE.md), so this is a default pick, not a user decision — documented here per Step 2's instructions, and easy to override if the user has a different preference.

Considered:
- **Netlify** — zero-config for a pure static tree (no build step needed, matches this app exactly), free tier includes PR/branch preview deploys out of the box (which Step 3 needs anyway), header/redirect config lives in one `netlify.toml` file, first-class rollback (instant "publish an old deploy" from the dashboard).
- **Vercel** — comparable feature set to Netlify; leans more toward framework-aware builds (Next.js etc.), which this app doesn't use, so no real edge over Netlify here.
- **GitHub Pages** — simplest possible option and free, but weaker built-in support for custom headers (needs a workaround) and no native PR preview deploys — Step 3 would need to build that itself via Actions.
- **Cloudflare Pages** — very close second choice; excellent free tier and headers support via `_headers` file. Netlify was picked mainly for its more mature preview-deploy UX, but this is a close call and easy to swap later since the config style is similar.

**None of these accounts exist yet.** This step produces the config file the repo needs; it does not and cannot create the Netlify account or connect the domain, since:
- This tool environment has **no network egress** (confirmed: bash tool network access is disabled), so no API calls to Netlify/GitHub/anywhere are possible from here.
- Account creation and repo-to-host connection are actions only the project owner can take (they require login credentials this session doesn't have and shouldn't have).

### What's committed this step
- `netlify.toml` — publish directory (`.`, repo root — matches `start_url: "./index.html"` in manifest.json), no build command (confirmed no build step exists), and a conservative cache-header baseline. Full header/security policy is Step 5's job; these are just sane-enough defaults so Step 2 doesn't block on Step 5.

### What the project owner needs to do outside this environment
1. Create a Netlify account (or confirm an existing one).
2. Push this tree to a git repository (GitHub/GitLab/Bitbucket — Netlify can connect to any of these). **This is a hard prerequisite this environment can't satisfy either** — there's no `.git` directory in the tree yet (confirmed in STATE.md), so "push to a repo" first requires `git init` + a remote, which itself requires deciding *which* git host. That decision is bundled into this step's scope but its execution (creating the actual GitHub/GitLab repo, authenticating, pushing) is likewise outside what a no-network sandboxed tool can do.
3. Connect the repo to Netlify, point it at this `netlify.toml`.
4. Come back here (or hand this repo to the next agent) for Step 3 (CI wiring) and Step 4 (domain/TLS).

### Rollback path (documented per Step 3's requirement, noted early since it's host-driven)
Netlify keeps every deploy and lets you instantly roll back to any prior one from the dashboard ("Deploys" tab → select a prior deploy → "Publish deploy"). No CLI or code change needed for a rollback once the site is connected. This will be re-confirmed with an actual screenshot once a real deploy exists (Step 3).

## STEP 3 — CI / deploy pipeline (Agent 3)

### What's committed
`.github/workflows/deploy.yml` — GitHub Actions workflow with three jobs:
- **test** — runs on every push and PR; `node tools/verify-all.js --quick` (no `npm install` needed — no dependencies exist). This runs the unit suite, the CSP staleness check, and the dist byte-identity check; `--quick` skips the CSP+service-worker+offline sweep, which needs Playwright (a browser download deliberately kept out of CI — run it locally before pushing instead, see the "Local release gate" section below). This is the gate: both deploy jobs declare `needs: test`, so a failing test job blocks any deploy from starting.
- **deploy-preview** — runs only on pull requests, after `test` passes; publishes a Netlify preview deploy (`production-deploy: false`) tagged with the PR number.
- **deploy-production** — runs only on a push to `main`, after `test` passes; publishes a production Netlify deploy.

### Chosen approach: GitHub Actions + GitHub host
Assumed GitHub as the git host (most common default, best first-party Netlify Actions support via `nwtgck/actions-netlify`). **Not yet a confirmed decision** — flagged as decision-gated below if the user wants GitLab/Bitbucket instead, which would need a different CI file (GitLab CI YAML or Bitbucket Pipelines) using the same test-then-deploy shape.

### This has NEVER actually run
Hard truth, stated per the protocol's "never claim a result you did not observe" rule: this workflow file has not executed even once, because:
- No git repository exists yet with this file pushed to it.
- No `NETLIFY_AUTH_TOKEN` / `NETLIFY_SITE_ID` repository secrets exist, because no Netlify site has been created yet (Step 2's account-creation gap, still open).

So Step 3's deliverable here is **a CI config that is ready to work**, not **a CI pipeline that has been proven to work**. The first real run (whenever this repo exists on GitHub with secrets set) needs to be watched and its result recorded here — do not mark Step 3 fully verified until that happens.

### Rollback path via CI (extends the dashboard rollback above)
Since production deploys are tied to commits on `main`, an equally valid rollback is: revert the bad commit (or `git revert`) and push — the workflow redeploys the previous good state automatically, going through the same test gate. This is generally preferable to the dashboard "publish an old deploy" button when the rollback should also be reflected in git history.

### Still required before this pipeline can run for real
1. `git init` this tree, create the GitHub repo, push.
2. Create the Netlify site (Step 2), grab its Site ID.
3. Generate a Netlify personal access token.
4. Add both as GitHub repo secrets (`NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`).
5. Push to `main` (or open a PR) and watch the Actions tab for the first real result.

## STEP 4 — Domain & TLS (Agent 4)

### Domain: none chosen yet
No custom domain exists anywhere in this repo or in any prior handoff — confirmed by grep across the tree in an earlier session (no `mylingo.com`/`.app`/`.io` references found). Per the protocol's instruction ("If not, note the placeholder"): **the site will be reachable at whatever `*.netlify.app` subdomain Netlify assigns when the site is created in Step 2's still-pending account setup** (e.g. something like `mylingo-xyz123.netlify.app`), until a real domain is purchased and connected. That subdomain name itself won't be known until the Netlify site actually exists.

### TLS
Netlify auto-provisions TLS (Let's Encrypt) for the assigned subdomain and for any custom domain added later — this is a platform default, not something this repo's config controls. What this repo *can* commit ahead of time is `Strict-Transport-Security` (HSTS), now added to `netlify.toml`'s headers block (`max-age=63072000; includeSubDomains; preload`). The dashboard's "Force HTTPS" toggle (http→https 301) still needs to be enabled once the site exists — documented here as a required manual step, not something this file does automatically.

**Unverified, same as Steps 2–3:** no site exists yet, so none of this — TLS provisioning, the HSTS header actually being served, the Force HTTPS toggle — has been observed working. It's configured, not confirmed.

### Canonical domain redirect (www vs apex)
Also unverified/inactive: a commented `[[redirects]]` template was added to `netlify.toml`, defaulting to apex-as-canonical (www → apex) as the more common convention, with instructions to flip the `from`/`to` if the eventual domain owner prefers the other direction. It uses `example.com` as an explicit placeholder — will do nothing until a real domain replaces it and the rule is uncommented.

### What's still required before Step 4 is actually verified
1. A real domain must be chosen and purchased (outside this environment).
2. The domain must be added in the Netlify dashboard and its DNS pointed at Netlify (or Netlify DNS delegated to it).
3. The `[[redirects]]` template above needs the real hostnames and to be uncommented.
4. "Force HTTPS" needs to be enabled in the dashboard.
5. Only then can HTTPS enforcement, HSTS delivery, and the canonical redirect be checked with a real request (e.g. `curl -I http://www.<domain>` should 301 to `https://<domain>`) rather than just read as config.

## STEP 14 follow-up — dedicated publish directory (Agent 16)
`netlify.toml` now has `publish = "dist"` and `command = "node tools/build-dist.js"`; both deploy jobs in `.github/workflows/deploy.yml` run the same build and publish `dist`. `tools/build-dist.js` (dependency-free) copies ONLY runtime files byte-for-byte: root `index.html`, `manifest.json`, `sw.js`, `robots.txt`, `sitemap.xml` (if present) and every top-level folder except `tests/ tools/ .github/ .git/ node_modules/ dist/`, minus all `*.md`. Not served any more: tests, tools, handoff/state markdown, `LIGHTHOUSE_RESULTS_*.json`, `LESSON_A11Y_RESULTS_*.json`, `RELEASE_IDENTITY.json`, `netlify.toml`, `.github`. The Agent 13 `/tests/*` and `/tools/*` 404 redirects and the `*.md` X-Robots-Tag header were removed (dead config). `dist/` is git-ignored; run `node tools/build-dist.js` locally to preview (`cd dist && python3 -m http.server`). Verified locally: 240 files, service worker precache 90 entries, 22-page online + offline sweep with 0 errors, repo internals return 404. Still UNVERIFIED until a real Netlify deploy: that Netlify runs the build command and serves `dist` with the header rules unchanged. New files that the app needs must live under an existing top-level folder or be added to `ROOT_FILES` in `tools/build-dist.js` (a test fails if a page or manifest file would not ship).

## Update (Agent 17) — CSP hashes
`netlify.toml`'s `script-src` now lists SHA-256 hashes of the inline scripts instead of `'unsafe-inline'` (see SECURITY.md). Editing any inline `<script>` in a page requires `node tools/build-csp.js` (`--check` to verify); the CI test job enforces it (via `tools/verify-all.js --quick`, see above).

## Update (Agent 21) — CI now runs the real local release gate, not just the unit suite
The `test` job in `.github/workflows/deploy.yml` previously ran only `node tests/run.js`. It now runs `node tools/verify-all.js --quick`, which also checks CSP staleness and dist byte-identity — the two gates that used to be local-only. `--quick` is used deliberately: the full sweep (`tools/csp-sweep.js`) needs Playwright, and installing a full browser on every CI run is a tradeoff not worth making until this repo actually exists on GitHub and someone is watching build times/minutes. Nothing else in the workflow changed (deploy jobs, secrets, triggers all as Agent 3 left them). Still **UNVERIFIED**: this workflow has never run for real (no GitHub repo yet), so this is read as config, not observed CI behavior, same caveat as everything else in this file until Step 2's Netlify account and a real repo exist.

## Local release gate (Agent 19)
`NODE_PATH=$(npm root -g) node tools/verify-all.js` (add `--quick` to skip the browser sweep) runs the unit suite, the CSP staleness check, a dist build with a byte-identity check against the source, and the CSP + service worker + offline sweep. Run it before every push.

## Update (Agent 22) — workflow file was missing from the Agent 21 zip
`.github/workflows/deploy.yml` and `.gitignore` were absent from the delivered `app-production-agent21.zip` (dotfiles dropped by the archiver), which made the suite fail on a clean unzip. Both were restored (the workflow is a reconstruction from the recorded design; review it before the first real run) and a test now pins them. Build archives with dotfiles included and verify from a fresh unzip.

## Update (Agent 23) — packaging tool
`tools/package.js` builds the deliverable zip with dotfiles and verifies it from a clean unzip (see STATE.md). Use it instead of a hand-typed zip command. The CI workflow is unchanged and still has never run.
