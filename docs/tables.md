# HR Database Schema (22 tables)

## 1. System

### 1-1 User

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | REF | 主键 |
| `wxUserId` | String |  |  | 微信用户ID（无微信则留空） |
| `username` | String |  |  | 登录用户名（自取） |
| `password` | String |  |  | 登录密码 |
| `name` | String | * |  | 名称 |
| `avatar` | String |  |  | 头像URL |
| `routineItems` | String |  |  | 日常工作模板JSON |
| `canLogin` | Boolean | * |  | 离职=停用，不删号（账号状态，非权限） |
| `apiKey` | String |  |  | API密钥 |
| `createdAt` | DateTime | * |  | 创建时间 |

← Referenced by: [2-3 UserResourceRole](#userresourcerole), [3-1 Report](#report), [5-1 Employee](#employee), [5-1 Employee](#employee), [5-2 Company](#company), [5-3 Department](#department), [5-3 Department](#department), [5-4 Position](#position), [5-5 EmployeePosition](#employeeposition), [5-6 DepartmentPosition](#departmentposition), [5-7 Project](#project), [5-9 EmployeeProject](#employeeproject), [6-1 EditHistory](#edithistory)

### 1-2 SystemConfig

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `key` | String | * |  |  |
| `value` | String | * |  |  |

## 2. RBAC

### 2-1 Resource

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | REF |  |
| `key` | String | * |  |  |
| `name` | String | * |  |  |
| `description` | String |  |  |  |
| `sortOrder` | Int | * |  |  |
| `parentId` | Int |  | FK | 上级资源（资源树） |

→ Depends on: [2-1 Resource](#resource)

← Referenced by: [2-3 UserResourceRole](#userresourcerole), [2-4 PositionResourceRole](#positionresourcerole), [2-5 DepartmentResourceRole](#departmentresourcerole)

### 2-2 Role

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | REF |  |
| `key` | String | * |  | "access" | "read" | "write" | "delete" | "admin" |
| `name` | String | * |  |  |
| `description` | String |  |  |  |
| `sortOrder` | Int | * |  |  |

← Referenced by: [2-3 UserResourceRole](#userresourcerole), [2-4 PositionResourceRole](#positionresourcerole), [2-5 DepartmentResourceRole](#departmentresourcerole)

### 2-3 UserResourceRole

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * |  |  |
| `userId` | Int | * | FK | → User.id |
| `resourceId` | Int | * | FK | → Resource.id |
| `roleId` | Int | * | FK | → Role.id |
| `scopeId` | String |  |  | null=全局, 有值=范围实例 |

→ Depends on: [1-1 User](#user), [2-1 Resource](#resource), [2-2 Role](#role)

### 2-4 PositionResourceRole

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * |  |  |
| `positionId` | Int | * | FK | → Position.id |
| `resourceId` | Int | * | FK | → Resource.id |
| `roleId` | Int | * | FK | → Role.id |
| `scopeId` | String |  |  |  |

→ Depends on: [5-4 Position](#position), [2-1 Resource](#resource), [2-2 Role](#role)

### 2-5 DepartmentResourceRole

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * |  |  |
| `departmentId` | Int | * | FK | → Department.id |
| `resourceId` | Int | * | FK | → Resource.id |
| `roleId` | Int | * | FK | → Role.id |
| `scopeId` | String |  |  |  |

→ Depends on: [5-3 Department](#department), [2-1 Resource](#resource), [2-2 Role](#role)

## 3. Reports

### 3-1 Report

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | REF | 主键 |
| `userId` | Int |  | FK | 用户ID |
| `targetType` | String | * |  | "department" | "project" | "position" |
| `targetId` | Int | * |  | 多态 FK → Department.id | Project.id | Position.id |
| `date` | String | * |  | 日期（yyyy-MM-dd，日报=当天，周报=周一，月报=月初） |
| `taskName` | String | * |  | 任务名称 |
| `notes` | String |  |  | 备注 |
| `version` | Int | * |  | 版本号 |
| `createdAt` | DateTime | * |  | 创建时间 |
| `updatedAt` | DateTime | * |  | 更新时间 |

→ Depends on: [1-1 User](#user)

← Referenced by: [3-2 ReportItem](#reportitem), [3-3 ReportHistory](#reporthistory)

### 3-2 ReportItem

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * |  | 主键 |
| `reportId` | Int | * | FK | 周报ID |
| `category` | String | * |  | 分类 |
| `plan` | String | * |  | 本周计划 |
| `completion` | String |  |  | 完成情况 |
| `nextGoal` | String |  |  | 下周目标 |
| `sortOrder` | Int | * |  | 排序序号 |
| `workItemId` | Int |  | FK | 关联工作清单条目ID |

→ Depends on: [4-1 WorkItem](#workitem), [3-1 Report](#report)

### 3-3 ReportHistory

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * |  | 主键 |
| `reportId` | Int | * | FK | 周报ID |
| `version` | Int | * |  | 版本号 |
| `taskName` | String | * |  | 任务名称 |
| `notes` | String |  |  | 备注 |
| `itemsJson` | String | * |  | 条目JSON快照 |
| `createdAt` | DateTime | * |  | 创建时间 |

→ Depends on: [3-1 Report](#report)

## 4. Tasks

### 4-1 WorkItem

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | REF | 主键 |
| `targetType` | String | * |  | "project" | "department" | "position" | "personal" |
| `targetId` | Int |  |  | 多态 FK |
| `category` | String | * |  | 分类 |
| `content` | String | * |  | 内容 |
| `importance` | Int | * |  | 重要度（1-5） |
| `urgency` | Int | * |  | 紧急度（1-5） |
| `isArchived` | Boolean | * |  | 是否归档 |
| `isPrivate` | Boolean | * |  | personal 时默认仅自己可见 |
| `sortOrder` | Int | * |  | 排序序号 |
| `createdAt` | DateTime | * |  | 创建时间 |
| `updatedAt` | DateTime | * |  | 更新时间 |

← Referenced by: [3-2 ReportItem](#reportitem), [4-2 WorkParticipant](#workparticipant)

### 4-2 WorkParticipant

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * |  | 主键 |
| `workItemId` | Int | * | FK | 关联工作清单条目ID |
| `name` | String | * |  | 名称 |
| `wxUserId` | String |  |  | 微信用户ID |
| `createdAt` | DateTime | * |  | 创建时间 |

→ Depends on: [4-1 WorkItem](#workitem)

## 5. Roster & Org

### 5-1 Employee

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | REF | 主键 |
| `employeeId` | String | * |  | 员工编号 |
| `name` | String | * |  | 名称 |
| `alias` | String |  |  | 别名 |
| `gender` | String |  |  | 性别 |
| `ethnicity` | String |  |  | 民族 |
| `hometown` | String |  |  | 籍贯 |
| `politics` | String |  |  | 政治面貌 |
| `education` | String |  |  | 学历 |
| `title` | String |  |  | 职称 |
| `school` | String |  |  | 毕业院校 |
| `major` | String |  |  | 专业 |
| `phone` | String |  |  | 电话 |
| `joinDate` | String |  |  | 进司时间 |
| `nature` | String |  |  | 性质（全职/兼职等） |
| `createdAt` | DateTime | * |  | 创建时间 |
| `updatedAt` | DateTime | * |  | 更新时间 |
| `leaveDate` | String |  |  | 离职日期 |
| `status` | String |  |  | 状态 |
| `deleted` | Boolean |  |  | 是否软删除 |
| `deletedTime` | String |  |  | 删除时间 |
| `deletedBy` | String |  |  | 删除操作人 |
| `userId` | Int |  | FK | 用户ID |
| `editedBy` | Int |  | FK | 编辑人用户ID |
| `editedAt` | DateTime |  |  | 编辑时间 |
| `version` | Int | * |  | 版本号 |

→ Depends on: [1-1 User](#user), [1-1 User](#user)

← Referenced by: [5-5 EmployeePosition](#employeeposition), [5-9 EmployeeProject](#employeeproject)

### 5-2 Company

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * |  | 主键 |
| `code` | String | * |  | 本级编码（一级: 0,1; 二级: 0,1,2,3...） |
| `name` | String | * |  | 公司名称（父级内唯一） |
| `parentId` | Int |  | FK | 上级公司ID（null=一级公司） |
| `sortOrder` | Int | * |  | 排序 |
| `createdAt` | DateTime | * |  | 创建时间 |
| `updatedAt` | DateTime |  |  | 更新时间 |
| `editedBy` | Int |  | FK | 编辑人用户ID |
| `editedAt` | DateTime |  |  | 编辑时间 |
| `version` | Int | * |  | 版本号 |

→ Depends on: [5-2 Company](#company), [1-1 User](#user)

### 5-3 Department

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | REF | 主键 |
| `code` | String | * |  | 编码 |
| `name` | String | * |  | 名称 |
| `level` | Int | * |  | 层级 |
| `parentId` | Int |  | FK | 上级ID |
| `managerUserId` | Int |  | FK | 负责人 → User.id |
| `company` | String |  |  | 公司编码（如 01/02/03） |
| `createdAt` | DateTime | * |  | 创建时间 |
| `updatedAt` | DateTime |  |  | 更新时间 |
| `editedBy` | Int |  | FK | 编辑人用户ID |
| `editedAt` | DateTime |  |  | 编辑时间 |
| `version` | Int | * |  | 版本号 |

→ Depends on: [5-3 Department](#department), [1-1 User](#user), [1-1 User](#user)

← Referenced by: [2-5 DepartmentResourceRole](#departmentresourcerole), [5-5 EmployeePosition](#employeeposition), [5-6 DepartmentPosition](#departmentposition), [5-8 ProjectDepartment](#projectdepartment)

### 5-4 Position

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | REF | 主键 |
| `code` | String | * |  | 编码 |
| `name` | String | * |  | 名称 |
| `company` | String |  |  | 公司编码（如 01/02/03） |
| `createdAt` | DateTime | * |  | 创建时间 |
| `updatedAt` | DateTime |  |  | 更新时间 |
| `editedBy` | Int |  | FK | 编辑人用户ID |
| `editedAt` | DateTime |  |  | 编辑时间 |
| `version` | Int | * |  | 版本号 |

→ Depends on: [1-1 User](#user)

← Referenced by: [2-4 PositionResourceRole](#positionresourcerole), [5-5 EmployeePosition](#employeeposition), [5-6 DepartmentPosition](#departmentposition)

### 5-5 EmployeePosition

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * |  | 主键 |
| `employeeId` | Int | * | FK | 员工编号 |
| `departmentId` | Int | * | FK | 部门ID |
| `positionId` | Int | * | FK | 岗位ID |
| `company` | String |  |  | 公司编码（如 01/02/03） |
| `center` | String |  |  | 中心 |
| `isPrimary` | Boolean | * |  | 是否主岗 |
| `sortOrder` | Int | * |  | 排序序号 |
| `startDate` | String |  |  | 任职开始日期 |
| `endDate` | String |  |  | 任职结束日期（null=至今） |
| `createdAt` | DateTime | * |  | 创建时间 |
| `updatedAt` | DateTime |  |  | 更新时间 |
| `editedBy` | Int |  | FK | 编辑人用户ID |
| `editedAt` | DateTime |  |  | 编辑时间 |
| `version` | Int | * |  | 版本号 |

→ Depends on: [5-1 Employee](#employee), [5-3 Department](#department), [5-4 Position](#position), [1-1 User](#user)

### 5-6 DepartmentPosition

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * |  | 主键 |
| `departmentId` | Int | * | FK | 部门ID |
| `positionId` | Int | * | FK | 岗位ID |
| `company` | String |  |  | 公司编码（如 01/02/03） |
| `createdAt` | DateTime | * |  | 创建时间 |
| `updatedAt` | DateTime |  |  | 更新时间 |
| `editedBy` | Int |  | FK | 编辑人用户ID |
| `editedAt` | DateTime |  |  | 编辑时间 |
| `version` | Int | * |  | 版本号 |

→ Depends on: [5-3 Department](#department), [5-4 Position](#position), [1-1 User](#user)

### 5-7 Project

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | REF | 主键 |
| `name` | String | * |  | 项目名称 |
| `type` | String | * |  | "department" | "project" |
| `description` | String |  |  | 说明 |
| `createdAt` | DateTime | * |  | 创建时间 |
| `updatedAt` | DateTime |  |  | 更新时间 |
| `editedBy` | Int |  | FK | 编辑人用户ID |
| `editedAt` | DateTime |  |  | 编辑时间 |
| `version` | Int | * |  | 版本号 |

→ Depends on: [1-1 User](#user)

← Referenced by: [5-8 ProjectDepartment](#projectdepartment), [5-9 EmployeeProject](#employeeproject)

### 5-8 ProjectDepartment

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `projectId` | Int | * | FK | → Project.id |
| `departmentId` | Int | * | FK | → Department.id |

→ Depends on: [5-7 Project](#project), [5-3 Department](#department)

### 5-9 EmployeeProject

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * |  | 主键 |
| `employeeId` | Int | * | FK | 员工ID |
| `projectId` | Int | * | FK | 项目ID |
| `role` | String |  |  | 项目角色 |
| `startDate` | String |  |  | 开始日期 |
| `endDate` | String |  |  | 结束日期 |
| `createdAt` | DateTime | * |  | 创建时间 |
| `updatedAt` | DateTime |  |  | 更新时间 |
| `editedBy` | Int |  | FK | 编辑人用户ID |
| `editedAt` | DateTime |  |  | 编辑时间 |
| `version` | Int | * |  | 版本号 |

→ Depends on: [5-1 Employee](#employee), [5-7 Project](#project), [1-1 User](#user)

## 6. Edit History

### 6-1 EditHistory

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * |  | 主键 |
| `entityType` | String | * |  | "employee" | "employee_position" | "code_department" | "code_position" |
| `entityId` | String | * |  | 实体主键 |
| `version` | Int | * |  | 版本号 |
| `dataJson` | String | * |  | 编辑前快照 |
| `editedBy` | Int | * | FK | 编辑人用户ID |
| `createdAt` | DateTime | * |  | 创建时间 |

→ Depends on: [1-1 User](#user)
