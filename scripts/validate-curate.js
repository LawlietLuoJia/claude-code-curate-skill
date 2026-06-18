#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const allowedActions = new Set(['create', 'merge', 'dedup', 'archive', 'delete', 'promote', 'verify', 'no-op', 'skip']);
const allowedStrategies = new Set(['repair', 'optimize', 'innovate', 'explore']);
const allowedOutcomes = new Set(['verified', 'stale', 'conflicting']);
const errors = [];
const warnings = [];

const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));
const addError = (message) => errors.push(message);
const addWarning = (message) => warnings.push(message);

function listMarkdownFiles() {
  const files = ['SKILL.md'];
  const refDir = path.join(root, 'references');
  for (const file of fs.readdirSync(refDir).filter((name) => name.endsWith('.md')).sort()) {
    files.push(path.join('references', file));
  }
  return files;
}

function validateFrontmatter() {
  const match = read('SKILL.md').match(/^---\n([\s\S]*?)\n---/);
  if (!match) return addError('SKILL.md missing YAML frontmatter');
  if (!/^name:\s*curate\b/m.test(match[1])) addError('frontmatter missing name: curate');
  if (!/^description:\s*>/m.test(match[1])) addError('frontmatter missing block description');
}

function validateMarkdownLinks() {
  for (const rel of listMarkdownFiles()) {
    const text = read(rel);
    const base = path.dirname(path.join(root, rel));
    for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+\.md)\)/g)) {
      const target = path.resolve(base, match[1]);
      if (!fs.existsSync(target)) addError(`${rel} has broken markdown link: ${match[1]}`);
    }
  }
}

function validateReferencesLinked() {
  const skill = read('SKILL.md');
  for (const file of fs.readdirSync(path.join(root, 'references')).filter((name) => name.endsWith('.md'))) {
    if (!skill.includes(`references/${file}`)) addError(`reference not linked from SKILL.md: references/${file}`);
  }
  if (!exists('assets/governance-insights.md')) addError('missing assets/governance-insights.md');
  if (!read('references/governance-insights.md').includes('assets/governance-insights.md')) {
    addError('references/governance-insights.md must point actual insights to assets/governance-insights.md');
  }
}

function validateEvals() {
  const data = JSON.parse(read('evals/evals.json'));
  if (data.skill_name !== 'curate') addError('evals skill_name must be curate');
  if (!Array.isArray(data.evals) || data.evals.length < 41) addError('evals must contain at least 41 cases');
  const ids = new Set();
  const names = new Set();
  for (const entry of data.evals || []) {
    if (ids.has(entry.id)) addError(`duplicate eval id: ${entry.id}`);
    ids.add(entry.id);
    if (names.has(entry.name)) addError(`duplicate eval name: ${entry.name}`);
    names.add(entry.name);
    if (!Array.isArray(entry.assertions) || entry.assertions.length === 0) addError(`eval ${entry.id} has no assertions`);
    if (!('files' in entry)) addError(`eval ${entry.id} missing files field`);
    for (const rel of entry.files || []) {
      if (!exists(rel)) addError(`eval ${entry.id} references missing fixture: ${rel}`);
    }
  }
}

function validateHistoryFile(rel, options = {}) {
  const fixture = options.fixture === true;
  let parsed = 0;
  let legacy = 0;
  let validV2 = 0;

  read(rel).split(/\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    parsed += 1;

    let record;
    try {
      record = JSON.parse(trimmed);
    } catch (error) {
      addError(`${rel}:${index + 1} invalid JSON: ${error.message}`);
      return;
    }

    if (record.schema_version !== 2) {
      legacy += 1;
      return;
    }

    validV2 += 1;
    for (const field of ['ts', 'mode', 'pattern_key', 'action', 'strategy', 'target', 'detail', 'blast_radius']) {
      if (!(field in record)) addError(`${rel}:${index + 1} schema_version=2 missing ${field}`);
    }
    if (!allowedActions.has(record.action)) addError(`${rel}:${index + 1} invalid action ${record.action}`);
    if (!allowedStrategies.has(record.strategy)) addError(`${rel}:${index + 1} invalid strategy ${record.strategy}`);
    if (record.outcome && !allowedOutcomes.has(record.outcome)) addError(`${rel}:${index + 1} invalid outcome ${record.outcome}`);
    if (!record.blast_radius || typeof record.blast_radius !== 'object') {
      addError(`${rel}:${index + 1} blast_radius must be object`);
    } else {
      if (!['low', 'medium', 'high'].includes(record.blast_radius.level)) addError(`${rel}:${index + 1} invalid blast_radius.level`);
      if (typeof record.blast_radius.files !== 'number') addError(`${rel}:${index + 1} blast_radius.files must be number`);
      if (typeof record.blast_radius.lines !== 'number') addError(`${rel}:${index + 1} blast_radius.lines must be number`);
    }
  });

  if (!fixture && legacy) addWarning(`${rel}: ${legacy}/${parsed} legacy records excluded from strict Deep statistics`);
  if (fixture && validV2 === 0) addError(`${rel} fixture must contain at least one schema_version=2 record`);
}

function validateCoreTextContracts() {
  const skill = read('SKILL.md');
  const audit = read('references/audit-fields.md');
  const evolution = read('references/evolution-rules.md');
  const knowledge = read('references/knowledge-matrix.md');
  if (!skill.includes('schema_version')) addError('SKILL.md must require schema_version for new audit records');
  if (!audit.includes('旧格式兼容映射')) addError('audit-fields.md missing legacy compatibility mapping');
  if (!evolution.includes('动态计算')) addError('evolution-rules.md must state Deep computes evolution fields dynamically');
  if (!knowledge.includes('与 Pattern-Key 类别映射')) addError('knowledge-matrix.md missing Pattern-Key mapping section');
}

validateFrontmatter();
validateMarkdownLinks();
validateReferencesLinked();
validateEvals();
validateHistoryFile('assets/curate-history.jsonl');
validateHistoryFile('evals/fixtures/schema-history.jsonl', { fixture: true });
validateCoreTextContracts();

console.log(JSON.stringify({ ok: errors.length === 0, errors, warnings }, null, 2));
process.exit(errors.length ? 1 : 0);
