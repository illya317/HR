import { NextResponse } from "next/server";
import { authenticate, checkPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - read system config
export async function GET(request: Request) {
  const payload = await authenticate(request);
  if (!payload) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const isSuperAdmin = await checkPermission(payload.userId, "system", "admin");
  if (!isSuperAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const config = await prisma.systemConfig.findUnique({
    where: { key: "conflictStrategy" },
  });

  return NextResponse.json({
    conflictStrategy: config?.value || "union",
  });
}

// PUT - update system config
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
  const { conflictStrategy } = body;

  if (!conflictStrategy || !["union", "deny_override"].includes(conflictStrategy)) {
    return NextResponse.json(
      { error: "参数错误: conflictStrategy 需要是 union 或 deny_override" },
      { status: 400 }
    );
  }

  await prisma.systemConfig.upsert({
    where: { key: "conflictStrategy" },
    update: { value: conflictStrategy },
    create: { key: "conflictStrategy", value: conflictStrategy },
  });

  return NextResponse.json({ success: true, conflictStrategy });
}