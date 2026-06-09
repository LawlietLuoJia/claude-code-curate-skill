# 审计日志字段定义

Quick Step 5 / Deep Step 7 写入审计日志时的标记检查和字段规格。

## 字段边界

`action`、`strategy`、`outcome` 必须分工明确：

| 字段 | 含义 | 允许值 |
|------|------|--------|
| `schema_version` | 审计记录格式版本 | 新写入记录固定为 `2` |
| `action` | 本次实际做了什么 | `create` / `merge` / `dedup` / `archive` / `delete` / `promote` / `verify` / `no-op` / `skip` |
| `strategy` | 本次为什么这么做 | `repair` / `optimize` / `innovate` / `explore` |
| `outcome` | 历史治理决策后来被证明怎样 | `verified` / `stale` / `conflicting` |

禁止把 `repair`、`optimize`、`innovate`、`explore` 写入 `action`。旧日志若有混用，Deep 统计时标为 `旧格式`，不纳入新字段策略有效性统计。

### 旧格式兼容映射

没有 `schema_version: 2` 的记录视为旧格式，只用于人工追溯和迁移提示，不进入 Deep 统计分母。读取旧记录时可按下表解释，但不要原地重写历史：

| 旧 action | 读取解释 | 说明 |
|---|---|---|
| `update` / `fix` / `rewrite` / `score` / `reflect` | `action: "verify"` | 表示曾做过检查、修正或反思 |
| `repair` / `optimize` / `innovate` / `explore` | 移入 `strategy`，`action` 解释为 `verify` | 旧记录混用了动作与意图 |
| `no-change-signal-detected` | `action: "verify"`, `strategy: "explore"` | 具体信号保留在 `detail` |
| `interrupt` / `skipped-claudemd` | `action: "skip"` | 原因保留在 `detail` |

新写入记录不得使用旧 action。

## 样本门槛

字段从 Quick 开始立即记录；基于字段的统计结论必须满足门槛：

| 结论 | 最低样本 | 不足时 |
|------|----------|--------|
| `strategy_hint` | 同 category + strategy >= 5 条新格式记录 | 仅记录观察，不驱动治理动作 |
| `trust_tier` | 同一 Pattern-Key >= 3 条记录 | 标记样本不足 |
| `plateau` | 连续 verified >= 4 | 不输出平台期结论 |
| `saturated_signal` | 连续 verified >= 6 且 proven 且 verified_rate >= 80% | 不输出饱和结论 |
| `distill_ready` | recurrence >= 5 且 proven 且有 capsule；同 category 至少 2 个成熟候选 | 不蒸馏 |

旧记录缺少新增字段不视为机制失败，也不参与该字段统计分母。只有 `schema_version: 2` 且 action/strategy/outcome 枚举合法、必填字段完整的记录，才算"新格式有效记录"。

## 标记检查（写入前执行，确定性判断）

查询 curate-history.jsonl 中该 pattern_key 的历史统计（recurrence_count, validated_count, capsule, trust_tier, outcome 序列）。

| 标记 | 条件 | 说明 |
|------|------|------|
| **distill_ready** | recurrence >= 5 AND trust_tier = "proven" AND 有 capsule | Deep 计算的蒸馏候选；Quick 不强行写入 |
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
| `schema_version` | 必填，数字 | 新写入审计记录 | 固定为 `2`，用于区分旧日志兼容读取和新日志严格统计 |
| `capsule` | 可选，字符串 | Pattern-Key 非首次出现 | 1-2 句提炼洞察，格式 `{事实}，{经验/结论}`。用于 Deep 晋升评估 |
| `validated` | 可选，布尔值 | 知识在本会话被实际应用 | 区分"记录频次"和"实践验证" |
| `outcome` | 可选，字符串 | pattern_key 有历史治理操作 | 效果反馈：`"verified"` / `"stale"` / `"conflicting"` |
| `strategy` | 必填，字符串 | 每个治理动作 | 策略意图：`"repair"` / `"optimize"` / `"innovate"` / `"explore"` |
| `blast_radius` | 必填，对象 | 每个治理动作 | 影响范围。Quick 和 Deep 都记录 files/lines/level；无法估算时写 0 和 low |
| `evolution` | 可选，对象 | recurrence >= 3 | 学习积累。Quick 仅在有新发现时记录1个子字段，Deep 完整记录 |
| `distill_ready` | 可选，布尔值 | Deep 中 recurrence >= 5 AND proven AND 有 capsule | 蒸馏候选标记；Quick 不强行写入 |
| `stagnation_signal` | 可选，字符串枚举 | 见 stagnation_signal 子类型 | 负面停滞信号，用于策略降级和根因诊断 |
| `platform_signal` | 可选，字符串枚举 | 见 platform_signal 子类型 | 正面平台期信号，用于识别高价值固化候选 |
| `saturated_signal` | 可选，字符串枚举 | 见 saturated_signal 子类型，仅 Deep | 成熟饱和信号，用于识别可固化知识 |

可选字段不得为了“完整”写空值或猜测值。Quick 必须逐项判断 `capsule`、`validated`、`outcome`、`evolution`、`stagnation_signal`、`platform_signal` 是否适用；无证据时不写字段，并在摘要中说明“无证据，不填”，让 Deep 能区分“没有信号”和“未检查”。
