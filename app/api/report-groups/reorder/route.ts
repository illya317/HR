import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - 批量更新周报部门排序（仅超级管理员）
export async function POST(request: Request) {
  const { error, status } = await requireAdmin(request);
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { orders } = body; // [{ id, sortOrder }]

  if (!Array.isArray(orders)) {
    return NextResponse.json({ error: "参数错误" }, { status: 400 });
  }

  await prisma.$transaction(
    orders.map((o: { id: number; sortOrder: number }) =>
      prisma.reportGroup.update({
        where: { id: o.id },
        data: { sortOrder: o.sortOrder },
      })
    )
  );

  return NextResponse.json({ success: true });
}
