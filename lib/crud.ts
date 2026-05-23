// 通用 CRUD 模板：auth + 权限 + snapshotHistory 统一处理
import { NextResponse } from "next/server";
import { authenticate, checkHRAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { snapshotHistory } from "@/lib/history";

type PrismaModelKey = keyof typeof prisma;

export interface CrudConfig {
  entityType: string;     // 如 "Employee"
  modelKey: PrismaModelKey; // 如 "employee"
  allowedFields?: string[]; // 单字段编辑白名单
}

/** 通用单字段编辑 PUT /api/xxx/[id] */
export async function handleUpdateField(
  request: Request,
  params: Promise<{ id: string }>,
  config: CrudConfig
) {
  const payload = await authenticate(request);
  if (!payload) return NextResponse.json({ error: "未登录" }, { status: 401 });
  if (!(await checkHRAccess(payload.userId))) return NextResponse.json({ error: "无权限" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const { field, value } = body as { field: string; value: unknown };

  const allowed = config.allowedFields || [];
  if (!allowed.includes(field)) return NextResponse.json({ error: "非法字段" }, { status: 400 });

  const model = prisma[config.modelKey] as any;
  await model.update({
    where: { id: parseInt(id) },
    data: { [field]: value ?? null, editedBy: payload.userId, editedAt: new Date(), version: { increment: 1 } },
  });
  await snapshotHistory(config.entityType, parseInt(id), payload.userId);

  return NextResponse.json({ success: true });
}

/** 通用删除 DELETE /api/xxx/[id] */
export async function handleDelete(
  request: Request,
  params: Promise<{ id: string }>,
  config: CrudConfig
) {
  const payload = await authenticate(request);
  if (!payload) return NextResponse.json({ error: "未登录" }, { status: 401 });
  if (!(await checkHRAccess(payload.userId))) return NextResponse.json({ error: "无权限" }, { status: 403 });

  const { id } = await params;
  await snapshotHistory(config.entityType, parseInt(id), payload.userId);

  const model = prisma[config.modelKey] as any;
  await model.delete({ where: { id: parseInt(id) } });

  return NextResponse.json({ success: true });
}
