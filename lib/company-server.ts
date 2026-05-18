// 公司服务端工具（仅 API 路由/脚本可用）
import { prisma } from "@/lib/prisma";

export async function getCompanies() {
  return prisma.company.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getBioGroupNames(): Promise<string[]> {
  const companies = await prisma.company.findMany({
    where: { name: { not: "丰华制药" } },
    select: { name: true },
  });
  return companies.map((c) => c.name);
}
