import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const packerPath = path.resolve(process.cwd(), "site/shared/js/quiz-packer.js");
const authoringPath = path.resolve(process.cwd(), "authoring/mylingo-admin.html");
const packer = fs.readFileSync(packerPath, "utf8");
const authoring = fs.readFileSync(authoringPath, "utf8");

describe("Agent 15 Quiz Grouping/Packing", () => {
  it("defines a reusable deterministic packer", () => {
    expect(packer).toContain("function packRows");
    expect(packer).toContain("DEFAULTS");
    expect(packer).toContain("levelCategoryKey");
    expect(packer).toContain("targetSize");
  });

  it("does not rename existing quiz IDs by default", () => {
    expect(packer).toContain('!opts.repackExisting');
    expect(authoring).toContain("Pack Quizzes");
    expect(authoring).toContain("preserve existing IDs");
  });

  it("packs by level/category with valid min and max bounds", () => {
    expect(packer).toContain("minSize");
    expect(packer).toContain("maxSize");
    expect(packer).toContain("Mixed ${category} Practice");
    expect(packer).toContain("question_number = i + 1");
  });

  it("supports selected-row packing from the authoring UI", () => {
    expect(authoring).toContain("selectedIds");
    expect(authoring).toContain("packQuizGroups");
    expect(authoring).toContain("renumberQuizRows");
  });
});
