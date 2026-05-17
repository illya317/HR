import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate, requireGroupAccess, requireGroupSubmit } from "@/lib/auth";
import { getCurrentWeekInfo } from "@/lib/week";

export async function GET(request: Request) {
  const payload = await authenticate(request);
  if (!payload) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const reportGroupId = searchParams.get("reportGroupId")
    ? parseInt(searchParams.get("reportGroupId")!)
    : null;
  const reportGroupIds = searchParams.get("reportGroupIds");

  // 权限校验：按单个 reportGroupId 查询时验证权限
  if (reportGroupId) {
    const { error, status } = await requireGroupAccess(request, reportGroupId);
    if (error) return NextResponse.json({ error }, { status });
  }

  let where: any = {};

  if (reportGroupIds) {
    // 按多个 reportGroupId 查询（History 用）
    where.reportGroupId = { in: reportGroupIds.split(",").map(Number) };
  } else if (reportGroupId) {
    // 按单个 reportGroupId 查询（Dashboard 用）
    where.reportGroupId = reportGroupId;
  }

  if (date) where.date = date;

  const reports = await prisma.report.findMany({
    where,
    include: {
      items: {
        orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
      },
      user: {
        select: { name: true },
      },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ reports });
}

export async function POST(request: Request) {
  const payload = await authenticate(request);
  if (!payload) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await request.json();

  // 权限校验：提交周报时验证是否有权限
  if (body.reportGroupId) {
    const { error, status } = await requireGroupSubmit(request, body.reportGroupId);
    if (error) return NextResponse.json({ error }, { status });
  }
  const {
    taskName,
    notes,
    items,
    date,
    reportGroupId,
  } = body as {
    taskName: string;
    notes?: string;
    items: Array<{
      category: string;
      plan: string;
      completion?: string;
      nextGoal?: string;
      sortOrder?: number;
      workId?: number;
    }>;
    date?: string;
    reportGroupId?: number;
  };

  if (!items || items.length === 0) {
    return NextResponse.json(
      { error: "请填写至少一条工作项" },
      { status: 400 }
    );
  }

  const reportDate = date ?? getCurrentWeekInfo().weekStart.toISOString().slice(0, 10);

  // 如果有 reportGroupId，查出名称作为 taskName
  let finalTaskName = taskName;
  let finalReportGroupId = reportGroupId ?? null;
  if (finalReportGroupId && !finalTaskName) {
    const group = await prisma.reportGroup.findUnique({
      where: { id: finalReportGroupId },
    });
    if (group) finalTaskName = group.name;
  }

  if (!finalTaskName) {
    return NextResponse.json(
      { error: "请填写任务名称" },
      { status: 400 }
    );
  }

  let allItems = [...items];

  const hasRoutine = items.some((i) => i.category === "routine");
  if (!hasRoutine) {
    const works = await prisma.workItem.findMany({
      where: { targetType: "department", targetId: payload.departmentId, category: "routine" },
      orderBy: { sortOrder: "asc" },
    });
    if (works.length > 0) {
      const routineItems = works.map((w, idx) => ({
        category: "routine",
        plan: w.content,
        completion: "",
        nextGoal: "",
        sortOrder: idx,
        workId: w.id,
      }));
      allItems = [...routineItems, ...items];
    }
  }

  try {
    const report = await prisma.report.create({
      data: {
        userId: payload.userId,
        date: reportDate,
        reportGroupId: finalReportGroupId,
        taskName: finalTaskName,
        notes: notes || null,
        version: 1,
        items: {
          create: allItems.map((item, index) => ({
            category: item.category,
            workItemId: item.workId ?? null,
            plan: item.plan,
            completion: item.completion || null,
            nextGoal: item.nextGoal || null,
            sortOrder: item.sortOrder ?? index,
          })),
        },
      },
      include: {
        items: {
          orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
        },
        user: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({ report });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "本周已提交过周报，请使用更新功能" },
        { status: 409 }
      );
    }
    throw error;
  }
}
