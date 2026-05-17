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

/** 检查员工是否对某资源有权限（包含继承：父级授权 ⇒ 子级也有权限） */
export function userHasAccess(emp: EmployeePerm, resourceKey: string): boolean {
  const parts = resourceKey.split(".");
  const keys = [resourceKey];
  while (parts.length > 1) {
    parts.pop();
    keys.push(parts.join("."));
  }
  return keys.some((k) =>
    emp.resourceRoles.some((rr) => rr.resource?.key === k && rr.role?.key === "access")
  );
}

/** 检查员工是否对某资源有直接授权（不含继承） */
export function userHasDirectAccess(emp: EmployeePerm, resourceKey: string): boolean {
  return emp.resourceRoles.some(
    (rr) => rr.resource?.key === resourceKey && rr.role?.key === "access"
  );
}
