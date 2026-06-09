# Curate — Claude Code Knowledge Governance Skill

[中文文档](README_zh.md)

A knowledge governance skill for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) that audits, deduplicates, scores, and promotes knowledge across memory, CLAUDE.md, docs, and all project assets.

## The Problem

Every Claude Code session adds memories, decisions, and context files. Nothing retires the old ones.

Over time your knowledge base becomes a liability — duplicated entries, outdated decisions, bloated MEMORY.md files that exceed their line limits. The AI reads stale context and makes worse decisions. Manual cleanup is tedious and inconsistent.

**Curate treats knowledge as a living asset with a full lifecycle**, not a dump-and-forget log.

## What Makes Curate Different

### Health Scoring That Learns

Each knowledge asset gets a health score based on freshness, reference frequency, and accuracy. The scoring model evolves — governance decisions feed back into future evaluations. The more you use curate, the better it gets at identifying what's worth keeping.

### Pattern-Key Deduplication

Not string matching. Curate detects semantically duplicated knowledge across different files and memory entries, then proposes merges that preserve the strongest version. Three similar memories become one.

### Knowledge Promotion

Frequently-referenced project memories automatically get promoted to CLAUDE.md for higher visibility. Low-value CLAUDE.md entries get demoted back. Knowledge flows to where it's most useful.

### Dual-Mode Governance

| | Quick Mode | Deep Mode |
|---|---|---|
| **When** | After every session | Periodic full audit |
| **Steps** | 5 | 7 |
| **Scope** | Changes this session | Full knowledge base |
| **Extra** | — | Health scoring, deep dedup, promotion evaluation |

Quick mode adds near-zero overhead. Deep mode runs when you explicitly request it or when the skill detects enough accumulated drift.

### Hardened Against Edge Cases

12 scenario-based test fixtures covering real-world failures:

- Corrupt governance history → graceful recovery
- Missing memory directory → bootstrap from scratch
- Monorepo with multiple CLAUDE.md files → scoped governance
- Large projects with 200+ memory entries → size-aware pruning
- Cross-project knowledge sync → dedup across boundaries

## Installation

```bash
# Global (available in all projects)
cp -r . ~/.claude/skills/curate/

# Project-level
cp -r . /your-project/.claude/skills/curate/
```

## Usage

```
/curate          # Quick mode — session wrap-up
/curate deep     # Deep mode — full audit with scoring
```

Or natural language: `整理一下` / `curate` / `sync up` / `归档` / `治理一下`

### Quick Mode (5 Steps)

1. **Size Check** — Measure knowledge assets, flag bloat
2. **Identify Changes** — Detect what changed this session
3. **Execute Governance** — Update, merge, retire, promote
4. **Self-Check** — Validate all edits against size limits
5. **Audit Log** — Record every decision with rationale

### Deep Mode (7 Steps)

Adds on top of Quick:
- **Health Scoring** — Quantitative quality assessment per asset
- **Deep Dedup Scan** — Cross-file semantic duplicate detection
- **Promotion Evaluation** — Identify candidates for CLAUDE.md promotion/demotion

## Project Structure

```
curate/
├── SKILL.md                  # Skill definition (564 lines)
├── evals/
│   ├── evals.json            # Evaluation criteria
│   └── fixtures/hardening/   # 12 scenario-based test cases
├── references/               # 10 reference docs loaded on demand
│   ├── anti-patterns.md      #   Anti-pattern detection rules
│   ├── health-scoring.md     #   Scoring algorithm
│   ├── evolution-rules.md    #   Knowledge evolution logic
│   ├── pattern-keys.md       #   Dedup key definitions
│   ├── knowledge-matrix.md   #   Knowledge type taxonomy
│   └── ...                   #   + 5 more
├── scripts/                  # Validation & analysis tools
│   ├── test-curate-hardening.js
│   ├── validate-curate.js
│   └── analyze-curate-history.js
└── assets/
    └── governance-insights.md
```

## Key Configuration Parameters

| Parameter | Default | Purpose |
|-----------|---------|---------|
| MEMORY.md line limit | 200 | Prevents index bloat |
| Individual memory size | ≤8KB | Prevents single-entry domination |
| Evolution analysis | Quick: capped / Deep: unlimited | Controls analysis depth |
| Trigger phrases | Customizable | Both English and Chinese |

## License

MIT
