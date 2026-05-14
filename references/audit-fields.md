# 审计日志字段定义

Quick Step 5 / Deep Step 7 写入审计日志时的标记检查和字段规格。

## 标记检查（写入前执行，确定性判断）

查询 curate-history.jsonl 中该 pattern_key 的历史统计（recurrence_count, validated_count, capsule, trust_tier, outcome 序列）。

| 标记 | 条件 | 说明 |
|------|------|------|
| **distill_ready** | recurrence >= 5 AND trust_tier = "proven" AND 有 capsule | 蒸馏候选，Quick 标记，Deep 执行 |
| **prime**（进化活跃） | trust_tier = "proven" AND 最近 3 次记录中至少有 1 次 evolution 子字段变化（refined/context/avoid 新增或变更）或 capsule 内容变化 | 运行时计算，不存储到日志 |
| **stagnation_signal** | 见下方子类型 | 用于策略降级和根因诊断 |
| **platform_signal** | 见下方子类型 | 用于识别高价值固化候选 |
| **saturated_signal** | 见下方子类型（仅 Deep） | 用于识别成熟知识 |

### stagnation_signal 子类型

- `"repeated_stale"`：最近2条同 pattern_key 的 outcome 都是 "stale"
- `"repeated_conflict"`：最近2条同 pattern_key 的 outcome 都是 "conflicting"
- `"no_progress"`：recurrence >= 3 AND validated_count = 0 AND 无 capsule

### platform_signal 子类型

- `"stable_plateau"`：最近4条同 pattern_key 的 outcome 全为 "verified" 且无 evolution 子字段变化。Quick 和 Deep 模式均检测

### saturated_signal 子类型（仅 Deep）

- `"success_saturated"`：最近6条 outcome 全为 "verified" 且 trust_tier = "proven" 且 verified_rate >= 80%

**互斥规则**：标记互不排斥，可同时存在。stagnation_signal（负面停滞）和 platform_signal（正面平台期）可在不同 pattern_key 上共存；同一 pattern_key 上负面/正面信号互斥。

## 字段说明

| 字段 | 类型 | 触发条件 | 说明 |
|------|------|----------|------|
| `capsule` | 可选，字符串 | Pattern-Key 非首次出现 | 1-2 句提炼洞察，格式 `{事实}，{经验/结论}`。用于 Deep 晋升评估 |
| `validated` | 可选，布尔值 | 知识在本会话被实际应用 | 区分"记录频次"和"实践验证" |
| `outcome` | 可选，字符串 | pattern_key 有历史治理操作 | 效果反馈：`"verified"` / `"stale"` / `"conflicting"` |
| `strategy` | 可选，字符串 | 每个治理动作 | 策略意图：`"repair"` / `"optimize"` / `"innovate"` / `"explore"` |
| `blast_radius` | 可选，对象 | 每个治理动作 | 影响范围。Quick 仅记录 level，Deep 记录 files/lines/level |
| `evolution` | 可选，对象 | recurrence >= 3 | 学习积累。Quick 仅在有新发现时记录1个子字段，Deep 完整记录 |
| `distill_ready` | 可选，布尔值 | recurrence >= 5 AND proven AND 有 capsule | 蒸馏候选标记 |
| `stagnation_signal` | 可选，字符串枚举 | 见上方子类型 | 近期状态信号，含负面停滞和正面平台期 |
