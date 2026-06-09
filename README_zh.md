# Curate — Claude Code 知识治理 Skill

[English](README.md)

面向 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 的知识治理技能——审计、去重、评分、晋升你的知识资产（memory、CLAUDE.md、docs 等）。

会话结束后触发，治理知识资产：健康评分、去重、晋升、审计，越用越精准。

## 功能特性

- **双模式**：Quick（5步快速收尾）和 Deep（7步全量审计 + 健康评分）
- **知识全生命周期**：审计 → 去重 → 评分 → 晋升 → 进化
- **健康评分**：跟踪知识条目的新鲜度、准确性和实用性
- **模式键去重**：检测并合并冗余知识条目
- **闭环反馈**：从治理历史中学习，改善未来决策
- **中英双语触发**：`curate`、`tidy up` / `整理一下`、`收尾`、`归档`、`治理一下`

## 安装

将本目录复制到 Claude Code skills 目录：

```bash
# 全局安装
cp -r . ~/.claude/skills/curate/

# 项目级安装
cp -r . /your-project/.claude/skills/curate/
```

## 使用方式

在 Claude Code 中，以下任一方式触发：

```
/curate          # 直接触发
/curate deep     # 强制 Deep 模式
```

或自然语言：
> "整理一下" / "curate" / "sync up" / "归档"

### Quick 模式（5步）

1. **体检** — 检查知识资产尺寸（防膨胀）
2. **识别变更** — 检测本次会话的变更
3. **执行治理** — 更新、合并、退役知识条目
4. **自检** — 验证所有编辑操作
5. **审计日志** — 记录决策及理由

### Deep 模式（7步）

在 Quick 模式基础上增加健康评分、深度去重扫描和知识晋升评估。

## 项目结构

```
curate/
├── SKILL.md                 # Skill 定义（主入口）
├── .gitignore
├── evals/                   # 评估测试用例
│   ├── evals.json
│   └── fixtures/
│       ├── schema-history.jsonl
│       └── hardening/       # 12 个场景化测试用例
├── references/              # Skill 运行时加载的参考文档
│   ├── anti-patterns.md     #   反模式检测
│   ├── audit-fields.md      #   审计字段定义
│   ├── change-matrix.md     #   变更矩阵
│   ├── content-matrix.md    #   内容矩阵
│   ├── deep-output-format.md#   Deep 模式输出格式
│   ├── evolution-rules.md   #   进化规则
│   ├── governance-insights.md#  治理洞见
│   ├── health-scoring.md    #   健康评分算法
│   ├── knowledge-matrix.md  #   知识矩阵
│   └── pattern-keys.md      #   模式键定义
├── scripts/                 # 验证与分析脚本
│   ├── analyze-curate-history.js  # 治理历史分析
│   ├── test-curate-hardening.js   # 加固测试套件
│   └── validate-curate.js         # SKILL.md 结构验证
└── assets/                  # 运行时资产
    └── governance-insights.md
```

## 配置

通过 `SKILL.md` 完全配置，关键参数：

- **尺寸限制**：MEMORY.md ≤ 200行，单个 memory ≤ 8KB
- **进化边界**：Quick 模式限制进化分析范围；Deep 模式无限制
- **触发短语**：在 `SKILL.md` 的 `description` 字段自定义

## 测试

```bash
# 运行加固测试套件
node scripts/test-curate-hardening.js

# 验证 SKILL.md 结构
node scripts/validate-curate.js
```

## 许可证

MIT
