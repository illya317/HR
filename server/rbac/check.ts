import { prisma } from "@/lib/prisma";
import { getUserPositionIds, getUserDepartmentIds } from "./helpers";
import { getResourceDescendants } from "./resource";
import type { PermissionContext } from "./context";

export async function checkPermission(
  userId: number,
  resourceKey: string,
  roleKey: string,
): Promise<boolean> {
  // 0. system.admin bypass (skip if already checking system.admin itself)
  if (!(resourceKey === "system" && roleKey === "admin")) {
    const isSysAdmin = await checkPermission(userId, "system", "admin");
    if (isSysAdmin) return true;
  }

  // 1. Resolve resource
  const resource = await prisma.resource.findUnique({
    where: { key: resourceKey },
    select: { id: true },
  });
  if (!resource) return false;

  // 2. Check this resource AND all its descendants (子权限推断父权限)
  const resourceIds = await getResourceDescendants(resource.id);

  const userGrant = await prisma.userResourceRole.findFirst({
    where: {
      userId,
      resourceId: { in: resourceIds },
      role: { key: roleKey },
    },
  });
  if (userGrant) return true;

  const posIds = await getUserPositionIds(userId);
  if (posIds.length > 0) {
    const positionGrant = await prisma.positionResourceRole.findFirst({
      where: {
        positionId: { in: posIds },
        resourceId: { in: resourceIds },
        role: { key: roleKey },
      },
    });
    if (positionGrant) return true;
  }

  const deptIds = await getUserDepartmentIds(userId);
  if (deptIds.length > 0) {
    const deptGrant = await prisma.departmentResourceRole.findFirst({
      where: {
        departmentId: { in: deptIds },
        resourceId: { in: resourceIds },
        role: { key: roleKey },
      },
    });
    if (deptGrant) return true;
  }

  return false;
}

export async function checkPermissionWithContext(
  ctx: PermissionContext,
  resourceKey: string,
  roleKey: string,
): Promise<boolean> {
  if (ctx.isAdmin && !(resourceKey === "system" && roleKey === "admin")) return true;

  const resource = await prisma.resource.findUnique({
    where: { key: resourceKey },
    select: { id: true },
  });
  if (!resource) return false;

  const resourceIds = await getResourceDescendants(resource.id);

  const userGrant = await prisma.userResourceRole.findFirst({
    where: {
      userId: ctx.userId,
      resourceId: { in: resourceIds },
      role: { key: roleKey },
    },
  });
  if (userGrant) return true;

  if (ctx.positionIds.length > 0) {
    const positionGrant = await prisma.positionResourceRole.findFirst({
      where: {
        positionId: { in: ctx.positionIds },
        resourceId: { in: resourceIds },
        role: { key: roleKey },
      },
    });
    if (positionGrant) return true;
  }

  if (ctx.departmentIds.length > 0) {
    const deptGrant = await prisma.departmentResourceRole.findFirst({
      where: {
        departmentId: { in: ctx.departmentIds },
        resourceId: { in: resourceIds },
        role: { key: roleKey },
      },
    });
    if (deptGrant) return true;
  }

  return false;
}
