# 进化规则

知识从临时层到持久层的进化机制。Quick 负责记录原始信号和局部事实判断；Deep 负责基于足够样本做完整评估、归因、晋升和蒸馏。

## 启用原则

- 字段立即记录：`strategy`、`blast_radius`、`validated`、`outcome`、`capsule`、`evolution`、`stagnation_signal`、`platform_signal` 从 Quick 开始按证据填写。
- 统计结论延迟启用：`trust_tier`、`priority_weight`、`prime`、`saturated_signal`、`distill_ready`、治理反思等只在 Deep 中计算或解释。
- 样本不足时只观察，不驱动晋升、删除、策略降级或蒸馏。
- 旧日志缺少新增字段不视为机制失败；Deep 统计时标为 `旧格式`，不纳入对应字段分母。
- `distill_ready`、`prime`、`saturated_signal` 是 Deep 动态计算结果；Quick 不预写，历史日志中即使存在也只能作为旧观察，不作为事实来源。

## 样本门槛

| 结论 | 最低样本 | 不足时 |
|------|----------|--------|
| `trust_tier` | 同一 Pattern-Key >= 3 条记录 | 标记样本不足，不参与晋升 |
| `strategy_hint` | 同 category + strategy >= 5 条新格式记录 | 仅记录观察，不影响策略选择 |
| `priority_weight` | 满足 `trust_tier` 样本门槛且有 last_seen | 不计算权重 |
| `plateau` | 连续 verified >= 4 | 不输出平台期结论 |
| `saturated_signal` | 连续 verified >= 6 且 proven 且 verified_rate >= 80% | 不输出饱和结论 |
| `distill_ready` | recurrence >= 5 且 proven 且有 capsule；同 category 至少 2 个成熟候选 | 不蒸馏 |
| audit pattern analysis | curate-history.jsonl >= 20 条可用记录 | 跳过并标注原因 |

## 信任等级与波动检测

计算信任等级：
- trust_score = validated_count / max(recurrence_count, 1)
- volatile = (total >= 3 且 stale+conflicting占比 >= 40%)
- priority_weight = recurrence_count × (1 + 0.2 × validated_count) × volatility_factor × freshness_factor
  - volatility_factor = 0.3 if volatile=true, else 1
  - freshness_factor = 1.2 if last_seen 在 7 天内, 1.0 if 8-30 天, 0.7 if 超过 30 天
  - 用途：Deep 模式排序；Quick 模式不计算该权重

判断矩阵（频次 >= 3 时；不足 3 条只观察）：

| trust_tier | 条件 | volatile | 状态 | 处理 |
|---|---|---|---|---|
| proven | trust_score >= 0.4 | - | 正常活跃 | 继续观察或晋升 |
| emerging | trust_score >= 0.1 | - | 半活跃 | 可晋升，需确认 |
| untested | trust_score < 0.1 | false | 待验证 | 标记"待实践验证"，暂缓晋升 |
| untested | trust_score < 0.1 | true | 疑似停滞 | **执行停滞诊断**（见下方） |
| * | - | true | 波动 | 阻止晋升，建议重写/删除 |

## 进化状态标识

**本文件是进化状态标识的唯一定义点。** SKILL.md 和 deep-output-format.md 引用此表输出。

| 标识 | 含义 | 触发条件 | 作用 |
|---|---|---|---|
| `🟢 watch` | 新验证 — 关注下次是否重复出现 | recurrence=1 且 validated=true | 首次出现就被实践验证，高进化潜力 |
| `🟡 approaching` | 接近晋升 — 已验证且即将达标 | recurrence=2 且至少 1 次 validated=true | 知识正在积累验证记录，下 1 次出现可进入晋升评估 |
| `💎 prime` | 进化活跃 — proven 且仍在积累新学习 | trust_tier=proven **且** 最近 3 次记录中至少有 1 次 evolution 子字段变化或 capsule 内容变化 | 优先投入进化精力。无 prime 标记的 proven 知识 = 已稳定 |
| `🔴 volatile` | 波动中 — 内容不稳定 | volatile=true | 阻止晋升，建议重写或删除 |
| `⬛ stagnant` | 停滞 — 多次出现从未验证 | recurrence>=3 且 validated=0 且 capsule=无 | 进入停滞诊断流程 |
| `⬜ plateau` | 平台期 — 连续成功无新学习 | 连续>=4次 verified 且无 evolution 变化 | 审视是否可提升为治理洞见或固化到 docs |
| `🔵 saturated` | 成熟饱和 — 极度成熟可固化 | 连续>=6次 verified 且 proven 且 verified_rate>=80% | 优先候选治理洞见，或考虑写入 docs |

## 停滞诊断（Deep only）

**本文件是停滞诊断的唯一定义点。** SKILL.md 的停滞回避和 audit-fields.md 的信号子类型均引用此节。

当 pattern_key 出现 ≥ 3 次但 validated=0 且 capsule=无 时，诊断停滞原因：

| 诊断类型 | 含义 | 判断依据 | 建议 |
|---|---|---|---|
| **范围模糊** | Pattern-Key 太宽泛，每次出现内容不同但 key 相同 | 历史 detail 内容跨度大（涉及不同工具/场景/方法） | 拆分为更具体的子键 |
| **受众不明** | 知识适合哪一层不清晰 | 知识同时影响项目级和全局级，无法确定归入哪层 | 明确界定范围后再晋升 |
| **内容漂移** | 每次出现描述都不同，尚未收敛 | 历史 detail 是同一主题的不同阶段描述（从"尝试A"到"改用B"到"最终C"） | 等待内容稳定后再评估 |
| **真正停滞** | 知识本身价值有限 | 历史 detail 高度重复（几乎相同），从未被实际使用 | 归档或删除 |

**诊断判断流程**：
1. 检查历史 detail 内容一致性 → 高度重复 → 真正停滞
2. 检查知识涉及的层级 → 跨层级 → 受众不明
3. detail 涉及完全不同主题但同一 key → 范围模糊
4. detail 是同一主题的演进描述 → 内容漂移

## 晋升条件

### 基础条件（必须全部满足）

1. **频次**：pattern_key 在 `curate-history.jsonl` 中出现 ≥ 3 次
2. **持久性**：知识本身不是临时状态
3. **一致性**：知识内容已稳定（最近两次出现的描述基本一致）
4. **可靠性**：trust_tier 不为 untested，且 volatile 不为 true

### 持久性判断

**持久知识**（可晋升）：
- 工具使用规则（"用 uv 不用 pip"）
- 格式规范（"华夏银行公文用宋体/黑体"）
- 工作流约定（"每日 20:00 早报"）
- 技术约束（"Python 3.10+ required"）
- 业务规则（"授信审查需风控签字"）

**临时状态**（不应晋升）：
- 环境状态（"soffice 当前不可用"——可能明天就装了）
- 进行中的工作（"正在调研 X"——调研完了就过时了）
- 待验证的假设（"可能是 Y 导致的"——需要先验证）

### 受众判断

| 受众范围 | 晋升目标 |
|----------|----------|
| 仅当前项目需要 | 项目 CLAUDE.md |
| 当前项目的所有参与者需要 | 项目 CLAUDE.md + docs/ |
| 所有项目都可能需要 | 全局 ~/.claude/CLAUDE.md |

### 效果反馈与信任合成（仅 Deep 模式）

复用「信任等级与波动检测」的计算结果：
- trust_tier = proven 且 verified 占比 >= 50% → 标记"经验证可靠"双标签，最高晋升优先级
- trust_tier = emerging → 可晋升但需用户确认
- volatile = true → 阻止晋升，放入"需重写/删除"章节
- 无 outcome 记录 → 按 trust_tier 处理

### 晋升执行

用户确认后：
1. 将知识内容写入目标文件（CLAUDE.md 或全局 CLAUDE.md）
2. 在源文件中标记或删除已晋升的条目
3. 向 `curate-history.jsonl` 写入晋升记录：
   ```json
   {"schema_version":2,"ts":"2026-05-23T17:30:00+08:00","mode":"deep","pattern_key":"tool:uv:package-management","action":"promote","strategy":"optimize","target":"~/.claude/CLAUDE.md","detail":"晋升到全局：跨项目适用的包管理规则","health_score":78,"blast_radius":{"files":1,"lines":2,"level":"medium"}}
   ```

### 全局配置克制原则

见 SKILL.md 编辑原则中的"全局配置极度克制"。晋升到全局时必须：
- 仅放入跨项目适用的核心原则，不放入任何项目特定的细节
- 保持精简（全局 CLAUDE.md 建议不超过 100 行）
- 每次新增前检查是否可以合并到已有条目

## 进化标记（Evolution Mark）

知识进化积累机制。当 Pattern-Key 的 recurrence >= 3 时，在审计日志中记录跨应用的学习积累。

### 三个子字段

| 字段 | 含义 | 记录时机 | 示例 |
|------|------|----------|------|
| `refined` | 知识从模糊到精确的**精炼结果** | 新记录比旧记录更准确时 | "需要 Python 3.10+" → "需要 Python 3.10+，因为用了 type union 语法" |
| `context` | 知识**适用的具体条件** | 在特定条件下被验证时 | "在 Docker 环境下需要额外装 build-essential" |
| `avoid` | **已知的失败路径** | 验证发现某种用法不对时 | "cairosvg 在 macOS 上不可用，系统缺 cairo" |

### 识别进化价值的信号

| 信号 | 含义 | 识别方式 |
|------|------|----------|
| `outcome: "stale"` → 新内容更新 | 知识被刷新，理解更精确 | 同一 pattern_key 先 stale 后 create |
| `outcome: "conflicting"` → resolved | 矛盾被解决，适用条件明确 | 同一 pattern_key 先 conflicting 后 verified |
| capsule 内容变化 | 理解在深化 | 同一 pattern_key 不同记录中 capsule 文本不同 |
| validated: true 在不同工作类型中 | 知识被多样化验证 | 同一 pattern_key 在不同类型的工作中被 validated |

### 记录规则

- **Quick 模式**：仅在有新发现时记录1个子字段（约15秒成本）
- **Deep 模式**：在晋升评估时完整记录所有已有子字段（约30秒成本）
- **可选字段**：没有进化信息的条目保持现有格式不变
- **与晋升联动**：有 `evolution` 标记的知识在晋升评估中优先考虑

## 模式蒸馏（Synthesis Scan）

### 触发条件

Deep 从 `schema_version: 2` 有效记录中动态计算候选，满足以下全部条件：
1. recurrence >= 5、trust_tier = "proven"、有 capsule
2. 同一 category 下有 >= 2 个符合条件的 Pattern-Key（单条不足以发现模式）

不满足时跳过，在报告中标注"无符合条件的蒸馏候选"。

### 执行时机

仅 Deep 模式 Step 5（晋升评估）末尾执行。Quick 模式不强行写入 `distill_ready`，只记录 capsule、validated、outcome、evolution 等原始信号供 Deep 计算。

### 输出格式

蒸馏产出的"治理洞见"经用户确认后写入 `assets/governance-insights.md`；`references/governance-insights.md` 只保留稳定模板和规则：

```markdown
## 治理洞见：{category} {subject}

**模式**：{跨多个治理周期观察到的共同模式}
**规则**：{蒸馏出的治理规则，1-2句}
**证据**：{支持的Pattern-Key数量，附capsule摘要}
**适用范围**：{何时应用此规则}
**来源**：{贡献的Pattern-Key列表}
```

### 维护规则

- 每次蒸馏前先读取 `assets/governance-insights.md` 现有内容
- 新洞见与已有洞见冲突时，以新的为准（更新规则），在洞见中标注更新日期
- `assets/governance-insights.md` 总条数超过 20 条时，建议在下次 Deep 模式中审查并清理过时洞见
- 所有蒸馏结果必须经用户确认后才能写入

## 治理反思（Governance Reflection）

条件触发，最多 1-2 条。无触发时不显示此节。

| 触发情形 | 反思内容 |
|---|---|
| verified 占比低于上次 Deep | 分析原因 |
| 同一 category 3+ volatile | 分析不稳定原因 |
| 停滞诊断与上次相同 | 根因未解决，建议调整 |
| 晋升被拒 2+ 次 | 分析门槛是否过严 |
| category 中 saturated >= 3 | 是否值得系统性固化 |

记录到 curate-history.jsonl：`pattern_key="_governance_reflection", action="verify", strategy="explore"`，反思内容写入 `detail`，不得使用 `action="reflect"`。

## 策略偏好（Strategy Hint，闭环反馈）

决策树给出多个可选操作时，参考 curate-history.jsonl 的历史数据：
1. 查该 Pattern-Key 自身的策略有效性（同 pattern_key 的历史 outcome）
2. 无自身数据时，查该类别的策略有效性（同 category 的聚合数据）
3. 偏好验证率最高的策略对应的操作类型
4. 无任何数据时，按默认决策树执行（不偏好任何策略）

**样本门槛**：只有同 category + strategy >= 5 条新格式记录时，strategy_hint 才能影响策略选择。样本不足时只输出"数据不足，仅观察"。

**优先级规则**：健康分层是硬约束（限定了允许的操作类别边界），strategy_hint 是软偏好（在允许的类别内选择具体操作）。两者冲突时以健康分层为准。
