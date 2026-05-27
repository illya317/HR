import { NextResponse } from "next/server";
import { withFinanceAccess } from "@/lib/with-auth";
import { prisma } from "@/lib/prisma";

export const GET = withFinanceAccess(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const periodId = searchParams.get("periodId");
  const status = searchParams.get("status");
  const where: any = {};
  if (periodId) where.periodId = parseInt(periodId);
  if (status) where.status = status;

  const vouchers = await prisma.financeVoucher.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      items: { include: { account: true }, orderBy: { sortOrder: "asc" } },
      period: true,
    },
  });
  return NextResponse.json({ vouchers });
});

export const POST = withFinanceAccess(async (request: Request, user) => {
  const body = await request.json();
  const { voucherNo, date, description, companyCode, items, status } = body;
  if (!voucherNo || !date || !items?.length) {
    return NextResponse.json(
      { error: "凭证号、日期、分录为必填" },
      { status: 400 },
    );
  }

  const totalDebit = items.reduce(
    (s: number, i: any) => s + (parseFloat(i.debit) || 0),
    0,
  );
  const totalCredit = items.reduce(
    (s: number, i: any) => s + (parseFloat(i.credit) || 0),
    0,
  );
  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    return NextResponse.json({ error: "借贷不平衡" }, { status: 400 });
  }

  // 根据日期自动推断期间
  const dateObj = new Date(date);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  const period = await prisma.financePeriod.findFirst({
    where: { year, month, companyCode: companyCode || null },
  });
  if (!period) {
    return NextResponse.json(
      {
        error: `未找到 ${year}年${month}月 的会计期间，请先创建期间`,
        periodNeeded: { year, month },
      },
      { status: 400 },
    );
  }

  const existing = await prisma.financeVoucher.findUnique({
    where: { voucherNo },
  });
  if (existing)
    return NextResponse.json({ error: "凭证号已存在" }, { status: 400 });

  const voucher = await prisma.financeVoucher.create({
    data: {
      voucherNo,
      date,
      periodId: period.id,
      description: description || "",
      totalDebit,
      totalCredit,
      status: status || "draft",
      companyCode: companyCode || null,
      editedBy: user.userId,
      items: {
        create: items.map((item: any, idx: number) => ({
          accountId: parseInt(item.accountId),
          debit: parseFloat(item.debit) || 0,
          credit: parseFloat(item.credit) || 0,
          description: item.description || "",
          sortOrder: idx,
        })),
      },
    },
    include: { items: { include: { account: true } }, period: true },
  });

  return NextResponse.json({ success: true, voucher });
});
