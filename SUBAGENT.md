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

## 部署

```bash
npm run build && ./deploy.sh          # 普通部署
npm run build && ./deploy.sh --push-db  # schema变更时
```

Schema 改了必须先 `npx prisma db push`，再 `npm run build`。
