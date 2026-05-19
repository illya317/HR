# HR Database Schema (23 tables)

## 1. System

### 1-1 User

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | PK+REF | 主键 |
| `wxUserId` | String |  | UK | 微信用户ID（无微信则留空） |
| `username` | String |  | UK | 登录用户名（自取） |
| `password` | String |  |  | 登录密码 |
| `name` | String | * |  | 名称 |
| `avatar` | String |  |  | 头像URL |
| `routineItems` | String |  |  | 日常工作模板JSON |
| `canLogin` | Boolean | * |  | 离职=停用，不删号（账号状态，非权限） |
| `apiKey` | String |  | UK | API密钥 |
| `createdAt` | DateTime | * |  | 创建时间 |

← Referenced by: [2-3 UserResourceRole](#userresourcerole), [3-1 Report](#report), [5-1 Employee](#employee), [5-1 Employee](#employee), [5-2 Company](#company), [5-5 Department](#department), [5-5 Department](#department), [5-6 Position](#position), [5-7 EmployeeDepartmentPosition](#employeedepartmentposition), [5-8 Project](#project), [5-9 EmployeeProject](#employeeproject), [7-1 EditHistory](#edithistory)

### 1-2 SystemConfig

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `key` | String | * |  |  |
| `value` | String | * |  |  |

## 2. RBAC

### 2-1 Resource

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | PK+REF |  |
| `key` | String | * | UK |  |
| `name` | String | * |  |  |
| `description` | String |  |  |  |
| `level` | Int | * |  | 1=父权限(无parentId), 2+=子权限 |
| `sortOrder` | Int | * |  |  |
| `parentId` | Int |  | FK | 上级资源（level≥2时必填） |

→ Depends on: [2-1 Resource](#resource)

← Referenced by: [2-3 UserResourceRole](#userresourcerole), [2-4 PositionResourceRole](#positionresourcerole), [2-5 DepartmentResourceRole](#departmentresourcerole)

### 2-2 Role

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | PK+REF |  |
| `key` | String | * | UK | "access" | "read" | "write" | "delete" | "admin" |
| `name` | String | * |  |  |
| `description` | String |  |  |  |
| `sortOrder` | Int | * |  |  |

← Referenced by: [2-3 UserResourceRole](#userresourcerole), [2-4 PositionResourceRole](#positionresourcerole), [2-5 DepartmentResourceRole](#departmentresourcerole)

### 2-3 UserResourceRole

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | PK |  |
| `userId` | Int | * | cUK+FK | → User.id |
| `resourceId` | Int | * | cUK+FK | → Resource.id |
| `roleId` | Int | * | cUK+FK | → Role.id |
| `scopeId` | String |  | cUK | null=全局, 有值=范围实例 |

→ Depends on: [1-1 User](#user), [2-1 Resource](#resource), [2-2 Role](#role)

### 2-4 PositionResourceRole

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | PK |  |
| `positionId` | Int | * | cUK+FK | → Position.id |
| `resourceId` | Int | * | cUK+FK | → Resource.id |
| `roleId` | Int | * | cUK+FK | → Role.id |
| `scopeId` | String |  | cUK |  |

→ Depends on: [5-6 Position](#position), [2-1 Resource](#resource), [2-2 Role](#role)

### 2-5 DepartmentResourceRole

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | PK |  |
| `departmentId` | Int | * | cUK+FK | → Department.id |
| `resourceId` | Int | * | cUK+FK | → Resource.id |
| `roleId` | Int | * | cUK+FK | → Role.id |
| `scopeId` | String |  | cUK |  |

→ Depends on: [5-5 Department](#department), [2-1 Resource](#resource), [2-2 Role](#role)

## 3. Reports

### 3-1 Report

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | PK+REF | 主键 |
| `userId` | Int |  | cUK+FK | 用户ID |
| `targetType` | String | * | cUK | "department" | "project" | "position" |
| `targetId` | Int | * | cUK | 多态 FK → Department.id | Project.id | Position.id |
| `date` | String | * | cUK | 日期（yyyy-MM-dd，日报=当天，周报=周一，月报=月初） |
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
| `id` | Int | * | PK | 主键 |
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
| `id` | Int | * | PK | 主键 |
| `reportId` | Int | * | cUK+FK | 周报ID |
| `version` | Int | * | cUK | 版本号 |
| `taskName` | String | * |  | 任务名称 |
| `notes` | String |  |  | 备注 |
| `itemsJson` | String | * |  | 条目JSON快照 |
| `createdAt` | DateTime | * |  | 创建时间 |

→ Depends on: [3-1 Report](#report)

## 4. Tasks

### 4-1 WorkItem

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | PK+REF | 主键 |
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
| `id` | Int | * | PK | 主键 |
| `workItemId` | Int | * | FK | 关联工作清单条目ID |
| `name` | String | * |  | 名称 |
| `wxUserId` | String |  |  | 微信用户ID |
| `createdAt` | DateTime | * |  | 创建时间 |

→ Depends on: [4-1 WorkItem](#workitem)

## 5. Roster & Org

### 5-1 Employee

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | PK+REF | 主键 |
| `employeeId` | String | * | UK | 员工编号 |
| `idNumber` | String |  | UK | 身份证号 |
| `name` | String | * |  | 名称 |
| `alias` | String |  |  | 别名 |
| `gender` | String |  |  | 性别 |
| `birthDate` | String |  |  | 出生年月 |
| `ethnicity` | String |  |  | 民族 |
| `hometown` | String |  |  | 籍贯 |
| `politics` | String |  |  | 政治面貌 |
| `education` | String |  |  | 学历 |
| `title` | String |  |  | 职称 |
| `school` | String |  |  | 毕业院校 |
| `major` | String |  |  | 专业 |
| `phone` | String |  |  | 电话 |
| `joinDate` | String |  |  | 进司时间 |
| `workStartDate` | String |  |  | 参加工作时间 |
| `nature` | String |  |  | 性质（全职/兼职等） |
| `leaveDate` | String |  |  | 离职日期 |
| `status` | String |  |  | 状态 |
| `details` | String |  |  | JSON: {companyTitle,majorRelevant,officeLocation,attendanceType,leaveReason,serviceYears,...} |
| `createdAt` | DateTime | * |  | 创建时间 |
| `updatedAt` | DateTime | * |  | 更新时间 |
| `deleted` | Boolean |  |  | 是否软删除 |
| `deletedTime` | String |  |  | 删除时间 |
| `deletedBy` | String |  |  | 删除操作人 |
| `userId` | Int |  | FK | 用户ID |
| `editedBy` | Int |  | FK | 编辑人用户ID |
| `editedAt` | DateTime |  |  | 编辑时间 |
| `version` | Int | * |  | 版本号 |

→ Depends on: [1-1 User](#user), [1-1 User](#user)

← Referenced by: [5-7 EmployeeDepartmentPosition](#employeedepartmentposition), [5-9 EmployeeProject](#employeeproject)

### 5-2 Company

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | PK+REF | 主键 |
| `code` | String | * | UK | 编码 |
| `name` | String | * | UK | 名称 |
| `fullName` | String |  |  | 全称 |
| `registeredCapital` | String |  |  | 注册资本 |
| `unifiedCode` | String |  |  | 统一社会信用代码 |
| `bankName` | String |  |  | 开户行 |
| `registeredAddress` | String |  |  | 办公地址 |
| `registeredDate` | String |  |  | 注册时间 |
| `legalPerson` | String |  |  | 法定代表人 |
| `queryGroup` | Int |  |  | 查询分组（1=常规体系, 2=GMP） |
| `sortOrder` | Int | * |  | 排序 |
| `createdAt` | DateTime | * |  | 创建时间 |
| `updatedAt` | DateTime |  |  | 更新时间 |
| `editedBy` | Int |  | FK | 编辑人用户ID |
| `editedAt` | DateTime |  |  | 编辑时间 |
| `version` | Int | * |  | 版本号 |

→ Depends on: [1-1 User](#user)

← Referenced by: [5-3 CompanyRelation](#companyrelation), [5-3 CompanyRelation](#companyrelation)

### 5-3 CompanyRelation

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | PK |  |
| `parentId` | Int | * | cUK+FK | 持股方 |
| `childId` | Int | * | cUK+FK | 被持股方 |
| `shareRatio` | Float |  |  | 持股比例 |
| `isConsolidated` | Boolean | * |  | 是否并表 |

→ Depends on: [5-2 Company](#company), [5-2 Company](#company)

### 5-4 ManagementGroup

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | PK+REF |  |
| `name` | String | * | UK | 常规体系, GMP |

← Referenced by: [5-5 Department](#department), [5-6 Position](#position), [6-1 PositionDescription](#positiondescription)

### 5-5 Department

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | PK+REF | 主键 |
| `code` | String | * | cUK | 编码 |
| `name` | String | * |  | 名称 |
| `managementGroupId` | Int |  | cUK+FK | 体系ID |
| `level` | Int | * |  | 层级 |
| `levelLabel` | String | * |  | 层级标签（中心/部门/子部门） |
| `parentId` | Int |  | FK | 上级ID |
| `managerUserId` | Int |  | FK | 负责人 → User.id |
| `endDate` | DateTime |  |  | 截止时间（null=至今） |
| `createdAt` | DateTime | * |  | 创建时间 |
| `updatedAt` | DateTime |  |  | 更新时间 |
| `editedBy` | Int |  | FK | 编辑人用户ID |
| `editedAt` | DateTime |  |  | 编辑时间 |
| `version` | Int | * |  | 版本号 |

→ Depends on: [5-4 ManagementGroup](#managementgroup), [5-5 Department](#department), [1-1 User](#user), [1-1 User](#user)

← Referenced by: [2-5 DepartmentResourceRole](#departmentresourcerole), [5-6 Position](#position), [5-7 EmployeeDepartmentPosition](#employeedepartmentposition)

### 5-6 Position

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | PK+REF | 主键 |
| `code` | String | * | cUK | 编码 |
| `name` | String | * |  | 名称 |
| `managementGroupId` | Int |  | cUK+FK | 体系ID |
| `departmentId` | Int |  | FK | 所属部门 |
| `positionDescriptionId` | Int |  | FK | → PositionDescription.id |
| `endDate` | DateTime |  |  | 截止时间（null=至今） |
| `createdAt` | DateTime | * |  | 创建时间 |
| `updatedAt` | DateTime |  |  | 更新时间 |
| `editedBy` | Int |  | FK | 编辑人用户ID |
| `editedAt` | DateTime |  |  | 编辑时间 |
| `version` | Int | * |  | 版本号 |

→ Depends on: [5-4 ManagementGroup](#managementgroup), [5-5 Department](#department), [6-1 PositionDescription](#positiondescription), [1-1 User](#user)

← Referenced by: [2-4 PositionResourceRole](#positionresourcerole), [5-7 EmployeeDepartmentPosition](#employeedepartmentposition)

### 5-7 EmployeeDepartmentPosition

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | PK | 主键 |
| `employeeId` | Int | * | cUK+FK | 员工编号 |
| `departmentId` | Int | * | cUK+FK | 部门ID |
| `positionId` | Int | * | cUK+FK | 岗位ID |
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

→ Depends on: [5-1 Employee](#employee), [5-5 Department](#department), [5-6 Position](#position), [1-1 User](#user)

### 5-8 Project

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | PK+REF | 主键 |
| `name` | String | * |  | 项目名称 |
| `type` | String | * |  | "department" | "project" |
| `description` | String |  |  | 说明 |
| `endDate` | DateTime |  |  | 截止时间（null=至今） |
| `createdAt` | DateTime | * |  | 创建时间 |
| `updatedAt` | DateTime |  |  | 更新时间 |
| `editedBy` | Int |  | FK | 编辑人用户ID |
| `editedAt` | DateTime |  |  | 编辑时间 |
| `version` | Int | * |  | 版本号 |

→ Depends on: [1-1 User](#user)

← Referenced by: [5-9 EmployeeProject](#employeeproject)

### 5-9 EmployeeProject

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | PK | 主键 |
| `employeeId` | Int | * | cUK+FK | 员工ID |
| `projectId` | Int | * | cUK+FK | 项目ID |
| `role` | String |  |  | 项目角色 |
| `startDate` | String |  |  | 开始日期 |
| `endDate` | String |  |  | 结束日期 |
| `createdAt` | DateTime | * |  | 创建时间 |
| `updatedAt` | DateTime |  |  | 更新时间 |
| `editedBy` | Int |  | FK | 编辑人用户ID |
| `editedAt` | DateTime |  |  | 编辑时间 |
| `version` | Int | * |  | 版本号 |

→ Depends on: [5-1 Employee](#employee), [5-8 Project](#project), [1-1 User](#user)

## 岗位说明书

### 6-1 PositionDescription

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | PK+REF |  |
| `code` | String | * | UK | PPA-GW0101 |
| `name` | String | * |  | 岗位名称 |
| `departmentName` | String |  |  | 所属部门 |
| `reportTo` | String |  |  | 直接上级 |
| `positionPurpose` | String |  |  | 岗位目的（一句话） |
| `summary` | String |  |  | 职责概要（一段话） |
| `headcount` | Int |  |  | 编制人数 |
| `version` | String |  |  | 版本号 |
| `effectiveDate` | String |  |  | 生效日期 |
| `sourceFile` | String | * |  | 原始JSON文件名 |
| `managementGroupId` | Int | * | FK | → ManagementGroup.id |
| `details` | String |  |  | JSON: {duties, qualifications, conditions, collaborations, changeHistory, ...} |
| `createdAt` | DateTime | * |  |  |
| `updatedAt` | DateTime | * |  |  |

→ Depends on: [5-4 ManagementGroup](#managementgroup)

← Referenced by: [5-6 Position](#position)

## 6. Edit History

### 7-1 EditHistory

| Field | Type | Required | FK | Note |
|-------|------|----------|----|------|
| `id` | Int | * | PK | 主键 |
| `entityType` | String | * | cUK | "employee" | "employee_position" | "code_department" | "code_position" |
| `entityId` | String | * | cUK | 实体主键 |
| `version` | Int | * | cUK | 版本号 |
| `dataJson` | String | * |  | 编辑前快照 |
| `editedBy` | Int | * | FK | 编辑人用户ID |
| `createdAt` | DateTime | * |  | 创建时间 |

→ Depends on: [1-1 User](#user)
