// 通用 CRUD 模板：auth + 权限 + snapshotHistory 统一处理
import { NextResponse } from "next/server";
import { authenticate, checkHRAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { snapshotHistory } from "@/lib/history";

type PrismaModelKey = keyof typeof prisma;

export interface CrudConfig {
  entityType: string;
  modelKey: PrismaModelKey;
  allowedFields?: string[];
  /** 自定义校验/转换：返回 { field, value } 继续，返回 null 拒绝 */
  onBeforeUpdate?: (field: string, value: unknown) => Promise<{ field: string; value: unknown } | null>;
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
  let { field, value } = body as { field: string; value: unknown };

  // 自定义转换（如兼容旧字段名、类型转换）
  if (config.onBeforeUpdate) {
    const result = await config.onBeforeUpdate(field, value);
    if (!result) return NextResponse.json({ error: "非法字段" }, { status: 400 });
    field = result.field;
    value = result.value;
  }

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

/** 通用新建 POST /api/xxx */
export async function handleCreate(
  request: Request,
  config: CrudConfig,
  /** 可选：从 body 提取 data + 校验 */
  buildData?: (body: any) => Record<string, unknown> | null
) {
  const payload = await authenticate(request);
  if (!payload) return NextResponse.json({ error: "未登录" }, { status: 401 });
  if (!(await checkHRAccess(payload.userId))) return NextResponse.json({ error: "无权限" }, { status: 403 });

  const body = await request.json();
  const data = buildData ? buildData(body) : body;
  if (!data) return NextResponse.json({ error: "数据校验失败" }, { status: 400 });

  const model = prisma[config.modelKey] as any;
  const record = await model.create({ data: { ...data, editedBy: payload.userId } });
  await snapshotHistory(config.entityType, record.id, payload.userId);

  return NextResponse.json({ success: true });
}
