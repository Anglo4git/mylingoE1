#!/usr/bin/env node
/**
 * Dependency-free critical coverage gate.
 *
 * It measures whether every critical production module has an explicit
 * regression-test owner. This closes the "no threshold" gap without
 * requiring registry access or an additional coverage provider.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const contractPath = path.join(root, 'coverage.contract.json');
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const entries = contract.critical_modules || [];
if (!entries.length) {
  console.error('COVERAGE GATE: no critical modules configured');
  process.exit(1);
}
let covered = 0;
const errors = [];
for (const entry of entries) {
  const modulePath = path.join(root, entry.module);
  if (!fs.existsSync(modulePath)) {
    errors.push(`missing production module: ${entry.module}`);
    continue;
  }
  const tests = (entry.tests || []).filter(t => fs.existsSync(path.join(root, t)));
  if (!tests.length) {
    errors.push(`no existing regression test mapped to: ${entry.module}`);
    continue;
  }
  covered += 1;
}
const percent = Math.round((covered / entries.length) * 100);
const threshold = Number(contract.threshold_percent);
process.stdout.write(`Critical-module test reachability: ${covered}/${entries.length} (${percent}%)\n`);
process.stdout.write(`Enforced threshold: ${threshold}%\n`);
if (errors.length) {
  for (const e of errors) console.error(`BLOCKING: ${e}`);
}
if (percent < threshold || errors.length) {
  process.exit(1);
}
process.stdout.write('COVERAGE GATE: PASS\n');
