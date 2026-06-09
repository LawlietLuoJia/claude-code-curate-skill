# CLAUDE.md / 记忆反向清理：反模式识别表

识别 CLAUDE.md 和记忆文件中应删除或迁移的反模式。与 Pattern-Key 去重体系配合使用——去重处理"重复"，反模式处理"不该存在"。

## 判断标准

**这条信息在下次 AI 写代码时如果没看到，会犯错吗？** 不会 → 删或迁。

## 反模式清单

### 1. Blockquote 历史叙事

| 特征 | "X 时刻起 Y 功能上线，详见 docs/Z.md" 形式的 blockquote |
|------|------|
| **识别** | CLAUDE.md 顶部/中间出现 `> 202X-XX-XX ...` 或带日期的叙事段落 |
| **处理** | 删除——指针角色已被「深入文档」指针表占掉，叙事归 git log / docs/CHANGES.md |
| **Pattern-Key** | `format:changelog:blockquote` |

### 2. 抄 docs/ 已有的详细机制

| 特征 | 在 CLAUDE.md 里复述 docs/ 已有的数据流、评分公式、架构细节 |
|------|------|
| **识别** | CLAUDE.md 中出现与 docs/ 某文件高度重合的段落（>3 行连续相同） |
| **处理** | 删除 CLAUDE.md 中的复述，保留「深入文档」指针表中一行链接。AI 改到这块自然会读 docs |
| **Pattern-Key** | `format:doc-dup:claudemd` |

### 3. 已稳定的"新功能上线"叙事

| 特征 | 功能已上线 ≥ 7 天，CLAUDE.md 仍保留"X 功能已上线"的临时通知 |
|------|------|
| **识别** | 包含"已上线"、"已部署"、"新功能"等临时标记，且功能已稳定运行 |
| **处理** | 该融入项目概览的融入（如路由清单）；纯历史的删除 |
| **Pattern-Key** | `format:stale-announce:claudemd` |

### 4. 一次性事故复盘流水账

| 特征 | memory 文件中 >100 行的事故复盘细节（时间线、排查过程、临时方案） |
|------|------|
| **识别** | 单条 memory 文件超 ~100 行，且内容为"X 时 Y 挂了因为 Z"的事故叙述 |
| **处理** | 提炼成 ≤ 30 行的"规则 + Why + How to apply"；事故详情归 docs/PLAYBOOK.md 或删除。留 1 行红线规则（如"禁止裸跑 systemctl stop X"），其余删 |
| **Pattern-Key** | `format:incident-bloat:memory` |

### 5. 中间态叙事（已被取代）

| 特征 | "5/6 改了 X，5/8 又改成 Y"形式的中间过程记录 |
|------|------|
| **识别** | 同一主题出现多次变更记录，最终态已确定 |
| **处理** | 只留最终态规则；中间历史全部删除 |
| **Pattern-Key** | `format:intermediate-state:claudemd` |

### 6. 已废弃/已取代标记

| 特征 | 记忆条目中包含"已被 X 取代"、"已废弃"、"保留作历史参考" |
|------|------|
| **识别** | grep "已废弃\|已被.*取代\|保留作历史\|deprecated\|superseded" |
| **处理** | 99% 可以直接删除。如果 docs/ 已有权威记录，记忆中不需要保留"作参考" |
| **Pattern-Key** | `format:stale-marker:memory` |

### 7. 已完成待办堆积

| 特征 | 已完成的临时计划、推翻的决策仍在记忆中占用空间 |
|------|------|
| **识别** | 包含"已完成"、"已解决"、"不用了"等标记的条目 |
| **处理** | 直接删除。知识库不是历史档案，已完成待办没有复用价值 |
| **Pattern-Key** | `format:completed-todo:memory` |

## 使用方式

治理时对 CLAUDE.md 和记忆文件逐条扫描：

1. 先用上述特征表做快速匹配（grep 关键词）
2. 命中反模式的条目，生成对应 Pattern-Key
3. 在操作计划表中标注为 `anti-pattern-cleanup`
4. 按正常治理流程处理（预览 → 确认 → 执行）

与 `change-matrix.md` / `content-matrix.md` 互补：矩阵管"该补什么"，反模式管"该删什么"。
