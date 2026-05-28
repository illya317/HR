# Excel → JSON 转换报告

**生成时间**: 2026-05-28T10:52:48.407Z
**模式**: raw

## 文件清单

| 源文件 | 年份 | 业务主题 | Sheet 数 | Checksum |
|--------|------|----------|----------|----------|
| 2025年1-3月发货统计表.XLS | 2025 | shipments | 1 | c35b6305... |
| 2025年成本分析表.xls | 2025 | cost-analysis | 10 | 417a8828... |
| 2025年车间报表.xlsx | 2025 | workshop-reports | 13 | d97b4868... |
| 2026年1-3月发货统计表.XLS | 2026 | shipments | 1 | acd14fd4... |
| 2026年成本分析表（飞书）.xls | 2026 | cost-analysis | 12 | 93951ab2... |
| 2026年车间报表.xlsx | 2026 | workshop-reports | 4 | 653ab876... |
| 25年业务员考核工资.xls | 2025 | sales-salary | 3 | eab7e54b... |
| 25年汇总成本构成表.xls | 2025 | cost-structure | 23 | 74179162... |
| 26年业务员考核工资.xls | 2026 | sales-salary | 3 | 8733da5f... |
| 26年成本汇总构成表.xls | 2026 | cost-structure | 9 | 89e9022c... |

## 状态说明

- 所有 Excel 文件已完成 **raw** 模式导出。
- raw JSON 保留了完整的 sheet 结构、表头、原始行数据和合并单元格信息。
- `workshop-reports` 主题已有 Python 生成的关联 JSON，可作为 normalized 输入。
- 其余主题（发货统计、成本分析、业务员考核工资、成本构成）目前仅完成 raw 导出，待后续业务字段确认后再做 normalized 清洗。
