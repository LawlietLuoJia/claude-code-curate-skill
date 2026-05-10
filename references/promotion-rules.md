# 知识晋升规则

定义知识从临时层到持久层的晋升机制。仅在 Deep 模式下执行晋升评估，Quick 模式仅标记"可晋升"。

## 晋升层级

```
会话级（临时发现）
    ↓ recurrence_count ≥ 2
记忆层（memory/ 独立文件）
    ↓ recurrence_count ≥ 3 且有持续价值
项目层（CLAUDE.md / docs/）
    ↓ recurrence_count ≥ 3 且跨项目适用
全局层（~/.claude/CLAUDE.md）
```

## Pattern-Key 规则

每条知识生成一个稳定的语义键，用于去重和晋升追踪。

### 格式

`{类别}:{核心主题}:{关键属性}`

### 类别定义

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

### 生成规则

1. **类别**：从上表选择最匹配的类别
2. **核心主题**：提取知识的核心对象（工具名、项目名、技术名等），用短横线连接
3. **关键属性**：提取区分性属性（状态、版本、场景等）

**稳定性原则**：同一知识每次生成的 Pattern-Key 必须一致。不要因为措辞不同就生成不同的键。

### 去重流程

1. 为新知识生成 Pattern-Key
2. 搜索 `curate-history.jsonl` 中的已有 pattern_key
3. 搜索所有记忆文件中的 Pattern-Key（如果文件中有标注）
4. 匹配结果：
   - **匹配到**：递增 recurrence_count，更新 last_seen，合并内容到已有条目
   - **未匹配**：创建新条目，recurrence_count = 1
5. **停滞检测**：如果 Pattern-Key 出现 ≥ 5 次但仍为临时状态（未晋升、未归档、未解决），标记为"待用户决策"——不再重复记录，改为在摘要中提示用户处理

## 晋升条件

### 基础条件（必须全部满足）

1. **频次**：pattern_key 在 `curate-history.jsonl` 中出现 ≥ 3 次
2. **持久性**：知识本身不是临时状态
3. **一致性**：知识内容已稳定（最近两次出现的描述基本一致）

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

## 晋升执行

### 输出建议清单

```
📋 知识晋升建议

1. [tool:uv:package-management] 出现5次
   内容: 全局 venv 在 ~/.venv，由 uv 管理，禁止 pip3 install
   建议: 晋升到全局 CLAUDE.md
   理由: 跨项目适用的包管理规则
   确认？(y/n)

2. [domain:huaxia:format-spec] 出现3次
   内容: 华夏银行公文格式（字体、字号、样式）
   建议: 晋升到项目 CLAUDE.md
   理由: 该项目的所有产出物都遵循此格式
   确认？(y/n)
```

### 执行步骤

用户确认后：
1. 将知识内容写入目标文件（CLAUDE.md 或全局 CLAUDE.md）
2. 在源文件中标记或删除已晋升的条目
3. 向 `curate-history.jsonl` 写入晋升记录：
   ```json
   {"ts":"...","mode":"deep","pattern_key":"tool:uv:package-management","action":"promote","target":"~/.claude/CLAUDE.md","detail":"晋升到全局：跨项目适用的包管理规则","health_score":78}
   ```

### 全局配置克制原则

见 SKILL.md 编辑原则中的"全局配置极度克制"。晋升到全局时必须：
- 仅放入跨项目适用的核心原则，不放入任何项目特定的细节
- 保持精简（全局 CLAUDE.md 建议不超过 100 行）
- 每次新增前检查是否可以合并到已有条目
