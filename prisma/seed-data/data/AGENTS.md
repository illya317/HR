# 财务成本分析数据目录说明

这个目录是丰华生物成本分析数据的本地工作区。核心目标是把原始 Excel 安全转换为可追溯的 JSON，并为后续入库、飞书表、成本分析页面提供稳定数据。

## 目录结构

```text
data/                          ← 项目根目录（丰华私有数据，不可复用）
  raw/                         原始 Excel。只读保留，禁止覆盖、改名、手工修表。
  intermediate/                Excel 原样导出的 raw JSON，用于追溯和返工。
  normalized/                  业务可用的 normalized JSON，是后续入库/分析的主数据。
  reports/                     校验报告，当前主要是车间报表校验。
  scripts/                     丰华专用 Python 处理脚本（不可复用）。
  manifest.json                转换清单，记录 raw 和 normalized 输出。
  conversion-report.md         转换报告，给人阅读。
  engine/                      ✅ 通用引擎（给第二家公司用，完全不改）
    bin/                       CLI 入口
    lib/                       核心库
    package.json
  config/                      🔧 配置模板（结构复用，内容重写）
    profiles/                  5 个业务主题的字段映射配置
    file-patterns.json         文件名模式匹配规则
```

## 三层边界

| 层级 | 目录 | 说明 | 给第二家公司 |
|------|------|------|-------------|
| 引擎 | `engine/` | 通用转换代码，纯函数，无硬编码业务规则 | 直接复制 |
| 配置 | `config/` | JSON 配置文件，定义字段映射和文件名模式 | 复制后修改内容 |
| 数据 | 根目录下其余所有 | 丰华私有 Excel、JSON、报告、Python 脚本 | 不复制 |

## 数据分层

### raw Excel

`raw/` 是原始凭证。任何 agent 都不能直接修改这里的 Excel。

### intermediate JSON

`intermediate/` 是从 Excel 原样导出的结构化副本，目标是不丢信息。它保留：

- `sourceFile`
- `sourcePath`
- `year`
- `profile`
- `checksum`
- `sheetName`
- `headers`
- `rows`
- `_sourceRow`
- `merges`
- `formulas`

intermediate JSON 可以重新生成，不建议手工编辑。

### normalized JSON

`normalized/` 是业务主数据。当前已覆盖：

- `shipments`：发货统计
- `cost-analysis`：成本分析
- `workshop-reports`：车间报表
- `sales-salary`：业务员考核工资
- `cost-structure`：成本构成汇总

normalized JSON 必须保留 `source`，用于追溯到源文件、sheet 和行号。没有来源信息的数据不要入库。

## 当前输出状态

已完成：

- 10 个 Excel 的 intermediate JSON
- 10 个 normalized JSON
- `manifest.json`
- `conversion-report.md`

所有 5 个主题均已完成 normalized。`cost-analysis` 和 `cost-structure` 的 Excel sheet 形态较复杂，normalized 中同时保留通用 `tables` 结构，避免过早丢字段。

## 脚本命令

安装依赖：

```bash
cd engine && npm install
```

重新生成 intermediate JSON：

```bash
cd engine && node bin/excel-to-json.mjs --mode=raw
```

重新生成车间报表 normalized：

```bash
cd engine && node bin/excel-to-json.mjs --mode=normalized
```

重新生成其余主题 normalized：

```bash
cd engine && npm run normalize
```

## 可删除项

这些是缓存或本地依赖，不属于数据成果：

- `.DS_Store`
- `__pycache__/`
- `engine/node_modules/`
- 临时计划文件，如 `task_plan.md`、`findings.md`、`progress.md`

删除 `engine/node_modules/` 后，如需重新运行 Node 脚本，先在 `engine` 里执行 `npm install`。

## 禁止事项

- 禁止修改 `raw/` 里的 Excel。
- 禁止手工改 JSON 数值来"对平"结果。
- 禁止删除 `intermediate/`、`normalized/`、`reports/`、`engine/`、`config/`。
- 禁止生成没有 `source` 的 normalized 业务记录。
- 禁止把缓存、依赖目录、临时文件当作正式数据提交或交付。

## 验收标准

每次转换后至少检查：

```text
1. 所有 JSON 可以 parse
2. manifest.json 记录 rawFiles 和 normalizedFiles
3. normalized 记录包含 source
4. conversion-report.md 与实际输出一致
5. raw Excel 未被修改
```
