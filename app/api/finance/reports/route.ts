import { NextResponse } from "next/server";
import { withFinanceAccess } from "@/lib/with-auth";
import { prisma } from "@/lib/prisma";

/** 报表生成：资产负债表 / 利润表 / 现金流量表 */
export const GET = withFinanceAccess(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const periodId = searchParams.get("periodId");
  const reportType = searchParams.get("type") as "balance" | "income" | "cashflow" | null;
  if (!periodId) return NextResponse.json({ error: "periodId 为必填" }, { status: 400 });
  if (!reportType) return NextResponse.json({ error: "type 为必填（balance/income/cashflow）" }, { status: 400 });

  const period = await prisma.financePeriod.findUnique({ where: { id: parseInt(periodId) } });
  if (!period) return NextResponse.json({ error: "期间不存在" }, { status: 404 });

  const balances = await prisma.financeAccountBalance.findMany({
    where: { periodId: parseInt(periodId) },
    include: { account: true },
    orderBy: { account: { code: "asc" } },
  });

  if (reportType === "balance") {
    // 资产负债表：资产 = 负债 + 权益
    const assets = balances.filter((b) => b.account.category === "asset");
    const liabilities = balances.filter((b) => b.account.category === "liability");
    const equity = balances.filter((b) => b.account.category === "equity");

    const totalAssets = assets.reduce((s, b) => s + b.closingDebit - b.closingCredit, 0);
    const totalLiabilities = liabilities.reduce((s, b) => s + b.closingCredit - b.closingDebit, 0);
    const totalEquity = equity.reduce((s, b) => s + b.closingCredit - b.closingDebit, 0);

    return NextResponse.json({
      type: "balance",
      period,
      assets: assets.map((b) => ({ code: b.account.code, name: b.account.name, amount: +(b.closingDebit - b.closingCredit).toFixed(2) })),
      liabilities: liabilities.map((b) => ({ code: b.account.code, name: b.account.name, amount: +(b.closingCredit - b.closingDebit).toFixed(2) })),
      equity: equity.map((b) => ({ code: b.account.code, name: b.account.name, amount: +(b.closingCredit - b.closingDebit).toFixed(2) })),
      totalAssets: +totalAssets.toFixed(2),
      totalLiabilities: +totalLiabilities.toFixed(2),
      totalEquity: +totalEquity.toFixed(2),
      totalLiabilitiesAndEquity: +(totalLiabilities + totalEquity).toFixed(2),
    });
  }

  if (reportType === "income") {
    // 利润表：收入 - 成本 - 费用 = 利润
    const revenue = balances.filter((b) => b.account.category === "revenue");
    const cost = balances.filter((b) => b.account.category === "cost");

    const totalRevenue = revenue.reduce((s, b) => s + b.currentCredit - b.currentDebit, 0);
    const totalCost = cost.reduce((s, b) => s + b.currentDebit - b.currentCredit, 0);

    return NextResponse.json({
      type: "income",
      period,
      revenue: revenue.map((b) => ({ code: b.account.code, name: b.account.name, amount: +(b.currentCredit - b.currentDebit).toFixed(2) })),
      cost: cost.map((b) => ({ code: b.account.code, name: b.account.name, amount: +(b.currentDebit - b.currentCredit).toFixed(2) })),
      totalRevenue: +totalRevenue.toFixed(2),
      totalCost: +totalCost.toFixed(2),
      grossProfit: +(totalRevenue - totalCost).toFixed(2),
    });
  }

  if (reportType === "cashflow") {
    // 现金流量表：简化版，按 cash/bank 科目汇总
    const cashAccounts = balances.filter((b) =>
      b.account.code.startsWith("1001") || b.account.code.startsWith("1002")
    );
    const netCash = cashAccounts.reduce((s, b) => s + b.closingDebit - b.closingCredit, 0);
    return NextResponse.json({
      type: "cashflow",
      period,
      cashAccounts: cashAccounts.map((b) => ({ code: b.account.code, name: b.account.name, opening: +(b.openingDebit - b.openingCredit).toFixed(2), closing: +(b.closingDebit - b.closingCredit).toFixed(2) })),
      netChange: +netCash.toFixed(2),
    });
  }

  return NextResponse.json({ error: "未知报表类型" }, { status: 400 });
});
