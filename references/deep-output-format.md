# Deep 模式治理报告格式

Deep 模式第七步的完整输出格式。仅在 Deep 模式执行时按需加载。

## 报告模板

```
## Curate Deep 完成

### 健康评分
- 本次: {score}/100 ({grade})
- 上次: {prev_score}/100 ({prev_grade}) — {delta_arrow}{delta}

### 变更（按策略标签分组）
- repair：xxx（删除过时条目、修正错误链接）
- optimize：xxx（合并N条重复）
- innovate：xxx（新增知识条目）
- explore：xxx（识别知识缺口）
- 晋升：xxx → [目标位置]

### 深度扫描
- 语义重复：发现N组，已合并N组
- 孤儿条目：发现N条，已处理N条
- 断裂链接：发现N处，已修复N处

### 待关注
- [时效性] xxx 文件需要审查
- [精简性] MEMORY.md 接近上限，建议下次拆分
- [信任] [tool:xxx] trust_tier=untested，出现3次但无实践验证
- [波动] ⚠️ [tool:xxx] volatile=true，建议重写或删除
- [效果] [tool:xxx] verified占比60%，trust_tier=proven，晋升优先级最高

### 需重写/删除（volatile）
- [类别:主题:属性] — volatile_ratio=50%，建议: {重写/删除}

### 进化观察
按 evolution-rules.md「进化状态标识」分组，每个分组按格式模板输出：
- 🟢 watch | 🟡 approaching | ⬛ stagnant | ⬜ plateau | 🔵 saturated | 💎 prime
- 每个分组：列出匹配的 Pattern-Key + 状态摘要；无符合条件时显示"无"

### 进化与蒸馏
> 从 curate-history.jsonl 聚合。知识体系演化全貌 + 蒸馏产出。

**活跃领域**：{category}({N}个prime)在本周期持续积累
**稳定领域**：{category}已{N}次无变化，知识已固化
**进化中的知识**：
- [pattern_key] 从"{旧描述}"精炼为"{新描述}" -> 进化完整度 {N}/3
- [pattern_key] 已 proven 但仅 {N}/3 evolution 字段 -> prime
**停滞风险**：无新增 stagnant（上次 N 条已处理）
**治理趋势**：verified 占比从 {上次}% 升至 {本次}%，{趋势描述}
**蒸馏结果**：治理洞见N条（经确认后写入 assets/governance-insights.md）/ 无候选（跳过）

生成逻辑（从 JSONL 聚合）：
1. 统计各 category 中 proven/emerging/prime 的数量 -> "活跃领域"
2. 找 proven 且无 evolution 变化的 -> "稳定领域"
3. 找有 evolution 子字段变化的 -> "进化中的知识"
4. 统计 stagnant 数量变化 -> "停滞风险"
5. 计算 verified 占比趋势 -> "治理趋势"

### 信号分析
> 合并停滞回避（负面信号）和平台期检测（正面信号）。

**负面信号**：
- [类别:主题:属性] stagnation_signal=repeated_stale → {处理结果}

**正面信号**：
- [tool:xxx:yyy] stable_plateau，连续N次verified → 建议：提升为治理洞见/固化到docs/维持观察
- [format:xxx:zzz] success_saturated，verified_rate=90% → 建议固化到docs

无信号时显示"无停滞条目"和"无平台期条目"。

### 策略有效性
> 各类别的策略效果对比。

| 类别 | 最佳策略 | 验证率 | 次优策略 | 验证率 | 样本量 |
|------|---------|--------|---------|--------|--------|
| tool | optimize | 80% | repair | 20% | 12 |

**趋势**：与上次 Deep 模式对比（↑↓→）。
样本量不足（<5）标注"数据不足"。

### 审计模式分析
> 前置条件：curate-history.jsonl >= 20 条记录。不足时跳过。

**1. 能力缺口**：innovate_rate > 40% 且 validated_rate < 30% 且记录 >= 5
→ `⚠️ 能力缺口：{category} — 创新率{X}%但验证率仅{Y}%`

**2. 策略漂移**：前后半段策略占比差 >= 30个百分点
→ `📊 策略漂移：{strategy} 从{X}%变为{Y}%`

**3. 跨类别依赖**：共现率 >= 40% 且各自 >= 5 条
→ `🔗 跨类别依赖：{cat_A} ↔ {cat_B} — 共现率{X}%`

### 治理反思
> 条件触发，最多1-2条。无触发时不显示此节。

| 触发情形 | 反思内容 |
|---|---|
| verified 占比低于上次 Deep | 分析原因 |
| 同一 category 3+ volatile | 分析不稳定原因 |
| 停滞诊断与上次相同 | 根因未解决，建议调整 |
| 晋升被拒 2+ 次 | 分析门槛是否过严 |
| category 中 saturated >= 3 | 是否值得系统性固化 |

记录到 curate-history.jsonl：`pattern_key="_governance_reflection", action="verify", strategy="explore"`

### 下次建议
- 考虑对 xxx 进行全面重写
- xxx 领域需要补充方法论文档
```
