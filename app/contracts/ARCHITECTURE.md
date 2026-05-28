# Contracts 合同管理模块架构

## 路由入口

| 页面 | 路由 | 组件 |
|------|------|------|
| 合同管理 | `/contracts` | `app/contracts/page.tsx` → `ContractsClient.tsx` |

## 页面结构

ContractsClient 渲染合同列表，支持筛选、分页、弹窗编辑：

| 组件 | 说明 |
|------|------|
| ContractsTable | 合同表格展示 |
| ContractFilters | 筛选条件（公司、状态、日期等） |
| ContractModal | 新增/编辑合同弹窗 |
| ContractPagination | 分页组件 |

## 核心组件链

```
page.tsx
  └─ ContractsClient.tsx
       ├─ ContractFilters.tsx      — 筛选栏
       ├─ ContractsTable.tsx        — 表格
       │    └─ ContractModal.tsx    — 编辑弹窗
       └─ ContractPagination.tsx    — 分页
```

## 数据流

1. **useContracts.ts** 提供加载/搜索/分页/CRUD hook
2. **ContractsClient** 消费 hook，渲染筛选 + 表格 + 弹窗
3. **API** `app/api/contracts/` 和 `app/api/hr/contracts/` 提供合同 CRUD

## API 规范

| 端点 | 说明 |
|------|------|
| `GET /api/contracts` | 合同列表（支持筛选、分页） |
| `POST /api/contracts` | 创建合同 |
| `PUT /api/contracts/[id]` | 更新合同 |
| `DELETE /api/contracts/[id]` | 删除合同 |
| `GET /api/hr/contracts` | HR 模块内嵌合同列表 |

## 权限标准

- `people.access` — 查看合同（GET）
- `people.write` — 新增/编辑合同（POST/PUT）
- `people.delete` — 删除合同（DELETE）

合同数据关联 Employee 和 Company，通过 employeeId + companyId 外键关联。
