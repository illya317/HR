import { prisma } from "@/lib/prisma";
import { normalizeRoleKey } from "@/lib/permissions";

export type SubjectType = "user" | "position" | "department";

interface GrantItem {
  subjectId: number;
  resourceKey: string;
  roleKey: string;
  resourceId: number;
  roleId: number;
}

export async function setGrant(
  subjectType: SubjectType,
  subjectId: number,
  resourceKey: string,
  roleKey: string,
  value: boolean,
  opts?: { scopeId?: string | null; actorUserId?: number }
): Promise<void> {
  const normalizedRole = normalizeRoleKey(roleKey);

  const resource = await prisma.resource.findUnique({ where: { key: resourceKey } });
  const role = await prisma.role.findUnique({ where: { key: normalizedRole } });

  if (!resource || !role) {
    throw new Error(`Invalid resourceKey(${resourceKey}) or roleKey(${roleKey})`);
  }

  // Self-protection: cannot revoke own system.admin
  if (
    !value &&
    subjectType === "user" &&
    subjectId === opts?.actorUserId &&
    resourceKey === "system" &&
    normalizedRole === "admin"
  ) {
    throw new Error("不能取消自己的系统管理员权限");
  }

  const scopeId = opts?.scopeId ?? null;

  if (subjectType === "user") {
    if (value) {
      const existing = await prisma.userResourceRole.findFirst({
        where: { userId: subjectId, resourceId: resource.id, roleId: role.id, scopeId },
      });
      if (!existing) {
        await prisma.userResourceRole.create({
          data: { userId: subjectId, resourceId: resource.id, roleId: role.id, scopeId },
        });
      }
    } else {
      await prisma.userResourceRole.deleteMany({
        where: { userId: subjectId, resourceId: resource.id, roleId: role.id, scopeId },
      });
    }
  } else if (subjectType === "position") {
    if (value) {
      const existing = await prisma.positionResourceRole.findFirst({
        where: { positionId: subjectId, resourceId: resource.id, roleId: role.id, scopeId },
      });
      if (!existing) {
        await prisma.positionResourceRole.create({
          data: { positionId: subjectId, resourceId: resource.id, roleId: role.id, scopeId },
        });
      }
    } else {
      await prisma.positionResourceRole.deleteMany({
        where: { positionId: subjectId, resourceId: resource.id, roleId: role.id, scopeId },
      });
    }
  } else if (subjectType === "department") {
    if (value) {
      const existing = await prisma.departmentResourceRole.findFirst({
        where: { departmentId: subjectId, resourceId: resource.id, roleId: role.id, scopeId },
      });
      if (!existing) {
        await prisma.departmentResourceRole.create({
          data: { departmentId: subjectId, resourceId: resource.id, roleId: role.id, scopeId },
        });
      }
    } else {
      await prisma.departmentResourceRole.deleteMany({
        where: { departmentId: subjectId, resourceId: resource.id, roleId: role.id, scopeId },
      });
    }
  }
}

export async function getGrants(
  subjectType: SubjectType,
  subjectId?: number
): Promise<GrantItem[]> {
  let rows: Array<{
    userId?: number;
    positionId?: number;
    departmentId?: number;
    resourceId: number;
    roleId: number;
    resource: { key: string };
    role: { key: string };
  }> = [];

  const include = { resource: { select: { key: true } }, role: { select: { key: true } } };

  if (subjectType === "user") {
    rows = await prisma.userResourceRole.findMany({
      where: subjectId !== undefined ? { userId: subjectId } : {},
      include,
    });
  } else if (subjectType === "position") {
    rows = await prisma.positionResourceRole.findMany({
      where: subjectId !== undefined ? { positionId: subjectId } : {},
      include,
    });
  } else if (subjectType === "department") {
    rows = await prisma.departmentResourceRole.findMany({
      where: subjectId !== undefined ? { departmentId: subjectId } : {},
      include,
    });
  }

  const getSubjectId = (r: typeof rows[number]): number => {
    if (subjectType === "user") return r.userId!;
    if (subjectType === "position") return r.positionId!;
    return r.departmentId!;
  };

  return rows.map((r) => ({
    subjectId: getSubjectId(r),
    resourceKey: r.resource.key,
    roleKey: r.role.key,
    resourceId: r.resourceId,
    roleId: r.roleId,
  }));
}
