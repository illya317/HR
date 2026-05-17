import { NextResponse } from "next/server";
import { authenticate, checkPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - get all department-level permission grants
export async function GET(request: Request) {
  const payload = await authenticate(request);
  if (!payload) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const isSuperAdmin = await checkPermission(payload.userId, "system", "admin");
  if (!isSuperAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const grants = await prisma.departmentResourceRole.findMany({
    include: {
      resource: { select: { id: true, key: true, name: true } },
      role: { select: { id: true, key: true, name: true } },
      department: { select: { id: true, name: true, companyCode: true } },
    },
    orderBy: [
      { department: { companyCode: "asc" } },
      { department: { name: "asc" } },
    ],
  });

  return NextResponse.json({ grants });
}

// PUT - toggle a department-level permission grant
export async function PUT(request: Request) {
  const payload = await authenticate(request);
  if (!payload) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const isSuperAdmin = await checkPermission(payload.userId, "system", "admin");
  if (!isSuperAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await request.json();
  const { departmentId, resourceKey, roleKey, value } = body;

  if (!departmentId || !resourceKey || !roleKey || typeof value !== "boolean") {
    return NextResponse.json(
      { error: "参数错误: 需要 departmentId, resourceKey, roleKey, value" },
      { status: 400 }
    );
  }

  const resource = await prisma.resource.findUnique({ where: { key: resourceKey } });
  const role = await prisma.role.findUnique({ where: { key: roleKey } });

  if (!resource || !role) {
    return NextResponse.json({ error: "无效的resourceKey或roleKey" }, { status: 400 });
  }

  if (value) {
    const existing = await prisma.departmentResourceRole.findFirst({
      where: {
        departmentId,
        resourceId: resource.id,
        roleId: role.id,
        scopeId: null,
      },
    });
    if (!existing) {
      await prisma.departmentResourceRole.create({
        data: {
          departmentId,
          resourceId: resource.id,
          roleId: role.id,
        },
      });
    }
  } else {
    await prisma.departmentResourceRole.deleteMany({
      where: {
        departmentId,
        resourceId: resource.id,
        roleId: role.id,
      },
    });
  }

  return NextResponse.json({ success: true });
}