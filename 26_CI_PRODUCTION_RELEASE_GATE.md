# Mylingo — CI / Production Release Gate

## Goal

Make the existing deterministic `build.py release-gate` an actual deployment boundary. A production artifact must be generated from the canonical source, verified, and passed through the release gate before it can be published.

## CI contract

The GitHub Actions workflow at `.github/workflows/release.yml` runs on pull requests, pushes to `main`, and manual dispatch.

For every verification run it:

1. Installs the pinned dependency set from `package-lock.json`.
2. Runs all Python unit tests.
3. Runs content QA.
4. Runs the JavaScript unit suite.
5. Builds a completely fresh deployable directory from `master_source.csv`, copying runtime assets from the checked-in `site/` tree.
6. Runs `verify-output` against the freshly generated site.
7. Runs `release-gate` against that exact output.
8. Uploads only the gated output as a Pages artifact.

The deploy job only runs for a successful push to `main`, and publishes the exact artifact produced by the verification job.

## Local parity

`ci/release_gate.sh` provides the same release sequence locally:

```bash
bash ci/release_gate.sh
```

The package scripts expose this as:

```bash
npm run release:build
```

## Failure behavior

Any non-zero test, QA, build, output verification, or release-gate result stops the workflow before deployment. No `--force` build is used in CI.

Reports are retained as workflow artifacts to make release failures diagnosable without reproducing the run locally.

## Deployment topology

The existing single-origin GitHub Pages topology remains the supported deployment shape. The workflow publishes the complete `site/` equivalent artifact rather than individual level folders, preserving shared runtime assets, localStorage continuity, and relative routing.

## Non-goals

- No backend or server-side runtime was introduced.
- No changes were made to quiz scoring, placement, mastery, scheduling, authoring autosave, or offline pack contracts.
- No separate deployment is created per CEFR level.
