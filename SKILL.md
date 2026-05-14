---
name: curate
description: >
  Knowledge governance skill for non-programming and programming projects alike —
  audits, deduplicates, scores, and promotes knowledge across memory files, CLAUDE.md,
  docs/, outputs/, context/, and all project knowledge assets. Gets smarter over time
  via health scoring, pattern-key dedup, knowledge promotion, audit trails, and
  closed-loop strategy effectiveness feedback.
  在会话结束后手动触发，对项目的所有知识资产进行治理：健康评分、去重、晋升、审计。
  策略选择基于历史治理效果的闭环反馈，越用越精准。
  MUST trigger when the user says: "/curate", "/sync", "整理一下", "收尾", "归档",
  "同步知识", "同步一下", "治理一下", "盘点知识", "更新记忆", "梳理一下", "整理文档",
  "这个阶段做完了", "新人能直接上手", "sync up", "sync knowledge", "tidy up",
  "tidy up docs", "curate", or any phrase suggesting a knowledge cleanup after a work session.
  Also trigger when the user reports stale docs, conflicting memories, bloated knowledge files,
  or wants a systematic review of their project knowledge health. Bare "整理" / "tidy"
  with prior work context counts — do not under-trigger.
  Dual mode: Quick (5-step session wrap-up) and Deep (7-step full audit with scoring).
---

# Curate — 知识治理

你是**知识策展人**。你的工作不是往文件里追加内容——而是审查全局、合并重复、修正过期、删除废弃、识别高价值知识并推动它晋升到更持久的位置。每次治理后，整个知识体系应该比之前更干净、更准确、更有用。

> 过时记忆不会报错——只会让下一个 Agent 基于错误前提做决策。Curate 让知识体系保持健康，越用越聪明。

## TL;DR

1. Quick 模式（`/curate`）：盘点 → 识别变更 → 执行治理 → 自检 → 审计日志
2. Deep 模式（`/curate --deep`）：+健康评分 → +深度去重 → +晋升评估
3. 核心工具：Pattern-Key 去重 `{类别}:{主题}:{属性}` | 健康评分 6维/100分 | 审计日志 `curate-history.jsonl`
4. 关键原则：合并优于追加 | 删除优于保留 | docs→CLAUDE.md→memory 操作顺序

## 轻量路径（对话无实质产出时自动启用）

**触发条件**（三点全满足才走轻量路径，任一不满足→Quick 模式）：
1. 本次对话未产生任何产出物文件（无新文件、无文件修改）
2. 本次对话未做出任何影响知识体系的决策（无方向选择、无方案确认）
3. 盘点清单中无文件变更信号（无 .md 文件自上次 curate 后被修改）

跳过第二步到第三步，直接执行：
1. 快速自检：检查现有文件是否有过期/矛盾/膨胀
2. 输出健康审查摘要（3-5 行）
3. 写入审计日志（action: "no-op"）

## 三类知识，三种受众

**必须先理解这件事，否则你会只改 CLAUDE.md 就结束，把其他层的知识晾在那儿。**

| 位置 | 受众 | 职责 | 不同步的代价 |
|------|------|------|--------------|
| **Agent 记忆**（`memory/`） | Agent 自己跨会话复用 | 个人偏好、项目事实、工具经验 | 下次会话忘记历史决策 |
| **项目 CLAUDE.md** | 当前项目里的 AI | 项目约定、结构、红线、环境变量 | AI 在这个项目里走弯路 |
| **docs/ + README.md** | **其他人**（同事、下游、未来 AI） | 接入指南、架构、运维手册、API 参考 | 其他人无法正确接入或运维 |

这三层**受众不同，职责不重叠**。CLAUDE.md 写"新增了路由" ≠ docs/integration-guide.md 写"下游怎么接"——前者提醒自己，后者教别人。**两份都要写。**

## 模式判定

收到指令后，先确认模式再开始：

- 用户带 `--deep` → Deep 模式，先告知用户："即将执行完整 7 步审计（含健康评分、去重、晋升评估），预计需要 5-10 分钟"
- 用户明确说"没什么特别的"/"就是看了看"/"没做什么" → 轻量路径
- 其他 → Quick 模式

## 编辑原则（全模式通用）

- **合并优于追加**：新信息是对旧信息的更新，改旧条目，不要再加一条
- **删除优于保留**：完成的临时计划、推翻的决策、过期的上下文，删掉
- **精确优于冗长**：一条记忆说清楚一件事，别塞三件
- **绝对时间**：永远 `2026-04-29`，不写"今天"、"最近"
- **面向读者**：docs/ 的读者是"第一次接触这个项目的外部人"，写的时候想象对方只有 5 分钟能看完
- **受众不混**：CLAUDE.md 里不抄 docs/ 的全文，docs/ 里不写"我记得上次……"——这是记忆的事
- **全局配置极度克制**：`~/.claude/CLAUDE.md` 只有用户在对话中明确表达了跨项目的核心原则才动。日常项目细节绝不进全局
- **不膨胀原则**：每新增一条，检查是否可以合并到已有条目
- **交叉验证**：变更涉及版本号或关键事实时，跨文件比对一致性（如 MEMORY.md 和 outputs.md 中的版本号）

### CLAUDE.md 内容准入判断

每次向 CLAUDE.md 新增内容前，问一句：**下次 AI 写代码时如果没看到这条，会不会犯错？**

| 例子 | 进 CLAUDE.md？ | 理由 |
|---|---|---|
| "Prisma 查询只写在 `modules/**/data/`" | ✅ | 违反就是边界破坏，AI 必须看到 |
| "rsync 单文件部署必须用完整 target 路径" | ✅ | 踩坑警示，会再次踩 |
| "禁止裸跑 systemctl stop aihot-worker" | ✅ | 红线，事故级 |
| "新增了 X 路由，详见 docs/ARCHITECTURE.md" | ❌ | 详细机制在 docs；AI 改到这块自然会读 docs |
| "X 时刻起 Y 功能上线" | ❌ | 历史叙事，归 git log / docs/CHANGES.md |
| "修了 X bug 的复盘细节" | ❌ | 单次事故记忆，归 memory 或删除 |

✅ 该进：硬边界规则、禁止事项、命令速查、权限模型、踩坑警示。
❌ 不该进：历史叙事、详细机制说明、单次事故复盘、变更日志。

完整的反模式识别表见 **[references/anti-patterns.md](references/anti-patterns.md)**。

## 通用自检清单

每次治理后逐项检查：

**反膨胀检查（先查这组，不达标回头先精简）**：
- [ ] CLAUDE.md 净涨幅 ≤ 30 行（超了就是塞了历史叙事，回去删/迁 docs）
- [ ] 无新增 blockquote 历史叙事条目（"X 时刻起 Y 上线"形式）
- [ ] CLAUDE.md 未抄 docs/ 已有的详细机制说明
- [ ] 单条 memory 文件未超 ~100 行（超了拆/删）

**完整性检查**：
- [ ] 盘点列出的每个文件都判断了"无需更改"或"已更新"
- [ ] 知识总量（总行数/总文件数）≤ 整理前（不膨胀）
- [ ] 无矛盾条目（同一主题不应有两种说法）
- [ ] 无相对时间遗留（`grep -E "今天|昨天|刚刚|最近|上周|today|yesterday|recently"` 应为零）
- [ ] 记忆索引中的每个链接指向存在的文件
- [ ] frontmatter 格式与项目其他文件一致
- [ ] 受众匹配正确（CLAUDE.md 写项目约定，docs/ 写外部指南，memory/ 写 Agent 个人知识）
- [ ] 跨项目检查：本次对话是否跨项目？如果是，上下游的 docs 都要对齐
- [ ] **治理有效性**：若第二步识别到变更信号但第三步执行操作数为 0，在审计日志中标注 `action: "no-change-signal-detected"`。连续 3 次以上出现此标记 → 治理规则可能过于保守，下次 Deep 模式考虑调整策略
- [ ] **影响半径确认**：blast_radius.level = "high" 时已触发用户确认（预览门限 + 策略降级）

Deep 模式额外项：
- [ ] 健康评分报告已在修改前输出
- [ ] 晋升操作已获用户确认
- [ ] 审计日志中记录了 health_score 字段

## 第零步：尺寸体检（防膨胀）

> **Input**: 项目根目录路径. **Output**: 超尺寸清单（文件+当前行数+上限+问题类型）

任何治理动作之前，先检查关键文件尺寸：

| 文件 | Soft limit | 超过怎么办 |
|---|---|---|
| `CLAUDE.md` | ~300 行 / ~15KB | 先做精简：扫顶部 blockquote / 历史叙事段 → 删/迁 docs；项目概览只留 1-3 行 + 关键速查表 |
| 记忆索引（`MEMORY.md`） | ~150 行 | 找已被新版本取代的、单次事故复盘、可读代码代替的 → 删 |
| 单条 memory 文件 | ~100 行 | 通常在塞多件事/写事故复盘 → 拆或删 |
| `docs/<single>.md` | ~1500 行 | 切分成多文件，加目录索引 |

**超尺寸是治理的最高优先级，大于"补本次会话漏掉的同步"。** 原因：超尺寸的 CLAUDE.md 让下次 AI 看不到真正重要的规则（被叙事挤到 prompt 之外）。

**Step 0 输出格式**（供 Step 3 Phase 1 消费）：

```
超尺寸清单:
- {file: "CLAUDE.md", current: 350, limit: 300, issue: "blockquote叙事"}
- {file: "memory/outputs.md", current: 120, limit: 100, issue: "事故复盘膨胀"}
```

**执行顺序**：先精简（破除膨胀）→ 再做增量同步（补漏）。两件事不能合并——精简时心态是"什么不该在这"，补漏时心态是"什么该补到这"，混着做两头不到位。

## 双模式

用户通过参数选择模式：

- **Quick 模式**（`/curate`）：会话后快速整理，5 步完成
- **Deep 模式**（`/curate --deep`）：全面审计，7 步完成，含评分和晋升

如果用户没有指定 `--deep`，默认走 Quick 模式。

### 参考文档加载策略（Quick/Deep 共用）

按需读取，不预加载。不要"以防万一"全读——每份 reference 约 100-130 行，多读一份就多消耗一份 context。

| 条件 | 读取 | 跳过 |
|------|------|------|
| 任何变更 | knowledge-matrix.md | — |
| 涉及去重/分类判断 | +promotion-rules.md | — |
| 编码变更 | +change-matrix.md | content-matrix.md |
| 内容变更 | +content-matrix.md | change-matrix.md |
| 混合变更 | +change-matrix.md +content-matrix.md | — |
| 纯产出索引/简单决策 | — | promotion-rules + 两个 matrix 都跳过 |
| Step 0 发现超尺寸 | +anti-patterns.md | — |
| Quick 模式 | — | health-scoring.md |
| 写入审计日志时 | +audit-fields.md | — |

---

## Quick 模式（5 步）

### 第一步：盘点现状

> **Input**: 项目根目录、记忆目录路径、对话历史. **Output**: 盘点清单（文件列表 + 状态标记）

先枚举，再判断。不要跳过。**优先级**：先做 2 和 4（记忆扫描 + 对话回顾，影响最大），再做 1 和 3。单文件变更可跳过 find 兜底扫描。

1. **扫描知识文件**（对当前项目执行）：
   - `ls <project-root>/` → 确认根目录结构
   - `ls <project-root>/docs/ 2>/dev/null` → 枚举所有文档
   - `ls <project-root>/outputs/ 2>/dev/null` → 枚举所有产出物
   - `ls <project-root>/context/ 2>/dev/null` → 枚举领域知识
   - `find <project-root> -maxdepth 2 -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*"` → 兜底
   - 读 `CLAUDE.md`、`README.md`、关键 `.md` 文件

2. **扫描记忆文件**（如果当前平台是 Claude Code）：
   - 找到 `~/.claude/projects/<hash>/memory/` 目录
   - 读 `MEMORY.md`（索引文件）和所有被引用的记忆 `.md`
   - 检查每个文件是否有 frontmatter、最后更新时间

3. **读取治理历史**：
   - 读 `~/.claude/skills/curate/assets/curate-history.jsonl`（如果存在）
   - 取最后 10 条记录，了解近期治理活动
   - **策略有效性提取**（约5秒，数据已在内存中）：从已读取的记录中，按 pattern_key 类别分组统计各策略的 `outcome` 分布。计算每个 {类别, 策略} 组合的 verified 率（outcome="verified" 次数 / 有 outcome 的总次数）。存为内部变量 `strategy_hint = {category: {strategy: verified_rate, ...}, ...}`，供第三步参考。不足 5 条记录的类别不计算（数据量不够，不可靠）。
   - 对比当前文件列表与上次盘点，标记新增/变更/删除的文件

4. **回顾本次对话**：提取做了什么工作、产生了什么产出、做了什么决策、发现了什么新知识

输出一张内部清单，每个文件标注「已评估 / 需更新 / 无需更改」。

**盘点确认**：盘点完成后输出文件清单和变更信号摘要。盘点结果为空（无文件、无记忆、无变更信号）时建议走轻量路径。

### 第二步：识别会话变更

> **Input**: 盘点清单 + 对话信号. **Output**: 变更信号列表（按5类分类，含Pattern-Key）

**跳过条件**：对话中未产生任何 5 类信号（产出物、决策、发现、知识更新、待办），且无用户指定治理目标。

按「参考文档加载策略」选择加载的参考文件。

#### 分析流程

回顾本次对话，对每一项变更执行以下分析：

1. **提取变更信号**：从对话中识别以下 5 类信号（优先关注用户明确提到的内容，忽略纯探索性的中间步骤）：
   - **产出物**：新创建或修改的文件（PRD、PPT、文章、代码等）
   - **决策**：方向选择、方案确认、优先级调整
   - **发现**：工具使用技巧、踩坑经验、方法论洞察
   - **知识更新**：业务规则变化、技术栈调整、环境变更
   - **待办/承诺**：用户提到的后续计划或承诺事项

2. **分类**：根据知识类型确定存储位置和影响范围。分类时必须读取 [references/knowledge-matrix.md](references/knowledge-matrix.md)。
3. **影响分析**：根据上方的加载清单，按变更类型读取对应的变更矩阵（change-matrix.md 或 content-matrix.md），判断该变更影响了哪些关联文件和具体段落需要同步更新。纯产出索引或简单决策不需要读任何变更矩阵，直接跳到去重检查。
4. **去重检查**：为每项新知识生成 Pattern-Key，搜索已有文件中是否有匹配。Pattern-Key 类别定义和生成规则见 [references/promotion-rules.md](references/promotion-rules.md)。**复用已有 key，不要重新造**。新 key 在 curate-history.jsonl 中出现 ≥3 次时，下次 Deep 模式加入示例库。

   **Pattern-Key 格式**：`{scope}:{subject}:{attribute}`
   - `tool:uv:package-management` — 工具经验，跨项目适用
   - `format:changelog:blockquote` — 反模式，CLAUDE.md 历史叙事
   - `project:prd-version` — 项目事实，版本追踪
   - `skill:curate:trigger` — Skill 使用经验

   **洞察胶囊**（Pattern-Key 非首次出现时）：在审计日志中生成 `capsule` 字段——1-2 句提炼：这个知识在本次实践中确认了什么事实或结论。格式：`{事实}，{经验/结论}`。

   **验证信号**：回顾本次对话，判断该知识是否在本会话中被实际应用（影响了行为或决策）。如果是，在审计日志中设 `validated: true`。判断依据：
   - 知识在本会话中被实际使用（如因为知道"用 uv 不用 pip"，主动选择了 uv）→ `true`
   - 知识仅被记录/合并/清理，未被实际应用 → 不设此字段
   - 首次出现的知识 → 不设此字段

   **效果反馈**：当 Pattern-Key 在历史记录中已有治理操作（action 为 promote/archive/delete/merge）时，判断上次决策的效果：
   - 知识在后续使用中被确认有效 → `outcome: "verified"`
   - 知识内容已与当前状态不符 → `outcome: "stale"`
   - 治理决策与当前发现矛盾 → `outcome: "conflicting"`
   - 上次操作为纯去重或首次出现 → 不设此字段

   **进化信号识别**：当 Pattern-Key 的 recurrence >= 3 时，按 promotion-rules.md「进化标记」章节的识别信号表检测是否有新学习。仅在确实有新发现时记录 evolution 子字段（refined/context/avoid），无增量则跳过。

5. **交叉验证**：变更涉及版本号或关键事实时，跨文件比对一致性（如 MEMORY.md 和 outputs.md 中的版本号引用、CLAUDE.md 中的技术栈版本 vs 实际环境）。发现不一致时生成 Pattern-Key 并修正过时条目。

6. **优先级排序**（启发式）：recurrence >= 2 标★（高优先），历史中有 3+ 次 stale/conflicting 标⚠️（波动）。按 ★ > ⚠️ > 无标记 排序后续处理。
   Deep 模式使用完整的 priority_weight 公式和定量波动检测阈值，见 Deep 第三步。

### 第三步：执行治理操作

> **Input**: 变更信号列表 + 超尺寸清单. **Output**: 已修改文件列表（含操作类型和Pattern-Key）

**跳过条件**：第二步识别出 0 项需要变更的内容。直接输出"无需治理"并进入第五步。

**真的用 Edit/Write 工具操作文件，不要只描述。**

**操作预览**（3 项以上变更时必须，3 项以下可选）：在动手之前，先输出操作计划表：

| # | 操作 | 目标文件 | Pattern-Key | 理由 |
|---|------|---------|-------------|------|
| 1 | merge | docs/api.md | tool:akshare:datasource | 更新数据源说明 |

等用户确认 "OK" 或 "执行" 后再开始操作。如果用户说 "不用问了直接做"，本次会话后续跳过预览。

**影响半径**（Blast Radius）：在执行前估算本次治理的影响范围。对每项操作统计涉及的文件数和预估行数变更，计算影响等级：
- `low`（1-2 文件，≤30 行）→ 正常执行
- `medium`（3-5 文件，≤100 行）→ 触发预览门限
- `high`（>5 文件或 >100 行）→ 触发预览门限 + 策略降级（balanced→harden，更保守执行）

此规则替代原来的"3项以上变更触发预览"，改为按影响范围而非数量判断。记录到审计日志的 `blast_radius` 字段。

**策略标签**（Strategy Tag）：为每个治理动作标注策略意图：
- `repair`（修复）：删除过时、修正错误、修复断裂链接
- `optimize`（优化）：合并重复、精简冗余、去重、晋升
- `innovate`（创新）：新增知识条目、创建新文档
- `explore`（探索）：识别缺口、发现孤立文件、评估健康

记录到审计日志的 `strategy` 字段。在输出摘要中按策略标签分组展示，替代按操作类型统计。

**策略偏好**（Strategy Hint，闭环反馈）：
决策树给出多个可选操作时（如"可合并"或"可重写"），参考第一步提取的 strategy_hint：
1. 查该 Pattern-Key 自身的策略有效性（同 pattern_key 的历史 outcome）
2. 无自身数据时，查该类别的策略有效性（同 category 的聚合数据）
3. 偏好验证率最高的策略对应的操作类型
4. 无任何数据时，按默认决策树执行（不偏好任何策略）

示例：Pattern-Key `tool:xxx:yyy`，类别 `tool`。strategy_hint 显示 tool 类别的 verified_rate：optimize=80%, repair=20% → 当决策树允许 merge 或 delete 时，偏好 merge。

**停滞回避**（Stagnation Avoidance）：在决策树执行前，检查 Pattern-Key 是否有 `stagnation_signal`：
- 有 `stagnation_signal` 的 Pattern-Key → **策略降级**：innovate→repair, optimize→repair, repair→skip
- 有 `stagnation_signal` 的 Pattern-Key → **禁止晋升**，即使 recurrence 满足条件
- 降级后在 detail 中说明降级原因（如"连续2次stale，降级为repair"）

**两阶段执行顺序**（不能合并）：

1. **阶段一（精简）**：处理第零步发现的超尺寸问题——删/迁膨胀内容、清理反模式（参考 [references/anti-patterns.md](references/anti-patterns.md)）。心态是"什么不该在这"
2. **阶段二（补漏）**：按 docs/（外部影响最大）→ CLAUDE.md → memory 顺序做增量同步。心态是"什么该补到这"

对每项变更，用以下决策树选择操作：

```
新知识与已有条目相关？
├── 是 → Pattern-Key 匹配到？
│   ├── 是 → 去重（dedup）：合并内容，递增计数
│   └── 否 → 更新（merge）：修改旧条目，不追加
└── 否 → 全新知识 → 创建（create）

已有条目是否过时？
├── 完全过时，无参考价值 → 删除（delete）⚠️ 需确认
├── 部分过时，仍有参考价值 → 归档（archive）
└── 仍然有效 → 保留
```

- **删除（delete）⚠️**：涉及删除整个文件或整个条目时，先列出待删除清单，等用户确认后再执行。小范围修改（如删除一个段落）可直接操作
- **晋升（promote）**：Quick 模式下仅标记"可晋升"，不执行晋升操作

**编辑原则**：遵循上方「编辑原则（全模式通用）」。

**新增判断**：

值得新增：项目特有的命令/工作流、踩坑经验、模块依赖、有效测试方法、配置怪癖。

不值得新增：代码名已自解释的显而易见信息、通用最佳实践（非项目特有）、一次性修复（不会重复出现）、冗长解释（一行能说清却写了三行）。

**变更展示**：对每项修改，在操作前简要说明——改哪个文件、改什么、为什么改。

### 第四步：自检

> **Input**: 已修改文件列表. **Output**: 自检通过/不通过（不通过时回补）

执行「通用自检清单」全部检查项。
- [ ] **编码项目额外检查**（仅当项目包含活跃代码开发时）：如果第二步已加载 change-matrix.md，复用已有内容；否则按需读取 [references/change-matrix.md](references/change-matrix.md) 的"编码专属自检项"和"代码真实性验证"，逐条过一遍。纯文档/Agent 项目跳过此步，在自检结果中标注"非编码项目，跳过编码专属检查"

哪条不过，回去补。

### 第五步：记录审计日志并输出摘要

> **Input**: 已修改文件列表 + 自检结果. **Output**: 审计日志条目 + 用户可见变更摘要

1. **写入审计日志**：对每项操作，向 `~/.claude/skills/curate/assets/curate-history.jsonl` 追加一行 JSON：
   ```json
   {"ts":"2026-04-29T17:30:00+08:00","mode":"quick","pattern_key":"tool:soffice:unavailable","action":"archive","target":"memory/tech-notes.md","detail":"归档过时备忘：已安装LibreOffice","health_score":null,"capsule":"soffice 在 macOS 上持续不可用，rsvg-convert 是稳定替代方案","validated":true,"outcome":"stale"}
   ```

   **标记检查 + 字段定义**：详见 [references/audit-fields.md](references/audit-fields.md)。必填字段：ts, mode, pattern_key, action, target, detail。可选字段（capsule, validated, outcome, strategy, blast_radius, evolution, distill_ready, stagnation_signal）按触发条件生成。

2. **输出变更摘要**（给用户看）：
   ```
   ## Curate Quick 完成

   ### 变更（按策略标签分组）
   - repair：xxx（原因）
   - optimize：xxx（合并到已有条目）
   - innovate：xxx（原因）
   - explore：xxx（原因）

   ### 可晋升
   - ★ [类别:主题:属性] trust_tier=proven，出现N次，验证M次
   - ☆ [类别:主题:属性] trust_tier=emerging，出现N次，需确认
   - ⚠️ 波动: [类别:主题:属性] 出现N次，M次stale/conflicting，建议重写或删除

   ### 进化观察
> 从 curate-history.jsonl 中过滤 pattern_key，按进化状态分组展示。无符合条件时显示"无"。

| 标记 | 条件 | 示例 |
|------|------|------|
| 🟢 watch | recurrence=1 且 validated=true | [tool:xxx:yyy] validated:1，首次出现 |
| 🟡 approaching | recurrence>=2，未晋升，按 validated > capsule > 无 排序 | [tool:xxx:yyy] 2次，capsule:有 → 接近晋升 |
| ⬛ stagnant | recurrence>=3 且 validated=0 且 capsule=无 | — |
| ⬜ plateau | 连续>=4次 verified，无 evolution 变化 | — |
| 💎 prime | proven 且最近有 evolution/capsule 变化 | [tool:xxx:yyy] proven，evolution.refined 更新 |

### 未处理
   - xxx（需要用户确认）
   ```

只列有实际变更的条目。没改的不写。

---

## Deep 模式（7 步）

Deep 模式是完整的 7 步独立流程。每步均自含说明。流程：盘点 → 健康评分 → 识别变更+治理 → 深度去重 → 晋升评估 → 自检 → 审计日志+报告

### 第一步：盘点现状

> **Input**: 项目根目录、记忆目录路径、对话历史. **Output**: 盘点清单（文件列表 + 状态标记）

执行 Quick 第一步的盘点流程（扫描知识文件、记忆文件、治理历史、回顾对话）。**盘点确认**：盘点结果为空时建议走轻量路径。

### 第二步：健康评分

> **Input**: 盘点清单 + health-scoring.md + knowledge-matrix.md. **Output**: 6维健康评分报告（含趋势对比）

读取 [references/health-scoring.md](references/health-scoring.md)，按 6 维度对当前知识体系打分。评分「完整性」维度需同时读取 [references/knowledge-matrix.md](references/knowledge-matrix.md) 以确认7种知识类型的覆盖情况。

**评分输出**（在执行任何修改之前输出）：
```
📊 知识体系健康报告
━━━━━━━━━━━━━━━━━
总分: 72/100 (B)

完整性 16/20 ✓ 产出物记录完整
时效性 12/20 ⚠ 3个文件超过30天未更新
一致性 13/15 ✓ 术语统一
精简性  8/15 ⚠ MEMORY.md 达到180行，接近上限
可操作性 12/15 ✓ 大部分条目可操作
组织性 11/15 ⚠ 2个文件缺少frontmatter

问题清单:
1. [时效性] outputs.md 最后更新于 2026-03-15，超过30天
2. [精简性] MEMORY.md 达到180行，建议拆分内联内容
3. [组织性] 2个记忆文件缺少frontmatter

趋势: ↑2 (上次70分, 2026-04-20)
```

### 第三步：识别变更并执行治理

> **Input**: 健康评分 + 盘点清单 + 对话信号 + 超尺寸清单. **Output**: 已修改文件列表（按策略层级执行）

根据第二步的健康评分选择治理策略，然后识别变更、执行治理。

按「参考文档加载策略」选择加载的参考文件。

**编辑原则**：遵循上方「编辑原则（全模式通用）」。

**定量分析**（Deep 独有）：识别变更时使用完整的 priority_weight 公式排序和定量波动检测，而非 Quick 模式的启发式规则。
   ```
   priority_weight = recurrence_count × (1 + 0.2 × validated_count - 0.3 × volatile_count)
   ```
   标记：★ (>3.0 高优先) / ☆ (1.0-3.0 中) / 无标记 (<1.0 低)。波动条件：历史 >=3 条，stale+conflicting 占比 >= 40%。

- **健康分 < 50（repair-only）**：只做：删除过期条目、修复断裂链接、修正矛盾版本号。不做：晋升评估、知识体系优化建议、跨文件重构。
- **健康分 50-75（harden）**：在 repair 基础上增加：合并重复条目、补全缺失 frontmatter、精简超尺寸文件。
- **健康分 > 75（balanced）**：全量治理：以上全部 + 晋升评估 + 跨文件一致性检查 + 知识体系优化建议。

**策略偏好同样适用**：在上述策略层级内，具体操作的选择仍受 strategy_hint 影响（同 Quick Step 3 的策略偏好机制）。

**停滞回避**（Deep 版本）：对有 `stagnation_signal` 的 Pattern-Key 执行增强处理：
- `repeated_stale` → 检查知识是否已永久失效（如工具已被替代、环境已变更），是则归档，否则标注"等待下次验证"
- `repeated_conflict` → 标注为"需用户决策"，在治理报告中列出矛盾点供用户选择
- `no_progress` → 进入停滞诊断流程（复用第五步的4种诊断），在本步先做初步分类

这确保治理精力花在刀刃上——知识体系状态差时不浪费时间做"锦上添花"。

### 第四步：深度去重扫描

> **Input**: 全部知识文件. **Output**: 去重报告（语义重复组/孤儿条目/断裂链接）

交叉比对所有知识文件，找出：

1. **语义重复**：不同文件中有相同或高度相似的条目 → 合并
2. **孤儿条目**：未被任何索引文件引用、未被任何文件链接的孤立知识 → 纳入索引或归档
3. **断裂链接**：引用了不存在的文件或章节 → 修复或删除引用

对每个发现，生成 Pattern-Key 并记录操作。

### 第五步：知识晋升评估

> **Input**: curate-history.jsonl + promotion-rules.md + 去重报告. **Output**: 晋升建议清单（等用户确认）

读取 [references/promotion-rules.md](references/promotion-rules.md)，执行晋升评估。

1. 从 `curate-history.jsonl` 中统计每个 pattern_key 的出现次数
2. **晋升评估流程**（按 promotion-rules.md 的晋升条件、活跃度评估、信任分级执行）：
   - 晋升门槛：频次 ≥ 3，持久性、一致性、受众判断（详见 PR「晋升条件」章节）
   - 信任评估：trust_score、trust_tier、volatile 检测（详见 PR「活跃度评估」章节）
   - 进化标记：检查 evolution 子字段完整度（详见 PR「进化标记」章节）
   - 效果反馈：verified 占比 >= 50% 的 proven 知识标记"经验证可靠"双标签
3. **输出晋升建议清单**（不自动执行，等用户确认）：
   ```
   📋 知识晋升建议

   1. [tool:uv:package-management] 出现5次(validated:2, outcome:verified 3次) → 建议晋升到全局 CLAUDE.md
      理由：跨项目适用的包管理规则，2次实践验证 [经验证可靠]
      确认？(y/n)

   2. [project:prd-version] 出现3次(validated:0,capsule:有) → 建议晋升到项目 CLAUDE.md
      理由：PRD 版本信息对项目持续有价值
      确认？(y/n)

   ⚠️ 疑似停滞（已诊断）:
   3. [tool:xxx:yyy] 出现3次(validated:0,capsule:无)
      诊断：内容漂移 — 历史记录中描述持续变化（从"尝试A"到"改用B"到"最终C"）
      建议：等待内容稳定后再评估，下1次出现时重新确认

   4. [format:old-workflow:deprecated] 出现4次(validated:0,capsule:无)
      诊断：真正停滞 — 4次记录内容几乎相同，从未被实际使用
      建议：归档（删除源文件中的条目）
   ```

   **停滞诊断**（对 recurrence>=3 且 validated=0 且 capsule=无 的条目）：执行 promotion-rules.md 定义的停滞诊断流程（4种诊断类型 + 判断流程）。

4. 用户确认后执行晋升，将内容写入目标文件并从源文件中标记或删除

5. **模式蒸馏（Synthesis Scan）**：执行 promotion-rules.md 定义的模式蒸馏流程（触发条件、执行步骤、输出格式、写入规则）。无 `distill_ready=true` 的 Pattern-Key 时跳过，在报告中标注"无符合条件的蒸馏候选"。

### 第六步：自检

> **Input**: 已修改文件列表 + 晋升操作记录. **Output**: 自检通过/不通过（含Deep额外项）

执行「通用自检清单」全部检查项（含 Deep 额外项）。哪条不过，回去补。

### 第七步：记录审计日志并输出治理报告

> **Input**: 全部操作记录 + 健康评分 + 去重报告 + 晋升记录. **Output**: 审计日志条目 + 完整治理报告

审计日志格式与 Quick 相同（每项操作一行 JSON），但 `health_score` 字段填入当前评分。

**输出治理报告**：完整报告格式见 **[references/deep-output-format.md](references/deep-output-format.md)**，包含：健康评分对比、变更（按策略分组）、深度扫描结果、待关注项、volatile 条目、进化观察（watch/approaching/stagnant/plateau/saturated/prime）、进化与蒸馏、信号分析（停滞+平台期合并）、策略有效性、审计模式分析（能力缺口/策略漂移/跨类别依赖）、治理反思、下次建议。

---

## 特殊情况

**对话没有产生新知识**：仍然执行盘点和自检——审查现有知识是否过期/冲突/膨胀，这本身就是有价值的。

**记忆之间出现矛盾**：按可验证性分级处理——磁盘文件、git 历史等外部事实能确定哪个是对的，就自主修正过时条目（如版本号 v3.7 vs v3.8，磁盘只有 v3.8 则修正 v3.7→v3.8）。没有外部事实可判定（主观决策冲突、两版说法都有道理），列在「未处理」让用户决定。

**发现之前的治理漏了东西**：修掉。你是这个项目的持续策展人，过去的遗漏也归你管。

**全新项目（无 CLAUDE.md）**：判断是否到了"有可交付成果"的阶段。是 → 建议创建基础文档结构（CLAUDE.md + docs/ + README.md）。还在探索阶段 → 跳过，在摘要中提一句。无 memory/ 目录时跳过记忆扫描（第一步第 2 步），在盘点清单中标注。无 curate-history.jsonl 时创建新文件并写入初始记录。

**知识体量极小（<5 个文件）**：简化和压缩流程步骤，但核心检查不省略。

**大型项目（>50 个 .md 文件）**：盘点阶段用以下命令仅扫描最近 7 天内修改的文件，而非全量遍历：
```bash
find <project-root> -maxdepth 3 -name "*.md" -mtime -7 -not -path "*/node_modules/*" -not -path "*/.git/*"
```
在摘要中标注"大型项目模式：仅扫描近期变更，建议定期 --deep 全量审计"。

**用户中断执行**：已完成操作保留（不回滚），未执行项记录到「未处理」清单。在审计日志中追加一行 `{"action":"interrupt","detail":"用户中断，N项未执行"}`。

**docs/ 或 outputs/ 目录不存在**：跳过该目录扫描，在盘点清单中标注。如果本应产生该目录内容（如项目有编码产出但无 docs/），在摘要末尾建议"项目缺少 docs/ 目录，建议补充项目文档结构"。

**多会话并发编辑**：如果 curate-history.jsonl 最新记录的时间戳在 5 分钟内，提示用户"检测到近期有其他治理操作（时间戳），可能有并发编辑。是否继续？"用户确认后再执行。

**curate-history.jsonl 不存在**：首次运行，创建文件并写入初始记录。无需对比历史。

**curate-history.jsonl 损坏**（JSON 解析失败）：跳过历史对比，正常执行治理流程，在摘要中提示用户日志文件可能需要修复。

**工具操作失败**（Edit/Write 报错）：跳过失败操作，记录到「未处理」清单，继续处理其余变更。在摘要中明确列出失败项和建议的手动处理方式。不因单个操作失败而中断整个治理流程。

**memory/ 目录不存在**：跳过记忆扫描步骤（第一步的第 2 步），在盘点清单中标注 "无记忆文件（非 Claude Code 项目或首次使用）"，继续处理项目级文件。

## 参考资料

- **[references/health-scoring.md](references/health-scoring.md)** — 健康评分 6 维度详细规则
- **[references/anti-patterns.md](references/anti-patterns.md)** — CLAUDE.md/记忆反向清理：7 种反模式识别
- **[references/change-matrix.md](references/change-matrix.md)** — 编码变更影响矩阵
- **[references/content-matrix.md](references/content-matrix.md)** — 通用内容变更影响矩阵
- **[references/knowledge-matrix.md](references/knowledge-matrix.md)** — 知识类型分类、治理策略、晋升路径
- **[references/promotion-rules.md](references/promotion-rules.md)** — 知识晋升规则和 Pattern-Key 详细说明
- **[references/governance-insights.md](references/governance-insights.md)** — Deep 模式蒸馏产出的治理洞见
- **[references/audit-fields.md](references/audit-fields.md)** — 审计日志标记检查和字段定义
- **[references/deep-output-format.md](references/deep-output-format.md)** — Deep 模式完整治理报告格式（按需加载）
