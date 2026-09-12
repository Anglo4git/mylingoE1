"""Agent 84 — Integration Audit regression guard.

Defect found: `build.py`'s `copy_runtime_assets()` had a hardcoded list of
top-level paths to copy from `--src-root` into `--out` that predated the
Course/Lesson/Journey feature (Agents 73-81) and was never updated to
include `courses/` or `course_content/`. Every prior agent's "fresh build,
0 drift" verification rebuilt with `--src-root site --out site` (the same
directory), which made the missing copy a silent no-op: the files were
already there, so nothing appeared to break. The actual CI release
pipeline (`.github/workflows/release.yml` via `ci/release_gate.sh`) builds
into a fresh `dist-release` directory, which is the one case that exposes
the bug: `courses/` and `course_content/` would be entirely absent from
every real release artifact, silently dropping the Course/Lesson/Journey
feature from production. This was only caught indirectly, and as a hard
build failure rather than a clean pass/fail signal, because
`offline_packs.py`'s core-manifest step happens to reference those paths.

This test rebuilds into a scratch directory that is NOT the source
directory (matching real CI) and asserts the course feature survives.
"""
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestBuildCopiesCourseContent(unittest.TestCase):
    def test_fresh_out_dir_contains_courses_and_course_content(self):
        with tempfile.TemporaryDirectory() as tmp:
            out_dir = os.path.join(tmp, "dist-release")
            result = subprocess.run(
                [
                    sys.executable, "build.py", "build",
                    "--input", "master_source.csv",
                    "--out", out_dir,
                    "--src-root", "site",
                ],
                cwd=REPO_ROOT, capture_output=True, text=True,
            )
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

            for rel in [
                "courses/index.html", "courses/course.html",
                "courses/lesson.html", "courses/journey.html",
                "course_content/courses.json", "course_content/units.json",
                "course_content/lessons.json",
            ]:
                self.assertTrue(
                    os.path.isfile(os.path.join(out_dir, rel)),
                    f"missing {rel} in a fresh (non-in-place) build output "
                    "-- copy_runtime_assets() must copy 'courses' and "
                    "'course_content' from --src-root, not just 'shared'/"
                    "'main'/'placement'",
                )


if __name__ == "__main__":
    unittest.main()
