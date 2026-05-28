import type { ResourceItem, EmployeePerm, Subject, Grant, PermissionState, SubjectType } from "./types";

export const ROLE_META: Record<string, { name: string; color: string }> = {
  access: { name: "访问", color: "emerald" },
  write: { name: "编辑", color: "blue" },
  delete: { name: "删除", color: "red" },
  admin: { name: "管理", color: "purple" },
};

export const ROLE_PRIORITY: Record<string, number> = {
  admin: 4,
  write: 3,
  delete: 2,
  access: 1,
};

export function sourceLabel(source: string): string {
  switch (source) {
    case "direct":
      return "直接授权";
    case "position":
      return "岗位继承";
    case "department":
      return "部门继承";
    case "ancestor":
      return "父资源继承";
    case "system.admin":
      return "系统管理员";
    default:
      return source;
  }
}

export function computePermissionState(
  subject: Subject,
  roleKey: string,
  selectedResource: string | null,
  ancestorResourceKeys: string[],
  systemAdminIds: Set<number>,
  directGrants: Grant[],
  positionGrants: Grant[],
  departmentGrants: Grant[],
  subjectType: SubjectType
): PermissionState {
  if (systemAdminIds.has(subject.id)) {
    return { has: true, source: "system.admin" };
  }

  const directMatch = directGrants.find(
    (g) =>
      g.subjectId === subject.id &&
      (g.resourceKey === selectedResource ||
        ancestorResourceKeys.includes(g.resourceKey)) &&
      (g.roleKey === roleKey || g.roleKey === "admin")
  );
  if (directMatch) {
    return {
      has: true,
      source:
        directMatch.resourceKey === selectedResource ? "direct" : "ancestor",
    };
  }

  const extra = subject.extra;

  if (subjectType === "user" && extra?.positionIds?.length) {
    const posMatch = positionGrants.find(
      (g) =>
        extra.positionIds!.includes(g.subjectId) &&
        (g.resourceKey === selectedResource ||
          ancestorResourceKeys.includes(g.resourceKey)) &&
        (g.roleKey === roleKey || g.roleKey === "admin")
    );
    if (posMatch) return { has: true, source: "position" };
  }

  if (subjectType === "user" && extra?.departmentIds?.length) {
    const deptMatch = departmentGrants.find(
      (g) =>
        extra.departmentIds!.includes(g.subjectId) &&
        (g.resourceKey === selectedResource ||
          ancestorResourceKeys.includes(g.resourceKey)) &&
        (g.roleKey === roleKey || g.roleKey === "admin")
    );
    if (deptMatch) return { has: true, source: "department" };
  }

  return { has: false, source: null };
}

export function isTopLevelResource(key: string): boolean {
  return [
    "system",
    "people",
    "work",
    "docs",
    "finance",
    "inventory",
    "contract",
  ].includes(key);
}

export function flattenTree(resources: ResourceItem[]): ResourceItem[] {
  const result: ResourceItem[] = [];
  for (const r of resources) {
    result.push(r);
    if (r.children && r.children.length > 0) {
      result.push(...flattenTree(r.children));
    }
  }
  return result;
}

/** 检查员工是否对某资源有直接授权（精确匹配，不再检查祖先） */
export function userHasAccess(emp: EmployeePerm, resourceKey: string): boolean {
  return emp.resourceRoles.some(
    (rr) => rr.resource?.key === resourceKey && rr.role?.key === "access",
  );
}

export const HIDDEN_RESOURCE_KEYS = new Set<string>([]);

export function groupByParent(
  resources: ResourceItem[],
): Array<{ parent: ResourceItem; children: ResourceItem[] }> {
  const all = [...resources].sort((a, b) => a.key.localeCompare(b.key));
  const parents = all.filter(
    (r) => !r.key.includes(".") && !HIDDEN_RESOURCE_KEYS.has(r.key),
  );
  return parents.map((parent) => ({
    parent,
    children: all.filter((r) => r.key.startsWith(parent.key + ".")),
  }));
}
