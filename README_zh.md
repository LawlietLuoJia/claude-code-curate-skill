# Curate — Claude Code 知识治理 Skill

[English](README.md)

面向 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 的知识治理技能，让项目的知识库在多个会话之间保持干净、准确、可维护。

## 背景

Claude Code 通过多种机制跨会话持久化知识：memory 文件（`~/.claude/projects/` 下）、项目级 `CLAUDE.md`、以及文档文件。每次会话都可能新增记忆、更新决策、修改文档。

时间一长就产生了问题：

- **重复**：不同会话用略有不同的措辞把类似的信息存在多个 memory 文件中
- **过时**：几周前的决策和技术笔记已不再反映项目的当前状态
- **膨胀**：MEMORY.md 索引文件超出行数限制，单个 memory 超出推荐大小
- **分散**：同一个主题同时存在于 memory、CLAUDE.md 和文档中，彼此没有协调

这些不会导致灾难性后果，但会持续降低 Claude 在后续会话中收到的上下文质量。上下文质量差，建议质量就差。

## Curate 做什么

Curate 是一个在工作会话结束（或定期）时运行的技能，它审查所有知识资产并执行治理操作：

| 操作 | 含义 |
|------|------|
| **去重** | 跨文件找到语义相似的知识条目，合并为一个 |
| **更新** | 刷新与项目当前状态不符的条目 |
| **退役** | 移除或归档不再相关的条目 |
| **晋升** | 将频繁引用的知识移到可见度更高的位置（如 memory → CLAUDE.md） |
| **降级** | 将很少使用的知识从高可见度位置移出，减少干扰 |

每个操作都记录了理由，方便你事后审查改了什么、为什么改。

## 双模式

### Quick 模式（5 步）

在任何会话后运行。开销低，聚焦于当前会话的变更：

1. **尺寸检查** — 测量 MEMORY.md 和单个 memory 的尺寸，检查是否超限
2. **识别变更** — 检测本次会话新增或修改了哪些知识
3. **治理** — 按需执行去重、更新、退役、晋升/降级
4. **自检** — 验证所有编辑符合尺寸和格式规则
5. **审计日志** — 记录每个操作及理由

### Deep 模式（7 步）

定期运行（如每周或重大里程碑后）。包含 Quick 模式的全部内容，额外增加：

- **健康评分** — 每个知识资产获得数值分数，基于新鲜度（最近一次验证的时间）、准确性（是否匹配当前代码）、实用性（被引用频率）
- **深度去重** — 全量跨文件扫描，而非仅检测当前会话范围
- **晋升评估** — 系统性审查哪些知识应该在可见度层级中上移或下移

健康评分模型会随时间改善：过去的治理决策反馈到评分算法中，系统会学习哪类知识容易过时、哪类知识保值期长。

## 何时使用

| 触发方式 | 模式 |
|---------|------|
| 产出了内容的工作会话结束 | Quick |
| `/curate` 命令 | Quick |
| `/curate deep` 命令 | Deep |
| "整理一下" / "curate" / "sync up" / "归档" | Quick |
| 每周清理、里程碑后 | Deep |

## 安装

```bash
# 全局（所有项目可用）
cp -r . ~/.claude/skills/curate/

# 项目级
cp -r . /your-project/.claude/skills/curate/
```

## 项目结构

```
curate/
├── SKILL.md                  # Skill 定义（564 行）
├── evals/
│   ├── evals.json            # 评估标准
│   └── fixtures/hardening/   # 12 个测试场景
├── references/               # 10 个按需加载的参考文档
│   ├── health-scoring.md     # 评分算法规格
│   ├── pattern-keys.md       # 去重键定义
│   ├── evolution-rules.md    # 知识进化规则
│   ├── anti-patterns.md      # 反模式检测
│   ├── knowledge-matrix.md   # 知识类型分类法
│   ├── audit-fields.md       # 审计日志字段定义
│   ├── change-matrix.md      # 变更检测规则
│   ├── content-matrix.md     # 内容类型分类
│   ├── deep-output-format.md # Deep 模式输出格式
│   └── governance-insights.md# 治理决策启发规则
├── scripts/
│   ├── test-curate-hardening.js  # 运行 12 个测试场景
│   ├── validate-curate.js        # 验证 SKILL.md 结构
│   └── analyze-curate-history.js # 分析治理历史
└── assets/
    └── governance-insights.md
```

### 测试场景

`evals/fixtures/hardening/` 中的 12 个加固场景覆盖了开发过程中遇到的真实边界情况：

| 场景 | 测试内容 |
|------|---------|
| Quick content change | 内容写作会话后的治理 |
| Quick code change | 编码会话后的治理 |
| Output index only | 只有输出文件变化，无知识影响 |
| Lightweight noop | 会话没有实质性知识变更 |
| Deep with known history | 有历史记录时的 Deep 模式 |
| Corrupt history | 治理日志格式损坏时的恢复 |
| Missing memory | Memory 目录不存在时的引导 |
| Monorepo CLAUDE.md | 子目录中存在多个 CLAUDE.md |
| Large project | 200+ memory 条目，需尺寸感知处理 |
| Anti-pattern cleanup | 检测和修复知识反模式 |
| Cross-project sync | 跨项目边界的去重 |
| Quick evolution boundary | 进化分析边界的边界情况 |

## 关键配置

`SKILL.md` 中的关键参数：

| 参数 | 默认值 | 用途 |
|------|--------|------|
| MEMORY.md 行数限制 | 200 | 保持索引可读 |
| 单个 memory 大小 | ≤8KB | 防止单条目占主导 |
| 触发短语 | 可自定义 | 中英双语 |

## 测试

```bash
node scripts/test-curate-hardening.js
node scripts/validate-curate.js
```

## 许可证

MIT
