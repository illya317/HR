import { getUserPositionIds, getUserDepartmentIds } from "./helpers";
import { checkPermission } from "./check";

export interface PermissionContext {
  userId: number;
  isAdmin: boolean;
  positionIds: number[];
  departmentIds: number[];
}

export async function getPermissionContext(userId: number): Promise<PermissionContext> {
  const [positionIds, departmentIds, isAdmin] = await Promise.all([
    getUserPositionIds(userId),
    getUserDepartmentIds(userId),
    checkPermission(userId, "system", "admin"),
  ]);
  return { userId, isAdmin, positionIds, departmentIds };
}
