import { NextResponse } from "next/server";
import { withInventoryAccess } from "@/lib/with-auth";
import { prisma } from "@/lib/prisma";

export const GET = withInventoryAccess(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as "warning" | "ledger" | null;

  if (type === "warning") {
    // 预警：有效期30天内 + 低库存（当前库存<10）
    const now = new Date();
    const warn30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const warn30Str = warn30.toISOString().slice(0, 10);

    const raw = await prisma.stockRawMaterial.findMany({
      where: { OR: [{ currentPurchase: { lt: 10 } }, { currentConsume: { gt: 0 } }] },
      orderBy: { code: "asc" },
    });
    const pkg = await prisma.stockPackaging.findMany({
      where: {
        OR: [
          { currentInbound: { lt: 10 } },
          { expiryDate: { lte: warn30Str } },
        ],
      },
      orderBy: { code: "asc" },
    });
    const fg = await prisma.stockFinishedGoods.findMany({
      where: {
        OR: [
          { availableStock: { lt: 10 } },
          { currentOutbound: { gt: 0 } },
        ],
      },
      orderBy: { code: "asc" },
    });

    return NextResponse.json({
      type: "warning",
      rawMaterials: raw.map((r) => ({ code: r.code, name: r.name, currentStock: r.lastBalance + r.currentPurchase - r.currentConsume })),
      packaging: pkg.map((p) => ({ code: p.code, name: p.name, currentStock: p.lastBalance + p.currentInbound - p.currentOutbound, expiryDate: p.expiryDate })),
      finishedGoods: fg.map((f) => ({ code: f.code, name: f.name, availableStock: f.availableStock })),
    });
  }

  if (type === "ledger") {
    const [raw, pkg, fg] = await Promise.all([
      prisma.stockRawMaterial.findMany({ orderBy: { code: "asc" } }),
      prisma.stockPackaging.findMany({ orderBy: { code: "asc" } }),
      prisma.stockFinishedGoods.findMany({ orderBy: { code: "asc" } }),
    ]);

    return NextResponse.json({
      type: "ledger",
      rawMaterials: raw.map((r) => ({
        code: r.code, name: r.name,
        lastBalance: r.lastBalance,
        inbound: r.currentPurchase,
        outbound: r.currentConsume,
        current: r.lastBalance + r.currentPurchase - r.currentConsume,
      })),
      packaging: pkg.map((p) => ({
        code: p.code, name: p.name,
        lastBalance: p.lastBalance,
        inbound: p.currentInbound,
        outbound: p.currentOutbound,
        current: p.lastBalance + p.currentInbound - p.currentOutbound,
      })),
      finishedGoods: fg.map((f) => ({
        code: f.code, name: f.name,
        lastBalance: f.lastBalance,
        inbound: f.currentInbound,
        outbound: f.currentOutbound,
        current: f.lastBalance + f.currentInbound - f.currentOutbound,
        available: f.availableStock,
      })),
    });
  }

  return NextResponse.json({ error: "请指定 type=warning 或 ledger" }, { status: 400 });
});
