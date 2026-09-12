import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const profilesPath = path.resolve(process.cwd(), "production_quiz_profiles.json");
const packerPath = path.resolve(process.cwd(), "site/shared/js/quiz-packer.js");
const authoringPath = path.resolve(process.cwd(), "authoring/mylingo-admin.html");
const masterSourcePath = path.resolve(process.cwd(), "master_source.csv");

const profilesRaw = fs.readFileSync(profilesPath, "utf8");
const profilesDoc = JSON.parse(profilesRaw);
const packer = fs.readFileSync(packerPath, "utf8");
const authoring = fs.readFileSync(authoringPath, "utf8");

function loadPacker() {
  const sandbox = {};
  sandbox.window = sandbox;
  const fn = new Function("window", packer + "\nreturn window.MylingoQuizPacker;");
  return fn(sandbox);
}

function parseCsvCombos() {
  const csv = fs.readFileSync(masterSourcePath, "utf8");
  const lines = csv.trim().split(/\r?\n/);
  const header = lines[0].split(",");
  const levelIdx = header.indexOf("level");
  const catIdx = header.indexOf("quiz_category");
  const combos = new Set();
  for (const line of lines.slice(1)) {
    const cells = line.split(",");
    if (cells[levelIdx] && cells[catIdx]) combos.add(`${cells[levelIdx]}|${cells[catIdx]}`);
  }
  return combos;
}

describe("Agent 16 Production Quiz Profiles — config", () => {
  it("defines exactly 18 profiles and 1 deferred combination", () => {
    expect(profilesDoc.profiles).toHaveLength(18);
    expect(profilesDoc.deferred).toHaveLength(1);
  });

  it("every profile has a unique id and valid size bounds", () => {
    const ids = new Set();
    profilesDoc.profiles.forEach(p => {
      expect(p.id).toBeTruthy();
      expect(ids.has(p.id)).toBe(false);
      ids.add(p.id);
      expect(p.level).toBeTruthy();
      expect(p.quiz_category).toBeTruthy();
      expect(p.min_size).toBeLessThanOrEqual(p.target_size);
      expect(p.target_size).toBeLessThanOrEqual(p.max_size);
      expect(p.min_size).toBeGreaterThan(0);
    });
  });

  it("covers exactly the master_source.csv combinations minus the deferred one", () => {
    const csvCombos = parseCsvCombos();
    const profileCombos = new Set(profilesDoc.profiles.map(p => `${p.level}|${p.quiz_category}`));
    const deferredCombos = new Set(profilesDoc.deferred.map(d => `${d.level}|${d.quiz_category}`));
    expect(csvCombos.size).toBe(19);
    csvCombos.forEach(combo => {
      expect(profileCombos.has(combo) || deferredCombos.has(combo)).toBe(true);
    });
    deferredCombos.forEach(combo => expect(profileCombos.has(combo)).toBe(false));
  });
});

describe("Agent 16 Production Quiz Profiles — packer wiring", () => {
  it("packRows accepts an optional profiles option without changing its signature contract", () => {
    expect(packer).toContain("function packRows");
    expect(packer).toContain("indexProfiles");
    expect(packer).toContain("resolveBucketOptions");
    expect(packer).toContain("profilesApplied");
  });

  it("is fully backward compatible: no profiles option behaves exactly like Agent 15", () => {
    const MylingoQuizPacker = loadPacker();
    const rows = [];
    for (let i = 1; i <= 12; i++) {
      rows.push({ quiz_id: "", level: "A1", quiz_category: "Grammar", title: "", description: "", question_number: "", __internalId: `r${i}` });
    }
    const result = MylingoQuizPacker.packRows(rows, { minSize: 5, targetSize: 20, maxSize: 150 });
    expect(result.packedQuizCount).toBe(1);
    expect(result.profilesApplied).toEqual([]);
    expect(rows[0].title).toBe("Mixed Grammar Practice");
  });

  it("applies a matching profile's bounds and templates over the global fallback", () => {
    const MylingoQuizPacker = loadPacker();
    const rows = [];
    for (let i = 1; i <= 12; i++) {
      rows.push({ quiz_id: "", level: "A1", quiz_category: "Grammar", title: "", description: "", question_number: "", __internalId: `r${i}` });
    }
    const result = MylingoQuizPacker.packRows(rows, {
      minSize: 5,
      targetSize: 20,
      maxSize: 150,
      profiles: profilesDoc.profiles
    });
    expect(result.profilesApplied).toEqual(["a1-grammar"]);
    // a1-grammar target_size/max_size = 10/15, so 12 rows should land in one
    // quiz (<= max_size 15), using the profile's title template.
    expect(result.packedQuizCount).toBe(1);
    expect(rows[0].title).toBe("Grammar Practice");
  });

  it("falls back to global options for a combination with no matching profile (deferred B1/Writing)", () => {
    const MylingoQuizPacker = loadPacker();
    const rows = [{ quiz_id: "", level: "B1", quiz_category: "Writing", title: "", description: "", question_number: "", __internalId: "x1" }];
    const result = MylingoQuizPacker.packRows(rows, {
      minSize: 5,
      targetSize: 20,
      maxSize: 150,
      profiles: profilesDoc.profiles
    });
    expect(result.profilesApplied).toEqual([]);
    // 1 row < global minSize 5 -> left untouched, not manufactured into an
    // invalid quiz, same behavior as any unresolved bucket.
    expect(result.packedQuizCount).toBe(0);
  });
});

describe("Agent 16 Production Quiz Profiles — authoring UI wiring", () => {
  it("embeds the production profiles and passes them to both packRows call sites", () => {
    expect(authoring).toContain("PRODUCTION_QUIZ_PROFILES");
    expect(authoring).toContain("profiles: PRODUCTION_QUIZ_PROFILES");
  });

  it("still preserves existing IDs by default (Agent 15 contract untouched)", () => {
    expect(authoring).toContain("Pack Quizzes");
    expect(packer).toContain("!opts.repackExisting");
  });
});
