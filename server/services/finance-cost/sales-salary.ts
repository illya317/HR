import { prisma } from "@/lib/prisma";
import type { CostQueryParams, PaginatedResult } from "./common";
import { buildPagination, buildYearMonthWhere } from "./common";

export interface SalesSalaryDTO {
  id: number;
  year: number;
  month: number | null;
  salesperson: string;
  baseSalary: number | null;
  bonus: number | null;
  deduction: number | null;
  actualSalary: number | null;
  sourceFile: string;
  sourceSheet: string | null;
  sourceRow: number | null;
}

function toDTO(row: {
  id: number;
  year: number;
  month: number | null;
  salesperson: string;
  baseSalary: number | null;
  bonus: number | null;
  deduction: number | null;
  actualSalary: number | null;
  sourceFile: string;
  sourceSheet: string | null;
  sourceRow: number | null;
}): SalesSalaryDTO {
  return { ...row };
}

export async function listSalesSalaries(
  params: CostQueryParams,
): Promise<PaginatedResult<SalesSalaryDTO>> {
  const where = buildYearMonthWhere(params);
  const { skip, take, page, pageSize } = buildPagination(params);

  const [data, total] = await Promise.all([
    prisma.financeSalesSalary.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }, { salesperson: "asc" }],
      skip,
      take,
    }),
    prisma.financeSalesSalary.count({ where }),
  ]);

  return {
    data: data.map(toDTO),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getSalesSalarySummary(params: CostQueryParams) {
  const where = buildYearMonthWhere(params);

  const rows = await prisma.financeSalesSalary.findMany({
    where,
    select: {
      baseSalary: true,
      bonus: true,
      deduction: true,
      actualSalary: true,
    },
  });

  let totalBase = 0;
  let totalBonus = 0;
  let totalDeduction = 0;
  let totalActual = 0;

  for (const row of rows) {
    totalBase += row.baseSalary ?? 0;
    totalBonus += row.bonus ?? 0;
    totalDeduction += row.deduction ?? 0;
    totalActual += row.actualSalary ?? 0;
  }

  return {
    totalBaseSalary: totalBase,
    totalBonus: totalBonus,
    totalDeduction: totalDeduction,
    totalActualSalary: totalActual,
  };
}
