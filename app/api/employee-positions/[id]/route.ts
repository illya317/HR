import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await authenticate(request);
  if (!payload) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { isWorkListAdmin: true, canAccessHR: true },
  });

  if (!user?.canAccessHR && !user?.isWorkListAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { field, value } = body as { field: string; value: string | boolean | null };

  const allowedFields = ["company", "center", "dept1", "position", "isPrimary"];
  if (!allowedFields.includes(field)) {
    return NextResponse.json({ error: "非法字段" }, { status: 400 });
  }

  const epId = parseInt(id);

  if (field === "dept1") {
    const deptName = String(value || "");
    if (!deptName) {
      return NextResponse.json({ error: "部门名称不能为空" }, { status: 400 });
    }
    const dept = await prisma.department.findFirst({ where: { name: deptName } });
    if (!dept) {
      return NextResponse.json(
        { error: `部门"${deptName}"不存在，请先到编码管理添加` },
        { status: 400 }
      );
    }
    await prisma.employeePosition.update({
      where: { id: epId },
      data: { departmentId: dept.id },
    });
  } else if (field === "position") {
    const posName = String(value || "");
    if (!posName) {
      return NextResponse.json({ error: "岗位名称不能为空" }, { status: 400 });
    }
    const pos = await prisma.position.findFirst({ where: { name: posName } });
    if (!pos) {
      return NextResponse.json(
        { error: `岗位"${posName}"不存在，请先到编码管理添加` },
        { status: 400 }
      );
    }
    await prisma.employeePosition.update({
      where: { id: epId },
      data: { positionId: pos.id },
    });
  } else {
    await prisma.employeePosition.update({
      where: { id: epId },
      data: { [field]: value },
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await authenticate(request);
  if (!payload) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { isWorkListAdmin: true, canAccessHR: true },
  });

  if (!user?.canAccessHR && !user?.isWorkListAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.employeePosition.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
