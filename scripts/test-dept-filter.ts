import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 测试部门包含筛选
  const emps = await prisma.employee.findMany({
    where: {
      status: "在职",
      deleted: false,
      dept1: { contains: "行政" },
    },
    select: { name: true, dept1: true },
  });
  console.log("dept1 contains '行政':", emps.length);
  emps.forEach((e) => console.log(`  ${e.name} | ${e.dept1}`));

  console.log("---");

  // 测试部门包含筛选 "项目管理"
  const emps2 = await prisma.employee.findMany({
    where: {
      status: "在职",
      deleted: false,
      dept1: { contains: "项目管理" },
    },
    select: { name: true, dept1: true },
  });
  console.log("dept1 contains '项目管理':", emps2.length);
  emps2.forEach((e) => console.log(`  ${e.name} | ${e.dept1}`));

  await prisma.$disconnect();
}

main();
