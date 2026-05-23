import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPharma } from "@/lib/company";
import { getInitials } from "@/lib/search";

export async function GET(request: Request) {
  const payload = await authenticate(request);
  if (!payload) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const group = searchParams.get("group");
  const search = searchParams.get("search") || "";

  // 查询单个详情
  if (code) {
    const desc = await prisma.positionDescription.findUnique({
      where: { code },
    });

    if (!desc) {
      return NextResponse.json({ error: "未找到" }, { status: 404 });
    }

    let details = null;
    if (desc.details) {
      try {
        details = JSON.parse(desc.details);
      } catch {
        details = null;
      }
    }

    return NextResponse.json({
      positionDescription: {
        id: desc.id,
        code: desc.code,
        name: desc.name,
        departmentName: desc.departmentName,
        reportTo: desc.reportTo,
        positionPurpose: desc.positionPurpose,
        summary: desc.summary,
        headcount: desc.headcount,
        version: desc.version,
        effectiveDate: desc.effectiveDate,
        sourceFile: desc.sourceFile,
        managementGroup: isPharma(desc.code) ? "GMP" : "常规体系",
        details,
      },
    });
  }

  // 查询列表
  const where: any = {};

  if (group) {
    // group-based filtering removed with ManagementGroup table; no-op for now
  }

  const descriptions = await prisma.positionDescription.findMany({
    where,
    select: {
      id: true,
      code: true,
      name: true,
      departmentName: true,
      reportTo: true,
      positionPurpose: true,
      version: true,
      effectiveDate: true,
    },
    orderBy: { code: "asc" },
  });

  let result = descriptions;
  if (search) {
    const q = search.toLowerCase();
    result = descriptions.filter((d) => {
      if (d.code.toLowerCase().includes(q)) return true;
      if (d.name.toLowerCase().includes(q)) return true;
      if ((d.departmentName || "").toLowerCase().includes(q)) return true;
      if (getInitials(d.name).includes(q)) return true;
      return false;
    });
  }

  return NextResponse.json({
    positionDescriptions: result,
    total: result.length,
  });
}
