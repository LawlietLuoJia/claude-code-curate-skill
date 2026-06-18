# Changelog

本文件记录 curate（Claude Code 知识治理 skill）的版本变更。版本号遵循语义化版本（SemVer）。

## [1.0.1] — 2026-06-18

### 修复
- **修正审计日志损坏记录**：`curate-history.jsonl:362` 的 `action:"optimize"` 违反枚举（optimize 属 strategy 不属 action），导致 `validate-curate.js` 失败。该记录实际动作是"压缩 MEMORY.md 冗余子条目 151→147 行"（即去冗余），改为 `action:"dedup"`，保留 `strategy:"optimize"`。`validate-curate.js` 现通过（ok:true，0 errors）。

### 测试
- **锁定 v1.0 反膨胀硬门契约**：`test-curate-hardening.js` 新增 6 条 requireText，pin 住本次核心目标防回归——SKILL.md 的 `25KB` 字节硬门 / `wc -c` 字节实测 / `静默`截断说明，health-scoring.md 的 `25KB` 评分硬门 / `体量倒挂` Deep 弱信号 / `毕业债务` 标记。requireText 总数 14→20。

> 触发：v1.0.0 验收评审指出主校验失败 + 新规则无测试契约保护。本版补齐。

## [1.0.0] — 2026-06-18

首个正式语义化版本发布。以本地 darwin 优化血脉为权威，合并远程 README/LICENSE，确立版本机制（此前本地与远程为无关历史，本次以本地为权威统一）。

### 反膨胀机制（融合自上游 neat-freak，经独立 judge 评审 + grill 精炼）
- **MEMORY.md 硬门**：`≤200 行 且 ≤25KB`。Claude Code 会话开始只加载前 200 行或 25KB（先到先算），超出部分静默截断=等于没记。第零步尺寸体检表 + 反膨胀自检 + health-scoring 精简性评分三处联动，`wc -l` + `wc -c` 实测。
- **精简性硬悬崖**：`>200 行 或 >25KB` 从"扣 1 分"重定性为"精简性 0 分 + Step-0 必修"（静默丢失，非扣分级问题），保留 ≤100/100-150/150-200 行数梯度。
- **体量倒挂 Deep 弱信号**：memory 总量 > docs+context+CLAUDE.md 总量 → 扣分并标记"毕业债务（稳定知识未上移）"，喂 Deep 晋升评估。
- **反膨胀根因说明**：docs 就地编辑收敛 vs agent 记忆天生只追加的不对称。

### 检查点显性化（darwin HL-1）
- 4 个 🛑 视觉硬门标记：CLAUDE.md 质量报告门禁、delete、晋升建议清单、多会话并发编辑（均有"不得编辑/等用户确认"硬阻断，非装饰）。

### 架构修复
- 修复 Quick 模式 Step-1 标题错位（`Deep 第一步` → `第一步`）。

### darwin 优化轮次（结构性提升，已沉淀）
- **失败模式编码**：14 个显式"X 失败 → fallback"分支（损坏历史/只读 CLAUDE.md/并发编辑/循环依赖/工具报错等）。
- **references 模块化**：audit-fields / evolution-rules / pattern-keys / knowledge-matrix / health-scoring / anti-patterns / change-matrix / content-matrix / deep-output-format / governance-insights，按需加载。
- **校验脚本**：`validate-curate.js`（frontmatter/链接/schema 契约）、`test-curate-hardening.js`（文本契约门禁）、`analyze-curate-history.js`（只读统计）。
- **evals**：41+ 测试用例 + hardening fixtures。
- **审计日志**：schema_version:2 + 旧格式兼容映射（update/fix/rewrite → verify 等）。

### 文档
- 从远程拉回 README.md / README_zh.md / LICENSE（本地此前缺失）。

### 明确未采纳（评估后拒绝，避免冗余/冲突）
- 类型前缀生命周期（reference_/feedback_/project_）：与 curate 文件名无关 + trust-gated 模型冲突。
- 裸 ≥3 次毕业触发：curate 的 evolution-rules 已有更严门控（+trust_tier+一致性+持久性）。
- Codex 版同步：25KB 截断是 Claude Code 平台特有行为，Codex 版另案实测。

### 已知限制
- `curate-history.jsonl` 含约 227 条 schema_version≠2 旧记录（~54%），稀释 Deep 统计分母；后续可归档到 legacy 文件。
- assets 路径硬编码 `~/.claude/skills/curate/assets/`，移植性待改进。
- 独立 judge 重评（2 judge，dry_run）落在 ~82-85/100；旧自评 97.6 为同 context 通胀。
