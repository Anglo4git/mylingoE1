#!/usr/bin/env python3
"""
Release identity gate (Agent 1).

Reads RELEASE_IDENTITY.json as the single canonical source and checks that
every other place a release tag can leak into (package.json, README.md, the
actual on-disk directory name) agrees with it.

Exit code 0 = all checks pass. Exit code 1 = at least one mismatch, printed
to stderr with enough detail to fix it.

This intentionally does NOT touch/scan the historical AGENT_*_COMPLETION.md /
AGENT_*_HANDOFF.md files: those are point-in-time records of what an agent
shipped at the time and are expected to reference whatever tag was current
then. Rewriting them would falsify history. Only "living" identity sources
are checked.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def fail(msg, errors):
    errors.append(msg)


def main():
    errors = []

    identity_path = os.path.join(ROOT, "RELEASE_IDENTITY.json")
    if not os.path.isfile(identity_path):
        print("FAIL: RELEASE_IDENTITY.json is missing at repo root.", file=sys.stderr)
        return 1

    with open(identity_path, "r", encoding="utf-8") as f:
        identity = json.load(f)

    release_id = identity.get("releaseId")
    package_dir_name = identity.get("packageDirName")
    artifact_filename = identity.get("artifactFilename")

    for key, val in [
        ("releaseId", release_id),
        ("packageDirName", package_dir_name),
        ("artifactFilename", artifact_filename),
    ]:
        if not val:
            fail(f"RELEASE_IDENTITY.json is missing required field '{key}'.", errors)

    if errors:
        for e in errors:
            print(f"FAIL: {e}", file=sys.stderr)
        return 1

    # 1. Directory name check.
    #
    # NOTE (superseded): this used to only fire when the on-disk basename
    # already matched the MYLINGO_vNNN_FINAL_RELEASE shape, on the theory
    # that generic checkout/CI workspace dirs (e.g. "repo", "MYLINGO_v118",
    # a GitHub Actions runner path) shouldn't be forced into that shape.
    # That "only check if it already looks right" logic is exactly what let
    # a root directory named MYLINGO_v118 (missing the _FINAL_RELEASE
    # suffix) ship inside an artifact file named
    # MYLINGO_v118_FINAL_RELEASE.zip without ever tripping this gate: the
    # regex didn't match, so the mismatch was silently skipped instead of
    # failing. Root cause of that incident, not a new one.
    #
    # Fixed behavior: always compare the actual basename to the declared
    # packageDirName. Local dev checkouts that are intentionally named
    # something else (a git clone dir, a scratch folder, etc.) opt out
    # explicitly via MYLINGO_SKIP_DIR_IDENTITY_CHECK=1 rather than relying
    # on an implicit shape-based exemption.
    actual_dir_name = os.path.basename(ROOT)
    skip_dir_check = os.environ.get("MYLINGO_SKIP_DIR_IDENTITY_CHECK") == "1"
    if not skip_dir_check:
        if actual_dir_name != package_dir_name:
            fail(
                f"On-disk root directory is '{actual_dir_name}' but "
                f"RELEASE_IDENTITY.json declares packageDirName="
                f"'{package_dir_name}'. If this is an intentional local "
                f"dev checkout (not a release artifact), set "
                f"MYLINGO_SKIP_DIR_IDENTITY_CHECK=1 to bypass this check.",
                errors,
            )
    if artifact_filename != f"{package_dir_name}.zip":
        fail(
            f"artifactFilename '{artifact_filename}' does not match "
            f"packageDirName '{package_dir_name}' + '.zip'.",
            errors,
        )
    if not artifact_filename.startswith(f"MYLINGO_{release_id}_"):
        fail(
            f"artifactFilename '{artifact_filename}' does not start "
            f"with the canonical releaseId '{release_id}'.",
            errors,
        )

    # 2. package.json check.
    pkg_path = os.path.join(ROOT, "package.json")
    if os.path.isfile(pkg_path):
        with open(pkg_path, "r", encoding="utf-8") as f:
            pkg = json.load(f)
        pkg_release = pkg.get("release")
        if pkg_release != release_id:
            fail(
                f"package.json 'release' field is {pkg_release!r}, expected "
                f"{release_id!r} (from RELEASE_IDENTITY.json).",
                errors,
            )
    else:
        fail("package.json not found.", errors)

    # 3. README.md check -- must declare the same canonical release tag
    #    somewhere near the top, and must not assert a *different* vNNN tag
    #    as the current release.
    readme_path = os.path.join(ROOT, "README.md")
    if os.path.isfile(readme_path):
        with open(readme_path, "r", encoding="utf-8") as f:
            readme = f.read()
        if release_id not in readme:
            fail(
                f"README.md does not mention the canonical release tag "
                f"'{release_id}' anywhere.",
                errors,
            )
        title_line = next(
            (line for line in readme.splitlines() if line.strip()), ""
        )
        title_tags = set(re.findall(r"\bv(\d+)\b", title_line))
        title_tags.discard(release_id.lstrip("v"))
        if title_tags:
            fail(
                f"README.md title line asserts conflicting version tag(s) "
                f"{sorted(title_tags)} instead of canonical '{release_id}': "
                f"{title_line!r}",
                errors,
            )
    else:
        fail("README.md not found.", errors)

    if errors:
        for e in errors:
            print(f"FAIL: {e}", file=sys.stderr)
        return 1

    print(f"PASS: release identity is consistent ({release_id}).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
