# Analytics 模块耦合优化

## 现状

| 文件 | 行数 | 超300 |
|------|------|-------|
| EmployeeAnalytics.tsx | 455 | Yes |
| PositionAnalytics.tsx | 410 | Yes |
| ContractAnalytics.tsx | 293 | No |
| TurnoverAnalytics.tsx | 239 | No |
| DepartmentAnalytics.tsx | 222 | No |
| useAnalyticsData.ts | 165 | No |
| page.tsx | 147 | No |

## 问题#1：StatCard 三份重复

4 个 tab 组件各有自己的 `StatCard` 定义，功能相同，仅 `EmployeeAnalytics` 版缺少 `sub` prop。

**修复**：提取 `app/hr/analytics/shared/StatCard.tsx`，统一接口，全部引用。

## 问题#2：EmployeeAnalytics.tsx（455行）

**拆分方案**：

```
app/hr/analytics/
├── shared/
│   ├── StatCard.tsx          # 共享统计卡片 (~20行)
│   └── DistributionBar.tsx   # 共享分布条 (~20行)
├── employee/
│   ├── EmployeeAnalytics.tsx  # 主组件，只负责 layout 和状态 (~120行)
│   ├── useEmployeeData.ts     # enriched + stats 计算逻辑 (~150行)
│   ├── CrossMatrix.tsx        # 交叉分析矩阵 (表格渲染) (~100行)
│   └── constants.ts           # DIM_LABELS/COLORS/ORDER (~50行)
```

**拆分逻辑**：
- `useEmployeeData` — 纯数据 hook：在职筛选、特征绑定、分布计算、交叉矩阵
- `CrossMatrix` — 纯 UI：热力图表格渲染（接收 matrix 数据、heatColor、DIM_LABELS）
- `EmployeeAnalytics` — 只保留：状态管理、StatCar 行、特征下拉、两个子组件调用、最近入职/离职表
- `constants` — DIM_LABELS, DIM_COLORS, DIM_ORDER 三张表

## 问题#3：PositionAnalytics.tsx（410行）

**拆分方案**：

```
app/hr/analytics/
├── position/
│   ├── PositionAnalytics.tsx  # 主组件 (~80行)
│   ├── usePositionData.ts     # enriched + stats + subtree + filter 逻辑 (~200行)
│   ├── DeptBarChart.tsx       # LevelSection + DeptBarRow + 图例 (~120行)
│   └── PositionTable.tsx      # 岗位明细表 (排序/搜索/状态标签) (~120行)
```

**拆分逻辑**：
- `usePositionData` — 纯数据 hook：实际人数计算、部门子树汇总、L1 筛选
- `DeptBarChart` — 纯 UI：LevelSection + DeptBarRow + 图例（接收 filteredDept、globalMax）
- `PositionTable` — 纯 UI：可排序表头 + 状态标签 + 搜索栏
- `PositionAnalytics` — 只剩：StatCard 行 + 调用三个子块

## 问题#4：ContractAnalytics + TurnoverAnalytics 的 StatCard

两者都有独立 StatCard 定义，改完 shared/StatCard 后删除各自的重复定义。

## 执行顺序

1. 创建 `shared/StatCard.tsx`，4 个组件引用它
2. 拆分 `EmployeeAnalytics` → shared + employee/ + constants
3. 拆分 `PositionAnalytics` → position/
4. 清理各组件内重复的 StatCard
5. 编译 → 功能验证

## 不改的范围

- DepartmentAnalytics (222行) — 不超 300
- TurnoverAnalytics (239行) — 不超 300
- ContractAnalytics (293行) — 不超 300
- useAnalyticsData.ts, page.tsx — 结构合理
