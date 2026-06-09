# 治理洞见规则与模板

本文件只保存 Deep 模式 Synthesis Scan 的稳定规则和输出模板。实际蒸馏出的治理洞见写入 `assets/governance-insights.md`，避免把运行数据混入 reference 指令。

## 写入规则

- Deep 模式先从 `curate-history.jsonl` 的 `schema_version: 2` 有效记录中动态计算候选。
- 只有同一 category 下至少 2 个成熟候选时才执行蒸馏。
- 所有新增、更新、删除洞见都必须经用户确认。
- 新洞见与旧洞见冲突时，更新 `assets/governance-insights.md` 中的旧洞见，并标注更新日期。

## 格式模板

```markdown
## 治理洞见：{category} {subject}

**模式**：{跨多个治理周期观察到的共同模式}
**规则**：{蒸馏出的治理规则，1-2句}
**证据**：{支持的Pattern-Key数量，附capsule摘要}
**适用范围**：{何时应用此规则}
**来源**：{贡献的Pattern-Key列表}
**更新日期**：YYYY-MM-DD
```
