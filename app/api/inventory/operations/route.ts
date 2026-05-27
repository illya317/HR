import { NextResponse } from "next/server";
import { withInventoryAccess } from "@/lib/with-auth";
import { prisma } from "@/lib/prisma";

export const GET = withInventoryAccess(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get("targetType");
  const targetId = searchParams.get("targetId");
  const where: any = {};
  if (targetType) where.targetType = targetType;
  if (targetId) where.targetId = parseInt(targetId);

  const ops = await prisma.stockOperation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { editor: { select: { name: true } } },
  });
  return NextResponse.json({ operations: ops });
});

export const POST = withInventoryAccess(async (request: Request, user) => {
  const body = await request.json();
  const { opType, targetType, targetId, quantity, docNo, reason } = body;
  if (!opType || !targetType || !targetId || quantity === undefined) {
    return NextResponse.json({ error: "操作类型、对象类型、对象ID、数量为必填" }, { status: 400 });
  }

  const q = parseFloat(quantity);

  // 根据目标类型更新库存
  let model: any = null;
  let updateField = "";
  if (targetType === "raw_material") {
    model = prisma.stockRawMaterial;
    if (opType === "purchase") updateField = "currentPurchase";
    else if (opType === "consume") updateField = "currentConsume";
  } else if (targetType === "packaging") {
    model = prisma.stockPackaging;
    if (opType === "inbound") updateField = "currentInbound";
    else if (opType === "outbound") updateField = "currentOutbound";
  } else if (targetType === "finished_goods") {
    model = prisma.stockFinishedGoods;
    if (opType === "inbound") updateField = "currentInbound";
    else if (opType === "outbound") updateField = "currentOutbound";
  }

  if (model && updateField) {
    const existing = await model.findUnique({ where: { id: parseInt(targetId) } });
    if (!existing) return NextResponse.json({ error: "库存对象不存在" }, { status: 404 });
    await model.update({
      where: { id: parseInt(targetId) },
      data: { [updateField]: (existing as any)[updateField] + q },
    });
  }

  const op = await prisma.stockOperation.create({
    data: {
      opType, targetType, targetId: parseInt(targetId),
      quantity: q, docNo: docNo || null, reason: reason || null,
      operatorId: user.userId,
    },
  });

  return NextResponse.json({ success: true, operation: op });
});
