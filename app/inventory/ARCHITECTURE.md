# Inventory 库存管理模块架构

## 路由入口

| 页面 | 路由 | 组件 |
|------|------|------|
| 库存管理 | `/inventory` | `app/inventory/page.tsx` → `InventoryClient.tsx` |

## 页面结构

InventoryClient 渲染多个 Tab，每个 Tab 是一个独立的 `InventoryTableTab`：

| Tab | 组件 | 数据实体 |
|-----|------|---------|
| 原材料 | RawMaterialTab | 原材料入库/出库 |
| 包材 | PackagingTab | 包材入库/出库 |
| 成品 | FinishedGoodsTab | 成品入库/出库 |
| 操作记录 | OperationsTab | 库存操作日志 |
| 退货 | ReturnsTab | 退货记录 |
| 报表 | ReportTab | 库存统计报表 |

## 核心组件链

```
page.tsx
  └─ InventoryClient.tsx
       ├─ RawMaterialTab.tsx
       │    └─ InventoryTableTab.tsx — 通用库存表格
       ├─ PackagingTab.tsx
       ├─ FinishedGoodsTab.tsx
       ├─ OperationsTab.tsx
       ├─ ReturnsTab.tsx
       └─ ReportTab.tsx
```

## 数据流

1. **useInventoryTab.ts** 提供各 Tab 通用的加载/筛选/CRUD hook
2. **InventoryTableTab.tsx** 通用库存表格组件，支持编辑/筛选/分页
3. **API** `app/api/inventory/` 下按物料类型分端点

## API 规范

| 端点 | 说明 |
|------|------|
| `GET/POST/PUT/DELETE /api/inventory/raw-materials` | 原材料 |
| `GET/POST/PUT/DELETE /api/inventory/packaging` | 包材 |
| `GET/POST/PUT/DELETE /api/inventory/finished-goods` | 成品 |
| `GET /api/inventory/operations` | 操作记录 |
| `GET /api/inventory/returns` | 退货记录 |
| `GET /api/inventory/reports` | 库存报表 |

## 权限标准

- `inventory.access` — 查看库存数据
- `inventory.write` — 入库/出库/编辑
- `inventory.delete` — 删除库存记录

库存数据按物料类型分类存储，各类型共享通用的 InventoryTableTab 组件和 API 模式。
