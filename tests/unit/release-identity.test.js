import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";

// Agent 1 — release identity regression test.
// Runs scripts/verify_release_identity.py and asserts it exits 0.
// Keeping the check itself in one Python script (rather than duplicating
// the logic in JS) so there is exactly one implementation of "what counts
// as a match" -- this test just proves it's wired into the normal test run.
describe("release identity", () => {
  it("package.json, README.md, and the on-disk directory name all agree with RELEASE_IDENTITY.json", () => {
    const repoRoot = path.resolve(__dirname, "..", "..");
    const scriptPath = path.join(repoRoot, "scripts", "verify_release_identity.py");

    let output;
    let failed = false;
    try {
      output = execFileSync("python3", [scriptPath], {
        cwd: repoRoot,
        encoding: "utf-8",
      });
    } catch (err) {
      failed = true;
      output = (err.stdout || "") + (err.stderr || "");
    }

    expect(failed, `verify_release_identity.py reported mismatches:\n${output}`).toBe(false);
    expect(output).toMatch(/^PASS: release identity is consistent/);
  });
});
