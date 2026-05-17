import { NextResponse } from "next/server";
import { authenticate, checkHRAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const payload = await authenticate(request);
  if (!payload) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  if (!(await checkHRAccess(payload.userId))) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const codes = await prisma.company.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ codes: codes.map((r) => ({ code: r.code, name: r.name })) });
}

export async function PUT(request: Request) {
  const payload = await authenticate(request);
  if (!payload) return NextResponse.json({ error: "未登录" }, { status: 401 });
  if (!(await checkHRAccess(payload.userId))) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await request.json();
  const { code, name, originalCode } = body;
  if (!code || !name) return NextResponse.json({ error: "缺少参数" }, { status: 400 });

  if (originalCode && originalCode !== code) {
    const existing = await prisma.company.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: "编号已存在" }, { status: 400 });
    }
    const old = await prisma.company.findUnique({ where: { code: originalCode } });
    if (old) {
      const maxVer = await prisma.editHistory.findFirst({
        where: { entityType: "code_company", entityId: originalCode },
        orderBy: { version: "desc" },
        select: { version: true },
      });
      await prisma.editHistory.create({
        data: {
          entityType: "code_company",
          entityId: originalCode,
          version: (maxVer?.version || 0) + 1,
          dataJson: JSON.stringify(old),
          editedBy: payload.userId,
        },
      });
    }
    await prisma.company.update({
      where: { code: originalCode },
      data: { code, name, editedBy: payload.userId, editedAt: new Date(), version: { increment: 1 } },
    });
  } else {
    const old = await prisma.company.findUnique({ where: { code } });
    if (old) {
      const maxVer = await prisma.editHistory.findFirst({
        where: { entityType: "code_company", entityId: code },
        orderBy: { version: "desc" },
        select: { version: true },
      });
      await prisma.editHistory.create({
        data: {
          entityType: "code_company",
          entityId: code,
          version: (maxVer?.version || 0) + 1,
          dataJson: JSON.stringify(old),
          editedBy: payload.userId,
        },
      });
    }
    await prisma.company.upsert({
      where: { code },
      update: { name, editedBy: payload.userId, editedAt: new Date(), version: { increment: 1 } },
      create: { code, name, sortOrder: 0 },
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const payload = await authenticate(request);
  if (!payload) return NextResponse.json({ error: "未登录" }, { status: 401 });
  if (!(await checkHRAccess(payload.userId))) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.json({ error: "缺少code" }, { status: 400 });

  const company = await prisma.company.findUnique({ where: { code } });
  if (!company) return NextResponse.json({ error: "公司不存在" }, { status: 404 });

  await prisma.company.delete({ where: { code } });
  return NextResponse.json({ success: true });
}
