# Sub Agent 速查

> 当前日期：请通过系统提示确认，不要猜测。

## 必须遵守

- 禁止硬编码：公司名/编码从 `@/lib/company` 导入，UI组件用共享组件
- 确认弹框 → `<ConfirmModal>`，通知 → `useToast()`，表格编辑 → `<EditToolbar>`
- API 鉴权 → `@/lib/auth`，禁止在路由中本地定义鉴权函数
- 改完代码后必须 `npx tsc --noEmit` 验证零错误
- 不添加超出需求的功能，不修改无关代码

## 共享模块

| 模块 | 用途 | 关键导出 |
|------|------|----------|
| `@/lib/company` | 公司常量 | `CODE_TO_NAME`, `NAME_TO_CODE`, `FENGHUA_BIO_GROUP`, `SHARED_GROUP_CODES`, `resolveCompanyFilter`, `getCompanyFromCode` |
| `@/lib/search` | 拼音搜索 | `getInitials`, `matchEmployee` |
| `@/lib/auth` | 认证鉴权 | `authenticate`, `checkPermission`, `requireAdmin`, `isAdmin`, `isGroupAdmin` |
| `@/lib/permissions` | RBAC常量 | `RES`(资源树), `ROLE`(5角色), `perm`(兼容) |
| `@/lib/period` | 周期计算 | `getCurrentPeriod`, `getPeriodRange`, `getPreviousPeriod`, `getPeriodOptions`, `getPeriodTypeName`, `PeriodType` |
| `@/lib/prisma` | 数据库 | `import { prisma } from "@/lib/prisma"` |

## 共享 UI 组件

| 组件 | 导入 |
|------|------|
| `ConfirmModal` | `@/app/components/ConfirmModal` |
| `EditToolbar` | `@/app/components/EditToolbar` |
| `Toast` + `useToast` | `@/app/components/Toast` + `@/app/hooks/useToast` |
| `FilterBar` | `@/app/components/FilterBar` |
| `DataTable` | `@/app/components/DataTable` |

## 代码规范

- **超 300 行必须拆分**：数据逻辑 → `useXxx.ts`，UI 子块 → 独立组件
- **搜索统一走 `lib/search`**：`matchEmployee` / `getInitials`（自动带拼音），不要直接 import `pinyin-pro`

## 项目结构

```
app/hr/              人事管理（主模块）
  analytics/          人力分析（5个tab：员工/部门/岗位/离职/合同）
    shared/            共享组件（StatCard）
    employee/          员工分析（useEmployeeData, CrossMatrix, constants）
    position/          岗位分析（usePositionData, DeptBarChart, PositionTable）
  code/               编码管理（CodeTab, CodeTable, useCodeTab, useCodeHelpers）
  tabs/               各实体的Tab组件（*Tab.tsx, GenericTableTab, EditableTable）
  components/         HR专用UI（FKInput, FilterModal, SearchInput等）
  hooks/              HR专用hooks（useGenericTab）
app/admin/           管理后台
app/works/           工作清单
app/reports/         工作汇报
app/settings/        个人设置
api/hr/              HR API（CRUD）
api/admin/           管理后台API
lib/                 共享工具库（auth, search, company, period, prisma等）
```

## 部署

```bash
npm run build && ./deploy.sh          # 普通部署
npm run build && ./deploy.sh --push-db  # schema变更时
```

Schema 改了必须先 `npx prisma db push`，再 `npm run build`。
