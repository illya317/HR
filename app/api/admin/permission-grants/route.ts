import { NextResponse } from "next/server";
import { authenticate, checkPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGrants } from "@/server/rbac/grants";
import { getResourceAncestors } from "@/server/rbac/resource";
import type { SubjectType } from "@/server/rbac/grants";

interface SubjectInfo {
  id: number;
  name: string;
  extra?: Record<string, unknown>;
}

async function getUserSubjects(
  companyFilter?: string,
  deptFilter?: string,
  keyword?: string
): Promise<SubjectInfo[]> {
  const activeEmpIds = new Set(
    (await prisma.employment.findMany({
      where: { isActive: true },
      select: { employeeId: true },
    })).map((e) => e.employeeId)
  );

  const employees = await prisma.employee.findMany({
    where: { id: { in: [...activeEmpIds] } },
    orderBy: [{ employeeId: "asc" }],
    include: {
      positions: {
        include: {
          department: { select: { name: true, code: true } },
          position: { select: { name: true } },
        },
      },
    },
  });

  const employeeUsers = await prisma.employee.findMany({
    where: { userId: { not: null } },
    select: { employeeId: true, userId: true },
  });
  const userIdByEmployeeId = new Map(
    employeeUsers.map((e) => [e.employeeId, e.userId!])
  );

  const result: SubjectInfo[] = [];
  for (const emp of employees) {
    const userId = userIdByEmployeeId.get(emp.employeeId);
    const deptName = emp.positions[0]?.department?.name || "";
    const companyName = emp.positions[0]?.department?.code?.startsWith("PPA") || emp.positions[0]?.department?.code?.startsWith("04")
      ? "丰华制药"
      : "丰华生物";

    if (companyFilter && companyFilter !== "全部" && companyName !== companyFilter) continue;
    if (deptFilter && deptFilter !== "全部" && deptName !== deptFilter) continue;
    if (keyword && !emp.name.includes(keyword) && !emp.employeeId.includes(keyword)) continue;

    result.push({
      id: userId ?? 0,
      name: emp.name,
      extra: {
        employeeId: emp.employeeId,
        userId,
        hasUser: !!userId,
        company: companyName,
        department: deptName,
        positionIds: emp.positions.map((p) => p.positionId).filter((id): id is number => id !== null),
        departmentIds: [...new Set(emp.positions.map((p) => p.departmentId).filter((id): id is number => id !== null))],
      },
    });
  }
  return result;
}

async function getPositionSubjects(
  companyFilter?: string,
  deptFilter?: string,
  keyword?: string
): Promise<SubjectInfo[]> {
  const positions = await prisma.position.findMany({
    include: {
      department: { select: { name: true, code: true } },
    },
    orderBy: { code: "asc" },
  });

  const result: SubjectInfo[] = [];
  for (const pos of positions) {
    const dept = pos.department;
    const companyName = dept?.code?.startsWith("PPA") || dept?.code?.startsWith("04")
      ? "丰华制药"
      : "丰华生物";

    if (companyFilter && companyFilter !== "全部" && companyName !== companyFilter) continue;
    if (deptFilter && deptFilter !== "全部" && dept?.name !== deptFilter) continue;
    if (keyword && !pos.name.includes(keyword) && !pos.code.includes(keyword)) continue;

    result.push({
      id: pos.id,
      name: pos.name,
      extra: {
        code: pos.code,
        company: companyName,
        department: dept?.name || "",
      },
    });
  }
  return result;
}

async function getDepartmentSubjects(
  companyFilter?: string,
  keyword?: string
): Promise<SubjectInfo[]> {
  const depts = await prisma.department.findMany({
    orderBy: { code: "asc" },
  });

  const result: SubjectInfo[] = [];
  for (const d of depts) {
    const companyName = d.code?.startsWith("PPA") || d.code?.startsWith("04")
      ? "丰华制药"
      : "丰华生物";

    if (companyFilter && companyFilter !== "全部" && companyName !== companyFilter) continue;
    if (keyword && !d.name.includes(keyword) && !d.code.includes(keyword)) continue;

    result.push({
      id: d.id,
      name: d.name,
      extra: {
        code: d.code,
        company: companyName,
      },
    });
  }
  return result;
}

export async function GET(request: Request) {
  const payload = await authenticate(request);
  if (!payload) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  if (!(await checkPermission(payload.userId, "system", "admin"))) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const subjectType = (searchParams.get("subjectType") || "user") as SubjectType;
  const resourceKey = searchParams.get("resourceKey") || undefined;
  const companyFilter = searchParams.get("company") || undefined;
  const deptFilter = searchParams.get("department") || undefined;
  const keyword = searchParams.get("keyword") || undefined;

  let subjects: SubjectInfo[] = [];
  if (subjectType === "user") {
    subjects = await getUserSubjects(companyFilter, deptFilter, keyword);
  } else if (subjectType === "position") {
    subjects = await getPositionSubjects(companyFilter, deptFilter, keyword);
  } else if (subjectType === "department") {
    subjects = await getDepartmentSubjects(companyFilter, keyword);
  }

  // Load direct grants for this subject type
  const directGrants = await getGrants(subjectType);

  // If a specific resource is selected, also load position/department grants
  // for user subjects so frontend can compute inheritance
  let positionGrants: Awaited<ReturnType<typeof getGrants>> = [];
  let departmentGrants: Awaited<ReturnType<typeof getGrants>> = [];

  if (subjectType === "user") {
    positionGrants = await getGrants("position");
    departmentGrants = await getGrants("department");
  }

  // Build ancestor map for resource inheritance
  let ancestorResourceIds: number[] = [];
  if (resourceKey) {
    const resource = await prisma.resource.findUnique({
      where: { key: resourceKey },
      select: { id: true },
    });
    if (resource) {
      ancestorResourceIds = await getResourceAncestors(resource.id);
    }
  }

  const ancestorResourceKeys = resourceKey
    ? (await prisma.resource.findMany({
        where: { id: { in: ancestorResourceIds } },
        select: { key: true },
      })).map((r) => r.key)
    : [];

  return NextResponse.json({
    subjects,
    directGrants,
    positionGrants,
    departmentGrants,
    ancestorResourceKeys,
  });
}

export async function PUT(request: Request) {
  const payload = await authenticate(request);
  if (!payload) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  if (!(await checkPermission(payload.userId, "system", "admin"))) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await request.json();
  const { subjectType, subjectId, resourceKey, roleKey, value } = body;

  if (!subjectType || !subjectId || !resourceKey || !roleKey || typeof value !== "boolean") {
    return NextResponse.json(
      { error: "参数错误: 需要 subjectType, subjectId, resourceKey, roleKey, value" },
      { status: 400 }
    );
  }

  try {
    const { setGrant } = await import("@/server/rbac/grants");
    await setGrant(subjectType as SubjectType, subjectId, resourceKey, roleKey, value, {
      actorUserId: payload.userId,
    });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "操作失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
