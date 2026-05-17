import type { ResourceItem, EmployeePerm } from "./types";

export function isTopLevelResource(key: string): boolean {
  return ["system", "people", "work", "docs"].includes(key);
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
    (rr) => rr.resource?.key === resourceKey && rr.role?.key === "access"
  );
}
