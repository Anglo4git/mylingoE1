# Mylingo — Orchestrated Multi-Agent Handoff Protocol

## Objective
Keep free-tier agent runs bounded and independently hand-offable while reducing gaps, inconsistencies, bugs, broken relative paths, dead links, and release errors.

## Operating rule
Each agent gets **one focused mission**, inspects first, makes the smallest safe change, validates only its contract, and writes a short handoff. Do not ask the next agent to infer hidden context. The ZIP is the source of truth.

## Shared engineering contract
> Inspect first. Make the smallest safe change. Prefer deletion and simplification. Remove dead code, duplicates, unused vars, console logs, TODOs, fake data, and placeholders. Fix build, type, lint, and test errors. Handle loading/error/empty states. Clean up effects/listeners/timers. Avoid new deps. No secrets in code. No `any` unless unavoidable. Validate input server-side. Lazy-load heavy routes/images. Paginate long lists. Use semantic HTML and accessible UI. Run build/typecheck/lint/tests or output exact commands.
>
> Required report: **Plan, Changes, Verification, Risks.**

## Agent lanes

### Agent A — Inspect / Baseline
- Inspect the ZIP and current release identity.
- Map deployable tree, entry points, manifests, service worker, scripts and tests.
- Do not change production code.
- Handoff: exact findings + next agent's file scope.

### Agent B — Root Entry / Deployment
- Make the app directly launchable from repository root.
- Root `site/index.html` must be a real app entry, not only a redirect.
- Keep existing `site/main/index.html` working.
- Use root-safe relative paths for shared assets, levels, courses, placement and service worker.
- Update PWA `start_url` and offline core manifest consistently.
- No new dependency.

### Agent C — Link / Path Integrity
- Audit links and asset references from the root entry and all linked first-hop pages.
- Check relative paths under both a repository/project path and `/`.
- Remove or fix dead links only when evidence exists.
- Do not redesign UI.

### Agent D — Offline / PWA Consistency
- Verify `sw.js`, manifest, core manifest and offline-pack ownership remain consistent.
- Confirm root entry is cacheable and service-worker scope still covers the complete site.
- Preserve pack-cache isolation.

### Agent E — Quality Gates
- Run available lint/type/test/content/build/release gates.
- Run targeted static link/path checks.
- Do not claim browser PASS when the browser stack is unavailable.
- Record exact failures and environment limitations.

### Agent F — Release Packager
- Package **only the exact verified tree** from the preceding handoff.
- Preserve project layout and all handoff files.
- Produce the final ZIP and a concise release handoff.
- Do not make source changes after verification.

## Handoff format
Every agent must leave:
1. Status: `COMPLETED`, `COMPLETED WITH KNOWN LIMITATIONS`, or `BLOCKED`.
2. Mission.
3. Files changed.
4. Verification commands + exact result.
5. Risks / limitations.
6. Exact next task.
7. Files the next agent must inspect.
8. Files the next agent must not touch, where applicable.

## Free-tier continuity rule
If an agent stops because of quota/time:
- The next agent starts from the previous handoff, not from the conversation.
- Never repeat completed work unless the previous verification is missing or contradictory.
- Pass the ZIP plus the latest handoff.
- Keep each mission small enough to finish and verify in one run.
- Prefer a chain of narrow agents over one long agent session.

## Current chain
`A Inspect → B Root Entry → C Link Integrity → D Offline/PWA → E Quality Gates → F Package`

## Current implementation handoff
Agent B's root-entry change is complete in `site/index.html`, `site/manifest.json`, and `site/offline/core-manifest.json`.
Next: Agent C should audit root-relative links and first-hop navigation without changing unrelated application behavior.

## Agent 122 completion
Agent 122 completed the Link / Path Integrity lane. The root entry and all local HTML href/src references audit clean with zero missing local references. No production code changes were required. Next lane: Offline / PWA consistency (Agent 123).
