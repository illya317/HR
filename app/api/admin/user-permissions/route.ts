import { NextResponse } from "next/server";
import { authenticate, checkPermission, getResourceDescendants } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  const payload = await authenticate(request);
  if (!payload) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  if (!(await checkPermission(payload.userId, "system", "admin"))) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, resourceKey, roleKey, value } = body;

  if (!userId || !resourceKey || !roleKey || typeof value !== "boolean") {
    return NextResponse.json(
      { error: "参数错误: 需要 userId, resourceKey, roleKey, value" },
      { status: 400 }
    );
  }

  const resource = await prisma.resource.findUnique({
    where: { key: resourceKey },
  });
  const role = await prisma.role.findUnique({
    where: { key: roleKey },
  });

  if (!resource || !role) {
    return NextResponse.json(
      { error: `无效的 resourceKey(${resourceKey}) 或 roleKey(${roleKey})` },
      { status: 400 }
    );
  }

  if (value) {
    // Grant: create UserResourceRole for this resource + all descendants
    const descendantIds = await getResourceDescendants(resource.id);
    for (const rid of descendantIds) {
      const existing = await prisma.userResourceRole.findFirst({
        where: {
          userId,
          resourceId: rid,
          roleId: role.id,
          scopeId: null,
        },
      });
      if (!existing) {
        await prisma.userResourceRole.create({
          data: {
            userId,
            resourceId: rid,
            roleId: role.id,
            scopeId: null,
          },
        });
      }
    }
  } else {
    // 禁止取消自己的系统管理员权限
    if (resourceKey === "system" && roleKey === "admin" && userId === payload.userId) {
      return NextResponse.json({ error: "不能取消自己的系统管理员权限" }, { status: 403 });
    }
    // Revoke: delete only the exact resource (children remain independent)
    await prisma.userResourceRole.deleteMany({
      where: {
        userId,
        resourceId: resource.id,
        roleId: role.id,
        scopeId: null,
      },
    });
  }

  return NextResponse.json({ success: true });
}
