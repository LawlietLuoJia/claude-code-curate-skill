# Curate — Claude Code 知识治理 Skill

[English](README.md)

面向 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 的知识治理技能——审计、去重、评分、晋升你的知识资产（memory、CLAUDE.md、docs 等）。

## 核心问题

每次 Claude Code 会话都会产生新的记忆、决策和上下文文件，但从来没有任何机制清理旧的。

久而久之，知识库从资产变成负债——重复条目、过时决策、膨胀的 MEMORY.md 超出行数限制。AI 读到过时上下文，做出更差的判断。手动清理既繁琐又不一致。

**Curate 把知识当作有完整生命周期的活资产来管理**，而不是存了就忘的日志。

## 核心能力

### 越用越准的健康评分

每个知识资产获得基于新鲜度、引用频率和准确性的健康评分。评分模型会进化——治理决策反馈到未来评估中。你用得越多，curate 越能精准判断什么值得保留。

### 模式键去重

不是字符串匹配。Curate 检测跨文件、跨 memory 条目的语义重复，然后提出保留最强版本的合并建议。三条相似记忆合并为一条。

### 知识晋升

被频繁引用的项目 memory 自动晋升到 CLAUDE.md 获得更高可见度。低价值的 CLAUDE.md 条目降级回去。知识流向它最有用的地方。

### 双模式治理

| | Quick 模式 | Deep 模式 |
|---|---|---|
| **何时** | 每次会话后 | 定期全量审计 |
| **步骤** | 5 步 | 7 步 |
| **范围** | 本次会话变更 | 全部知识资产 |
| **额外** | — | 健康评分、深度去重、晋升评估 |

Quick 模式几乎零开销。Deep 模式在显式请求或检测到足够积累的偏移时触发。

### 12 个加固场景覆盖边界情况

- 治理历史损坏 → 优雅恢复
- Memory 目录缺失 → 从零引导
| Monorepo 多个 CLAUDE.md → 作用域隔离治理
- 大型项目 200+ memory 条目 → 尺寸感知剪裁
- 跨项目知识同步 → 跨边界去重

## 安装

```bash
# 全局安装（所有项目可用）
cp -r . ~/.claude/skills/curate/

# 项目级安装
cp -r . /your-project/.claude/skills/curate/
```

## 使用方式

```
/curate          # Quick 模式 — 会话收尾
/curate deep     # Deep 模式 — 全量审计 + 评分
```

自然语言触发：`整理一下` / `curate` / `sync up` / `归档` / `治理一下`

### Quick 模式（5 步）

1. **尺寸体检** — 检测知识资产尺寸，标记膨胀
2. **识别变更** — 检测本次会话的变更
3. **执行治理** — 更新、合并、退役、晋升
4. **自检** — 验证所有编辑符合尺寸限制
5. **审计日志** — 记录每个决策及理由

### Deep 模式（7 步）

在 Quick 模式基础上增加：
- **健康评分** — 每个资产的量化质量评估
- **深度去重扫描** — 跨文件语义重复检测
- **晋升评估** — 识别 CLAUDE.md 晋升/降级候选

## 项目结构

```
curate/
├── SKILL.md                  # Skill 定义（564 行）
├── evals/
│   ├── evals.json            # 评估标准
│   └── fixtures/hardening/   # 12 个场景化测试用例
├── references/               # 10 个运行时按需加载的参考文档
│   ├── anti-patterns.md      #   反模式检测规则
│   ├── health-scoring.md     #   评分算法
│   ├── evolution-rules.md    #   知识进化逻辑
│   ├── pattern-keys.md       #   去重键定义
│   ├── knowledge-matrix.md   #   知识类型分类法
│   └── ...                   #   + 5 个
├── scripts/                  # 验证与分析工具
│   ├── test-curate-hardening.js
│   ├── validate-curate.js
│   └── analyze-curate-history.js
└── assets/
    └── governance-insights.md
```

## 关键配置

| 参数 | 默认值 | 用途 |
|------|--------|------|
| MEMORY.md 行数限制 | 200 | 防止索引膨胀 |
| 单个 memory 大小 | ≤8KB | 防止单条目占主导 |
| 进化分析深度 | Quick: 受限 / Deep: 无限 | 控制分析深度 |
| 触发短语 | 可自定义 | 中英双语 |

## 许可证

MIT
