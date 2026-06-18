#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const historyPath = path.resolve(process.argv[3] || path.join(root, 'assets/curate-history.jsonl'));

const allowedActions = new Set(['create', 'merge', 'dedup', 'archive', 'delete', 'promote', 'verify', 'no-op', 'skip']);
const allowedStrategies = new Set(['repair', 'optimize', 'innovate', 'explore']);
const allowedOutcomes = new Set(['verified', 'stale', 'conflicting']);

const legacyActionMap = {
  update: { action: 'verify', strategy: null },
  fix: { action: 'verify', strategy: null },
  rewrite: { action: 'verify', strategy: null },
  score: { action: 'verify', strategy: null },
  reflect: { action: 'verify', strategy: null },
  repair: { action: 'verify', strategy: 'repair' },
  optimize: { action: 'verify', strategy: 'optimize' },
  innovate: { action: 'verify', strategy: 'innovate' },
  explore: { action: 'verify', strategy: 'explore' },
  'no-change-signal-detected': { action: 'verify', strategy: 'explore' },
  interrupt: { action: 'skip', strategy: null },
  'skipped-claudemd': { action: 'skip', strategy: null }
};

function emptyCounter() {
  return Object.create(null);
}

function inc(counter, key) {
  const normalized = key || '_missing';
  counter[normalized] = (counter[normalized] || 0) + 1;
}

function categoryOf(patternKey) {
  if (!patternKey || typeof patternKey !== 'string') return '_missing';
  return patternKey.split(':')[0] || '_missing';
}

function validateV2(record) {
  const missing = [];
  for (const field of ['ts', 'mode', 'pattern_key', 'action', 'strategy', 'target', 'detail', 'blast_radius']) {
    if (!(field in record)) missing.push(field);
  }
  const invalid = [];
  if (!allowedActions.has(record.action)) invalid.push('action');
  if (!allowedStrategies.has(record.strategy)) invalid.push('strategy');
  if (record.outcome && !allowedOutcomes.has(record.outcome)) invalid.push('outcome');
  return { ok: missing.length === 0 && invalid.length === 0, missing, invalid };
}

const summary = {
  source: historyPath,
  total_records: 0,
  invalid_json: 0,
  schema_version_2: 0,
  legacy_records: 0,
  strict_statistics: {
    usable_records: 0,
    excluded_from_strict_stats: 0,
    by_category: emptyCounter(),
    by_action: emptyCounter(),
    by_strategy: emptyCounter(),
    by_outcome: emptyCounter(),
    categories_with_strategy_sample: emptyCounter()
  },
  legacy_mappings: {
    mappable_records: 0,
    unmapped_records: 0,
    by_old_action: emptyCounter(),
    suggested_action: emptyCounter(),
    suggested_strategy: emptyCounter()
  },
  problems: []
};

const body = fs.existsSync(historyPath) ? fs.readFileSync(historyPath, 'utf8') : '';
if (!body) {
  summary.problems.push({ type: 'missing_or_empty_history', path: historyPath });
}

body.split(/\n/).forEach((line, index) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  summary.total_records += 1;

  let record;
  try {
    record = JSON.parse(trimmed);
  } catch (error) {
    summary.invalid_json += 1;
    summary.problems.push({ type: 'invalid_json', line: index + 1, message: error.message });
    return;
  }

  if (record.schema_version === 2) {
    summary.schema_version_2 += 1;
    const validation = validateV2(record);
    if (!validation.ok) {
      summary.strict_statistics.excluded_from_strict_stats += 1;
      summary.problems.push({
        type: 'invalid_schema_version_2',
        line: index + 1,
        missing: validation.missing,
        invalid: validation.invalid
      });
      return;
    }
    summary.strict_statistics.usable_records += 1;
    inc(summary.strict_statistics.by_category, categoryOf(record.pattern_key));
    inc(summary.strict_statistics.by_action, record.action);
    inc(summary.strict_statistics.by_strategy, record.strategy);
    if (record.outcome) inc(summary.strict_statistics.by_outcome, record.outcome);
    inc(summary.strict_statistics.categories_with_strategy_sample, `${categoryOf(record.pattern_key)}:${record.strategy}`);
    return;
  }

  summary.legacy_records += 1;
  summary.strict_statistics.excluded_from_strict_stats += 1;
  const oldAction = record.action || '_missing';
  inc(summary.legacy_mappings.by_old_action, oldAction);
  const mapped = legacyActionMap[oldAction];
  if (mapped) {
    summary.legacy_mappings.mappable_records += 1;
    inc(summary.legacy_mappings.suggested_action, mapped.action);
    if (mapped.strategy) inc(summary.legacy_mappings.suggested_strategy, mapped.strategy);
  } else {
    summary.legacy_mappings.unmapped_records += 1;
  }
});

summary.notes = [
  'read-only report; source history was not modified',
  'legacy mappings are suggestions for interpretation only, not an instruction to rewrite history',
  'strict statistics use only valid schema_version_2 records'
];

console.log(JSON.stringify(summary, null, 2));
