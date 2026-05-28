# Works 工作清单模块架构

## 路由入口

| 页面 | 路由 | 组件 |
|------|------|------|
| 工作清单 | `/works` | `app/works/page.tsx` → `WorksClient.tsx` |

## 页面结构

WorksClient 渲染工作项列表和表单：

| 组件 | 说明 |
|------|------|
| WorksList | 工作项列表展示 |
| WorkCard | 单个工作项卡片 |
| WorkForm | 新增/编辑工作项表单 |
| WorkFormSection | 表单分区 |
| StarRating | 星级评分组件 |
| SectionHeader | 分区标题 |

## 核心组件链

```
page.tsx
  └─ WorksClient.tsx
       ├─ WorksList.tsx
       │    └─ WorkCard.tsx
       ├─ WorkForm.tsx
       │    ├─ WorkFormSection.tsx
       │    └─ StarRating.tsx
       └─ SectionHeader.tsx
```

## 数据流

1. **WorksClient** 管理列表/表单视图切换状态
2. **API** `app/api/works/` 提供工作项 CRUD
3. 工作项支持评分、分类、完成状态

## API 规范

| 端点 | 说明 |
|------|------|
| `GET /api/works` | 工作清单列表 |
| `POST /api/works` | 创建工作项 |
| `PUT /api/works/[id]` | 更新工作项 |
| `DELETE /api/works/[id]` | 删除工作项 |

## 权限标准

- `system.admin` — 管理工作清单（全部 CRUD）
- 普通用户可查看工作清单（只读）

工作清单是系统管理员维护的公共任务列表，供全员查看和跟进。
