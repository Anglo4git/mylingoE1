import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const source = fs.readFileSync(path.join(root, 'site/shared/js/placement.js'), 'utf8');
const context = { window: { localStorage: { getItem: () => null, setItem: () => {} } } };
context.window.window = context.window;
vm.runInNewContext(source, context);
const placement = context.window.MylingoPlacement;

const levels = placement.LEVELS;
const report = {
  blueprint_version: placement.PLACEMENT_BLUEPRINT_V2.version,
  claim_basis: placement.PLACEMENT_BLUEPRINT_V2.coverage.claim_basis,
  levels: {},
  all_levels_meet_blueprint: true,
};

for (const level of levels) {
  const file = path.join(root, 'site', 'placement', level, 'placement-001.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const levelReport = placement.coverageReport(data.questions);
  report.levels[level] = { file: path.relative(root, file), ...levelReport };
  if (!levelReport.meets_blueprint) report.all_levels_meet_blueprint = false;
}

process.stdout.write(JSON.stringify(report, null, 2) + '\n');
process.exitCode = report.all_levels_meet_blueprint ? 0 : 1;
