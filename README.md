# Curate — Claude Code Knowledge Governance Skill

[中文文档](README_zh.md)

A knowledge governance skill for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) that keeps your project knowledge base clean, accurate, and maintainable across sessions.

## Background

Claude Code uses several mechanisms to persist knowledge across sessions: memory files (under `~/.claude/projects/`), project-level `CLAUDE.md`, and documentation files. Each session can add new memories, update decisions, and modify documentation.

Over time this leads to problems:

- **Duplication**: Different sessions save similar information in slightly different wording across multiple memory files
- **Staleness**: Decisions and technical notes from weeks ago no longer reflect the current state of the project
- **Bloat**: MEMORY.md index files exceed their line limits, individual memories grow beyond recommended sizes
- **Scattered knowledge**: The same topic exists as a memory, a CLAUDE.md entry, and a doc — with no coordination between them

None of this is catastrophic, but it degrades the quality of context Claude receives in future sessions. Bad context leads to worse suggestions.

## What Curate Does

Curate is a skill you run after a work session (or periodically) that reviews all knowledge assets and applies governance actions:

| Action | What It Means |
|--------|--------------|
| **Dedup** | Find semantically similar knowledge entries across files, merge them into one |
| **Update** | Refresh entries that no longer match the current project state |
| **Retire** | Remove or archive entries that are no longer relevant |
| **Promote** | Move frequently-referenced knowledge to higher-visibility locations (e.g., memory → CLAUDE.md) |
| **Demote** | Move rarely-used knowledge out of high-visibility locations to reduce clutter |

Each action is logged with a reason, so you can review what changed and why.

## Dual Mode

### Quick Mode (5 steps)

Run after any session. Low overhead, focuses on changes from the current conversation:

1. **Size check** — Measure MEMORY.md and individual memory sizes against limits
2. **Identify changes** — Detect what knowledge was added or modified this session
3. **Govern** — Apply dedup, update, retire, promote/demote as needed
4. **Self-check** — Verify all edits comply with size and format rules
5. **Audit log** — Record each action with rationale

### Deep Mode (7 steps)

Run periodically (e.g., weekly or after major milestones). Everything in Quick mode, plus:

- **Health scoring** — Each knowledge asset gets a numerical score based on freshness (how recently verified), accuracy (does it match current code), and utility (how often referenced)
- **Deep dedup** — Full cross-file scan instead of session-scoped detection
- **Promotion evaluation** — Systematic review of which knowledge should move up or down in visibility

The health scoring model improves over time: past governance decisions feed back into the scoring algorithm, so the system learns which types of knowledge tend to become stale quickly and which hold their value.

## When to Use

| Trigger | Mode |
|---------|------|
| End of a productive session | Quick |
| `/curate` command | Quick |
| `/curate deep` command | Deep |
| "整理一下" / "curate" / "sync up" / "归档" | Quick |
| Weekly cleanup, post-milestone | Deep |

## Installation

```bash
# Global (available in all projects)
cp -r . ~/.claude/skills/curate/

# Project-level
cp -r . /your-project/.claude/skills/curate/
```

## Project Structure

```
curate/
├── SKILL.md                  # Skill definition (564 lines)
├── evals/
│   ├── evals.json            # Evaluation criteria
│   └── fixtures/hardening/   # 12 test scenarios
├── references/               # 10 reference docs loaded on demand
│   ├── health-scoring.md     # Scoring algorithm specification
│   ├── pattern-keys.md       # Dedup key definitions
│   ├── evolution-rules.md    # Knowledge evolution rules
│   ├── anti-patterns.md      # Anti-pattern detection
│   ├── knowledge-matrix.md   # Knowledge type taxonomy
│   ├── audit-fields.md       # Audit log field definitions
│   ├── change-matrix.md      # Change detection rules
│   ├── content-matrix.md     # Content type classification
│   ├── deep-output-format.md # Deep mode output format
│   └── governance-insights.md# Governance decision heuristics
├── scripts/
│   ├── test-curate-hardening.js  # Run 12 test scenarios
│   ├── validate-curate.js        # Validate SKILL.md structure
│   └── analyze-curate-history.js # Analyze governance history
└── assets/
    └── governance-insights.md
```

### Test Scenarios

The 12 hardening scenarios in `evals/fixtures/hardening/` cover real edge cases encountered during development:

| Scenario | What It Tests |
|----------|--------------|
| Quick content change | Governance after a content-writing session |
| Quick code change | Governance after a coding session |
| Output index only | Only output files changed, no knowledge impact |
| Lightweight noop | Session with no meaningful knowledge changes |
| Deep with known history | Deep mode with existing governance history |
| Corrupt history | Recovery when governance log is malformed |
| Missing memory | Bootstrap when memory directory doesn't exist |
| Monorepo CLAUDE.md | Multiple CLAUDE.md files in subdirectories |
| Large project | 200+ memory entries, size-aware processing |
| Anti-pattern cleanup | Detecting and fixing knowledge anti-patterns |
| Cross-project sync | Dedup across project boundaries |
| Quick evolution boundary | Edge cases in evolution analysis cutoff |

## Configuration

Key parameters in `SKILL.md`:

| Parameter | Default | Purpose |
|-----------|---------|---------|
| MEMORY.md line limit | 200 | Keeps the index readable |
| Individual memory size | ≤8KB | Prevents single entries from dominating |
| Trigger phrases | Customizable | Both English and Chinese |

## Testing

```bash
node scripts/test-curate-hardening.js
node scripts/validate-curate.js
```

## License

MIT
