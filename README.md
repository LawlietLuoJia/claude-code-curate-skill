# Curate — Claude Code Knowledge Governance Skill

[中文文档](README_zh.md)

A knowledge governance skill for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) that audits, deduplicates, scores, and promotes knowledge across memory, CLAUDE.md, docs, and all project assets.

## Features

- **Dual Mode**: Quick (5-step wrap-up) and Deep (7-step full audit with health scoring)
- **Knowledge Lifecycle**: Audit → Deduplicate → Score → Promote → Evolve
- **Health Scoring**: Tracks knowledge freshness, accuracy, and utility over time
- **Pattern-Key Dedup**: Detects and merges redundant knowledge entries
- **Closed-Loop Feedback**: Learns from governance history to improve future decisions
- **Bilingual Triggers**: Responds to both English (`curate`, `tidy up`, `sync up`) and Chinese (`整理一下`, `收尾`, `归档`, `治理一下`)

## Installation

Copy (or symlink) this directory into your Claude Code skills folder:

```bash
# Global skill
cp -r . ~/.claude/skills/curate/

# Or project-level skill
cp -r . /your-project/.claude/skills/curate/
```

## Usage

In Claude Code, trigger curate with any of these:

```
/curate          # Explicit trigger
/curate deep     # Force deep mode
```

Or simply say:
> "整理一下" / "curate" / "sync up" / "归档"

### Quick Mode (5 Steps)

1. **Measure** — Check knowledge asset sizes (anti-bloat)
2. **Identify Changes** — Detect what changed this session
3. **Execute Governance** — Update, merge, retire knowledge
4. **Self-Check** — Validate all edits
5. **Audit Log** — Record decisions with rationale

### Deep Mode (7 Steps)

Adds health scoring, deep deduplication scans, and knowledge promotion evaluation on top of the Quick workflow.

## Project Structure

```
curate/
├── SKILL.md                 # Skill definition (main entry point)
├── .gitignore
├── evals/                   # Evaluation test cases
│   ├── evals.json
│   └── fixtures/
│       ├── schema-history.jsonl
│       └── hardening/       # 12 scenario-based test cases
├── references/              # Reference docs loaded by the skill
│   ├── anti-patterns.md
│   ├── audit-fields.md
│   ├── change-matrix.md
│   ├── content-matrix.md
│   ├── deep-output-format.md
│   ├── evolution-rules.md
│   ├── governance-insights.md
│   ├── health-scoring.md
│   ├── knowledge-matrix.md
│   └── pattern-keys.md
├── scripts/                 # Validation & analysis scripts
│   ├── analyze-curate-history.js
│   ├── test-curate-hardening.js
│   └── validate-curate.js
└── assets/                  # Runtime assets
    └── governance-insights.md
```

## Configuration

The skill is configured entirely through `SKILL.md`. Key parameters:

- **Size limits**: MEMORY.md ≤ 200 lines, individual memories ≤ 8KB
- **Evolution bounds**: Quick mode caps evolution analysis; Deep mode is unlimited
- **Trigger phrases**: Customizable in the `description` field of `SKILL.md`

## Testing

```bash
# Run hardening test suite
node scripts/test-curate-hardening.js

# Validate SKILL.md structure
node scripts/validate-curate.js
```

## License

MIT
