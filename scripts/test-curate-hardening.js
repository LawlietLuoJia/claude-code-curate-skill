#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));
const errors = [];
const warnings = [];

function addError(message) { errors.push(message); }

function requireText(rel, text, label = text) {
  if (!read(rel).includes(text)) addError(rel + ' missing required text: ' + label);
}

function requireNoText(rel, text, label = text) {
  if (read(rel).includes(text)) addError(rel + ' still contains disallowed text: ' + label);
}

function validateSkillHardening() {
  requireText('SKILL.md', 'CLAUDE.md 质量报告门禁', 'CLAUDE.md quality gate heading');
  requireText('SKILL.md', 'Commands/Workflows', 'CLAUDE.md six-criterion report');
  requireText('SKILL.md', 'recurrence < 3', 'deterministic Quick evolution lower bound');
  requireText('SKILL.md', 'recurrence >= 3', 'deterministic Quick evolution trigger');
  requireText('SKILL.md', '未执行进化分析', 'explicit no evolution analysis phrase');
  requireText('SKILL.md', '有效样本分母', 'Deep sample denominator reporting');
  requireText('SKILL.md', '无无价值净增长', 'anti-bloat wording');
  requireText('SKILL.md', 'Deep 前置信号', 'Quick must explicitly assess Deep prerequisite signals');
  requireText('SKILL.md', '不适用时在摘要中写明', 'Quick must explain absent optional signals');
  requireText('SKILL.md', '不能静默跳过', 'Quick cannot silently skip optional signal judgment');
  // v1.0 反膨胀硬门（neat-freak 融合核心目标）—— pin 防回归
  requireText('SKILL.md', '25KB', 'MEMORY.md byte hard-gate');
  requireText('SKILL.md', 'wc -c', 'byte-level MEMORY.md measurement');
  requireText('SKILL.md', '静默', 'Claude Code silent-truncation rationale');
  requireText('references/health-scoring.md', '25KB', 'byte hard-gate in 精简性 scoring');
  requireText('references/health-scoring.md', '体量倒挂', 'size-inversion Deep weak signal');
  requireText('references/health-scoring.md', '毕业债务', 'graduation-debt marker');
  requireNoText('SKILL.md', '知识总量（总行数/总文件数）≤ 整理前', 'over-strict total knowledge cap');
}

function validateFixtures() {
  const dir = path.join(root, 'evals/fixtures/hardening');
  if (!fs.existsSync(dir)) return addError('missing evals/fixtures/hardening directory');
  const evals = JSON.parse(read('evals/evals.json')).evals || [];
  const fixtureBacked = evals.filter((entry) => Array.isArray(entry.files) && entry.files.length > 0);
  if (fixtureBacked.length < 12) addError('expected at least 12 evals with fixture files, found ' + fixtureBacked.length);
  const cases = fs.readdirSync(dir).filter((name) => fs.statSync(path.join(dir, name)).isDirectory()).sort();
  if (cases.length < 12) addError('expected at least 12 hardening fixture scenarios, found ' + cases.length);
  for (const name of cases) {
    const rel = path.join('evals/fixtures/hardening', name, 'scenario.json');
    if (!exists(rel)) { addError(rel + ' missing'); continue; }
    let scenario;
    try { scenario = JSON.parse(read(rel)); } catch (error) { addError(rel + ' invalid JSON: ' + error.message); continue; }
    for (const field of ['id', 'prompt', 'mode', 'must_load', 'must_not_load', 'expected_checks']) {
      if (!(field in scenario)) addError(rel + ' missing ' + field);
    }
    if (!Array.isArray(scenario.expected_checks) || scenario.expected_checks.length === 0) addError(rel + ' expected_checks must be non-empty array');
  }
}

function validatePackageCleanliness() {
  if (!exists('.gitignore')) addError('missing .gitignore for package clutter rules');
  else {
    requireText('.gitignore', '.DS_Store', '.gitignore .DS_Store rule');
    requireText('.gitignore', '*.bak', '.gitignore backup rule');
    requireText('.gitignore', '*.bak2', '.gitignore backup2 rule');
  }
  const clutter = [];
  const metadata = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(root, full);
      if (entry.name === '.DS_Store') metadata.push(rel);
      if (entry.name.endsWith('.bak') || entry.name.endsWith('.bak2')) clutter.push(rel);
      if (entry.isDirectory() && entry.name !== '.git') walk(full);
    }
  };
  walk(root);
  if (clutter.length) addError('backup clutter files found: ' + clutter.join(', '));
  if (metadata.length) warnings.push('macOS metadata present but ignored by .gitignore: ' + metadata.join(', '));
}

function validateHistoryAnalyzer() {
  const rel = 'scripts/analyze-curate-history.js';
  if (!exists(rel)) return addError('missing read-only history analyzer script');
  const source = read(rel);
  for (const text of ['legacy_mappings', 'strict_statistics', 'excluded_from_strict_stats', 'schema_version_2']) {
    if (!source.includes(text)) addError(rel + ' missing output contract token: ' + text);
  }
  if (/writeFileSync|appendFileSync|createWriteStream|renameSync|unlinkSync/.test(source)) {
    addError(rel + ' must be read-only and must not mutate history files');
  }
}

validateSkillHardening();
validateFixtures();
validatePackageCleanliness();
validateHistoryAnalyzer();

console.log(JSON.stringify({ ok: errors.length === 0, errors, warnings }, null, 2));
process.exit(errors.length ? 1 : 0);
