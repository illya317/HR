# HR 全项目耦合优化（>300行拆分）

## 超300行文件（共10个）

| # | 文件 | 行数 | 目录 | 拆分数 |
|---|------|------|------|--------|
| 1 | CodeTab.tsx | 473 | app/hr/ | 2 |
| 2 | EmployeeAnalytics.tsx | 455 | app/hr/analytics/ | 4 |
| 3 | PositionAnalytics.tsx | 410 | app/hr/analytics/ | 4 |
| 4 | works/page.tsx | 401 | app/works/ | 2-3 |
| 5 | reports/page.tsx | 399 | app/reports/ | 2-3 |
| 6 | useCodeTab.ts | 358 | app/hr/ | 2 |
| 7 | ByUserTab.tsx | 343 | app/admin/ | 2 |
| 8 | settings/page.tsx | 325 | app/settings/ | 2 |
| 9 | GenericTableTab.tsx | 324 | app/hr/ | 2 |
| 10 | ByPermissionTab.tsx | 306 | app/admin/ | 2 |

## 通用问题：StatCard 重复 4 处

| 文件 | 行 | 差异 |
|------|-----|------|
| EmployeeAnalytics.tsx:6 | ~20 | 无 `sub` prop |
| PositionAnalytics.tsx:6 | ~20 | 有 `sub` |
| TurnoverAnalytics.tsx:6 | ~20 | 有 `sub` |
| ContractAnalytics.tsx:6 | ~20 | 有 `sub` |

**修** → `app/hr/analytics/shared/StatCard.tsx`

---

## 逐文件拆分方案

### 1. EmployeeAnalytics.tsx (455→~120)

```
app/hr/analytics/employee/
├── EmployeeAnalytics.tsx    # 主组件：StatCard行 + 分布选择器 + 子组件调用 + 入职/离职表 (~120)
├── useEmployeeData.ts       # 纯数据：在职筛选、特征绑定、分布计算、交叉矩阵 (enriched+stats+crossMatrix, ~200)
├── CrossMatrix.tsx          # 纯UI：热力图表格 (含heatColor, ~100)
└── constants.ts             # DIM_LABELS/COLORS/ORDER 三表 (~40)
```

### 2. PositionAnalytics.tsx (410→~80)

```
app/hr/analytics/position/
├── PositionAnalytics.tsx    # 主组件：StatCard行 + 子组件调用 (~80)
├── usePositionData.ts       # 纯数据：实际人数、子树汇总、L1筛选 (enriched+stats+filteredDept, ~220)
├── DeptBarChart.tsx         # 纯UI：LevelSection + DeptBarRow + 图例 (~120)
└── PositionTable.tsx        # 纯UI：可排序表头 + 搜索 + 状态标签 (~120)
```

### 3. CodeTab.tsx (473→~120+~370)

```
app/hr/code/
├── CodeTab.tsx              # 主组件：渲染 + 使用 useCodeTab hook (~120)
└── CodeTable.tsx            # 代码表格渲染：搜索/排序/详情弹框/编辑行 (~370)
```

**现状**：`useCodeTab.ts` 已提取数据逻辑（358行），但 `CodeTab.tsx` 仍有 473 行的 UI 渲染，主要是一大段 JSX（表格、弹框、编辑行）。

**拆分**：表格渲染部分（编辑行、搜索栏、排序头、详情弹框）提为 `CodeTable.tsx`。

### 4. works/page.tsx (401→~120+~200+~100)

```
app/works/
├── page.tsx                 # 主组件：状态 + 数据加载 + 子组件调用 (~120)
├── WorksList.tsx            # 工作列表：三个折叠区 + 工作卡片 + 分页 (~200)
└── WorkFormModal.tsx        # 新建/编辑弹窗 (~100)
```

**现状**：page.tsx 包含大量展开/折叠逻辑、工作过滤、表单弹窗 JSX，与 WorkCard/WorkForm 子组件混在一起。

### 5. reports/page.tsx (399→~120+~200+~100)

```
app/reports/
├── page.tsx                 # 主组件：状态 + 数据加载 + 布局 (~120)
├── ReportEditor.tsx         # 汇报编辑区：任务名 + Notes + 周期选择器 + 工作项 (~200)
└── VersionViewer.tsx        # 历史版本查看器 (~100)
```

**现状**：页面混入大量编辑 UI（周期选择、工作项增删改、版本切换），与 WorkSection 组件逻辑交叉。

### 6. useCodeTab.ts (358→~180+~200)

```
app/hr/code/
├── useCodeTab.ts            # 数据 hook：加载/搜索/提交 (~180)
└── useCodeSort.ts           # 排序 + 过滤 + 详情逻辑 (~200)
```

**现状**：useCodeTab 混合了数据加载、排序、过滤、详情列表、职位-部门弹框等多组独立逻辑。

### 7. ByUserTab.tsx (343→~120+~240)

```
app/admin/
├── ByUserTab.tsx            # 主组件：搜索 + UserCard调用 (~120)
└── UserCard.tsx             # 用户授权卡片 + 子资源展开 (~240)
```

**现状**：ByUserTab 的主渲染是一个复杂的用户卡片列表，每张卡片内有权限树展开逻辑，可独立提取。

### 8. GenericTableTab.tsx (324→~120+~220)

```
app/hr/
├── GenericTableTab.tsx      # 主组件：数据加载 + 表格壳 (~120)
└── EditableTable.tsx        # 可编辑表格：renderCell + 编辑态 + 删除确认 (~220)
```

**现状**：GenericTableTab 包含 renderCell 函数、FK 渲染逻辑、编辑输入框渲染、行操作等。

### 9. settings/page.tsx (325→~60+~120+~120)

```
app/settings/
├── page.tsx                 # 主组件：加载 + 子组件调用 (~60)
├── UsernameModal.tsx        # 修改用户名弹窗 (~120)
└── PasswordModal.tsx        # 修改密码弹窗 (~120)
```

**现状**：页面上内联了两个完整的 Modal 表单（表单状态、验证、提交），各约 120 行。

### 10. ByPermissionTab.tsx (306→~120+~200)

```
app/admin/
├── ByPermissionTab.tsx      # 主组件：筛选 + 卡片调用 (~120)
└── PermissionCard.tsx       # 权限卡片：展开/折叠 + 员工列表 (~200)
```

---

## 不改范围

| 文件 | 行数 | 原因 |
|------|------|------|
| ContractAnalytics.tsx | 293 | <300 |
| tabConfigs.ts | 292 | <300，纯配置 |
| lib/auth.ts | 294 | <300，lib 模块 |
| lib/period.ts | 287 | <300 |
| DepartmentAnalytics.tsx | 222 | <300 |
| TurnoverAnalytics.tsx | 239 | <300 |
| useAnalyticsData.ts | 165 | 结构合理 |
| useGenericTab.ts | 190 | 结构合理 |

---

## 执行顺序（按影响范围）

1. **StatCard 提取** — 改动 4 个 analytics 组件，影响面小
2. **Analytics 拆分** — EmployeeAnalytics + PositionAnalytics（与 StatCard 相关联）
3. **settings 拆分** — 单纯弹窗提取，简单
4. **admin 拆分** — ByUserTab + ByPermissionTab
5. **CodeTab + useCodeTab 拆分** — 改动量大，最后做
6. **works + reports 拆分** — 涉及业务页面，最后做

> 每步完成后：`npm run build` → commit
