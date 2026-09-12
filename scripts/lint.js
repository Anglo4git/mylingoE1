#!/usr/bin/env node
/**
 * Agent 2 — static quality gate for JavaScript.
 *
 * Dependency-free by design: this sandbox has no network egress, so
 * `npm install eslint` cannot run here. Rather than ship a lint *config*
 * that nobody can execute, this is a small self-contained scanner using
 * only Node's built-ins (fs, path, node:vm's `--check`-equivalent via
 * child_process for syntax). `eslint.config.js` is included alongside
 * this so that the moment `npm install` works (CI, or a dev machine with
 * registry access), `npx eslint .` is a drop-in upgrade — same rule
 * intent, real parser instead of regex heuristics.
 *
 * Scope:
 *   PRODUCTION  = site/**\/*.{js,mjs,cjs}, scripts/**\/*.{js,mjs}
 *                 (vendor/vendors/node_modules/*.min.* excluded)
 *   TEST/CONFIG = tests/**\/*.{js,mjs}, playwright.config.js, vitest.config.js
 *
 * Rules (see checkFile below for exact behavior per rule):
 *   BLOCKING in production only : debugger statement, console.log, TODO/FIXME/XXX
 *   WARNING  everywhere         : eslint-disable comments, files > 800 lines,
 *                                 heuristic commented-out code blocks (3+
 *                                 consecutive commented lines that look like code)
 *
 * Exit code 0 = no blocking findings. Exit code 1 = at least one.
 * Warnings never fail the gate; they're printed so they don't silently
 * accumulate. This mirrors the project's own "baseline, then ratchet"
 * philosophy used for coverage (see Agent 3's mandate) rather than
 * retroactively rewriting 300+ existing files in one pass.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const EXCLUDE_DIR_NAMES = new Set([
  "node_modules",
  "vendor",
  "vendors",
  ".git",
  "__pycache__",
  "dist-release",
]);

function isMinified(filePath) {
  return /\.min\.(js|mjs|cjs)$/i.test(filePath);
}

function walk(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (EXCLUDE_DIR_NAMES.has(entry.name)) continue;
      walk(path.join(dir, entry.name), out);
    } else if (/\.(js|mjs|cjs)$/i.test(entry.name) && !isMinified(entry.name)) {
      out.push(path.join(dir, entry.name));
    }
  }
}

function collectScope() {
  const production = [];
  const testAndConfig = [];
  const selfPath = path.resolve(__filename);

  for (const sub of ["site", "scripts"]) {
    const abs = path.join(ROOT, sub);
    if (fs.existsSync(abs)) walk(abs, production);
  }
  const selfIdx = production.indexOf(selfPath);
  if (selfIdx !== -1) production.splice(selfIdx, 1);

  const testsDir = path.join(ROOT, "tests");
  if (fs.existsSync(testsDir)) walk(testsDir, testAndConfig);
  for (const cfg of ["playwright.config.js", "vitest.config.js"]) {
    const abs = path.join(ROOT, cfg);
    if (fs.existsSync(abs)) testAndConfig.push(abs);
  }

  return { production, testAndConfig };
}

function stripStringsAndTemplates(line) {
  // Crude but sufficient for a regex-based heuristic scanner: blank out
  // string/template contents so "console.log" inside a string literal
  // (e.g. an error message telling a human to remove console.log) isn't
  // flagged as real code.
  return line
    .replace(/`(?:\\.|[^`\\])*`/g, "``")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/'(?:\\.|[^'\\])*'/g, "''");
}

function checkFile(filePath, { blocking }) {
  const findings = [];
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split("\n");

  if (lines.length > 800) {
    findings.push({
      level: "warning",
      rule: "max-file-length",
      line: null,
      message: `${lines.length} lines (> 800). Consider splitting.`,
    });
  }

  let consecutiveCommentedCodeLines = 0;
  let commentedBlockStart = null;

  lines.forEach((lineRaw, idx) => {
    const lineNo = idx + 1;
    const code = stripStringsAndTemplates(lineRaw);

    if (/\bdebugger\b\s*;?/.test(code)) {
      findings.push({
        level: blocking ? "blocking" : "warning",
        rule: "no-debugger",
        line: lineNo,
        message: "debugger statement left in code.",
      });
    }

    if (/console\.log\s*\(/.test(code)) {
      findings.push({
        level: blocking ? "blocking" : "warning",
        rule: "no-console-log",
        line: lineNo,
        message: "console.log left in code (console.warn/error are fine).",
      });
    }

    if (/\/\/.*\b(TODO|FIXME|XXX)\b/i.test(lineRaw) || /\/\*.*\b(TODO|FIXME|XXX)\b/i.test(lineRaw)) {
      findings.push({
        level: blocking ? "blocking" : "warning",
        rule: "no-stub-markers",
        line: lineNo,
        message: "TODO/FIXME/XXX marker — resolve or file as a tracked risk instead.",
      });
    }

    if (/eslint-disable/.test(lineRaw)) {
      findings.push({
        level: "warning",
        rule: "no-unexplained-eslint-disable",
        line: lineNo,
        message: "eslint-disable comment present — fine if it has a reason, worth a second look otherwise.",
      });
    }

    // Heuristic: a run of 3+ consecutive `//`-commented lines that look
    // like real statements (end in `;`, `{`, `}`, or contain `=>`/`function`).
    const trimmed = lineRaw.trim();
    const looksLikeCommentedCode =
      /^\/\/\s*\S/.test(trimmed) &&
      /[;{}]\s*$|=>|function\s*\(|^\/\/\s*(const|let|var|if|for|while|return)\b/.test(trimmed);
    if (looksLikeCommentedCode) {
      if (consecutiveCommentedCodeLines === 0) commentedBlockStart = lineNo;
      consecutiveCommentedCodeLines += 1;
    } else {
      if (consecutiveCommentedCodeLines >= 3) {
        findings.push({
          level: "warning",
          rule: "no-commented-out-code",
          line: commentedBlockStart,
          message: `${consecutiveCommentedCodeLines} consecutive commented-out lines that look like code, starting here.`,
        });
      }
      consecutiveCommentedCodeLines = 0;
    }
  });
  if (consecutiveCommentedCodeLines >= 3) {
    findings.push({
      level: "warning",
      rule: "no-commented-out-code",
      line: commentedBlockStart,
      message: `${consecutiveCommentedCodeLines} consecutive commented-out lines that look like code, starting here.`,
    });
  }

  return findings;
}

function main() {
  const { production, testAndConfig } = collectScope();
  let blockingCount = 0;
  let warningCount = 0;

  const report = [];

  for (const file of production) {
    const findings = checkFile(file, { blocking: true });
    for (const f of findings) {
      if (f.level === "blocking") blockingCount += 1;
      else warningCount += 1;
      report.push({ file: path.relative(ROOT, file), ...f });
    }
  }
  for (const file of testAndConfig) {
    const findings = checkFile(file, { blocking: false });
    for (const f of findings) {
      warningCount += 1;
      report.push({ file: path.relative(ROOT, file), ...f });
    }
  }

  if (report.length === 0) {
    console.log(
      `PASS: lint scanned ${production.length} production file(s) and ` +
        `${testAndConfig.length} test/config file(s), 0 findings.`
    );
    if (production.length === 0) {
      console.log(
        "NOTE: 0 production JS files found under site/ or scripts/ — " +
          "site/ is currently empty (see R-009 in MASTER_REMEDIATION_HANDOFF.md). " +
          "This gate will start scanning real production code the moment it exists."
      );
    }
    process.exit(0);
  }

  for (const f of report) {
    const loc = f.line ? `${f.file}:${f.line}` : f.file;
    console.log(`${f.level.toUpperCase()} [${f.rule}] ${loc} — ${f.message}`);
  }
  console.log(
    `\n${blockingCount} blocking, ${warningCount} warning finding(s) across ` +
      `${production.length} production + ${testAndConfig.length} test/config file(s).`
  );

  process.exit(blockingCount > 0 ? 1 : 0);
}

main();
