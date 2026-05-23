import { NextResponse } from "next/server";
import { authenticate, checkHRAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { matchEmployee } from "@/lib/search";
import { matchAnyField } from "@/lib/search-schema";
import { snapshotHistory } from "@/lib/history";

export async function GET(request: Request) {
  const payload = await authenticate(request);
  if (!payload) return NextResponse.json({ error: "未登录" }, { status: 401 });
  if (!(await checkHRAccess(payload.userId))) return NextResponse.json({ error: "无权限" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword") || "";

  let employees = await prisma.employee.findMany({ orderBy: { employeeId: "asc" } });
  if (keyword) employees = employees.filter((e) => matchAnyField(e, keyword, "Employee"));
  return NextResponse.json({ employees });
}

export async function POST(request: Request) {
  const payload = await authenticate(request);
  if (!payload) return NextResponse.json({ error: "未登录" }, { status: 401 });
  if (!(await checkHRAccess(payload.userId))) return NextResponse.json({ error: "无权限" }, { status: 403 });

  const body = await request.json();
  const { employeeId, name } = body;
  if (!employeeId || !name) return NextResponse.json({ error: "员工编号和姓名为必填" }, { status: 400 });

  const existing = await prisma.employee.findUnique({ where: { employeeId } });
  if (existing) return NextResponse.json({ error: "员工编号已存在" }, { status: 400 });

  const created = await prisma.employee.create({ data: { employeeId, name } });
  await snapshotHistory("Employee", created.id, payload.userId);

  return NextResponse.json({ success: true, employee: created });
}
