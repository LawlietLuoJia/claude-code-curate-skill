# Pattern-Key 规则

每条知识生成一个稳定的语义键，用于去重和跨会话追踪。

## 格式

`{类别}:{核心主题}:{关键属性}`

## 类别定义

| 类别 | 含义 | 示例 |
|------|------|------|
| `tool` | 工具使用经验 | `tool:soffice:unavailable` |
| `skill` | Skill 使用心得 | `skill:deep-research:usage-tips` |
| `project` | 项目级事实 | `project:prd-version` |
| `format` | 格式/模板规范 | `format:font-spec` |
| `domain` | 领域知识 | `domain:basel3:credit-risk` |
| `workflow` | 工作流规则 | `workflow:daily-report:schedule` |
| `insight` | 个人洞察 | `insight:ai-trend:agent-system` |
| `decision` | 项目决策 | `decision:auth-middleware:compliance` |
| `code` | 编码知识 | `code:python:version-compat` |

## 生成规则

1. **类别**：从上表选择最匹配的类别
2. **核心主题**：提取知识的核心对象（工具名、项目名、技术名等），用短横线连接
3. **关键属性**：提取区分性属性（状态、版本、场景等）

**稳定性原则**：同一知识每次生成的 Pattern-Key 必须一致。不要因为措辞不同就生成不同的键。

## 去重流程

1. 为新知识生成 Pattern-Key
2. 搜索 `curate-history.jsonl` 中的已有 pattern_key
3. 搜索所有记忆文件中的 Pattern-Key（如果文件中有标注）
4. 匹配结果：
   - **匹配到**：递增 recurrence_count，更新 last_seen，合并内容到已有条目
   - **未匹配**：创建新条目，recurrence_count = 1

## 洞察胶囊

Pattern-Key 非首次出现时，在审计日志中生成 `capsule` 字段——1-2 句提炼：这个知识在本次实践中确认了什么事实或结论。

格式：`{事实}，{经验/结论}`。

示例：`"soffice 在 macOS 上持续不可用，rsvg-convert 是稳定替代方案"`

## 验证信号

回顾本次对话，判断该知识是否在本会话中被实际应用（影响了行为或决策）：
- 知识在本会话中被实际使用（如因为知道"用 uv 不用 pip"，主动选择了 uv）→ `validated: true`
- 知识仅被记录/合并/清理，未被实际应用 → 不设此字段
- 首次出现的知识 → 不设此字段

## 效果反馈

当 Pattern-Key 在历史记录中已有治理操作（action 为 promote/archive/delete/merge）时，判断上次决策的效果：
- 知识在后续使用中被确认有效 → `outcome: "verified"`
- 知识内容已与当前状态不符 → `outcome: "stale"`
- 治理决策与当前发现矛盾 → `outcome: "conflicting"`
- 上次操作为纯去重或首次出现 → 不设此字段

## 优先级排序

**Quick 模式**（启发式）：
- recurrence >= 2 标★（高优先）
- 历史中有 3+ 次 stale/conflicting 标⚠️（波动）
- 按 ★ > ⚠️ > 无标记 排序后续处理

**Deep 模式**（定量）：使用 evolution-rules.md 中的 priority_weight 公式和定量波动检测阈值。

## 交叉验证

变更涉及版本号或关键事实时，跨文件比对一致性（如 MEMORY.md 和 outputs.md 中的版本号引用、CLAUDE.md 中的技术栈版本 vs 实际环境）。发现不一致时生成 Pattern-Key 并修正过时条目。
