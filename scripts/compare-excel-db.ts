import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

async function compare() {
  // 1. 读取 Excel
  const wb = XLSX.readFile("/Users/koito/Desktop/Project/HR/data/合并花名册.xlsx");
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
  const headers = rows[0];
  const nameIdx = headers.indexOf("姓名");
  const companyIdx = headers.indexOf("公司");
  const dept1Idx = headers.indexOf("一级部门");
  const posIdx = headers.indexOf("职务岗位");
  const statusIdx = headers.indexOf("状态"); // 可能没有

  const excelMap = new Map<string, { company: string; dept1: string; position: string }[]>();
  for (const row of rows.slice(1)) {
    const name = row[nameIdx];
    if (!name) continue;
    let company = row[companyIdx] || "";
    if (company === "制药") company = "丰华制药";
    if (company === "江苏制药") company = "丰华制药";
    const list = excelMap.get(name) || [];
    list.push({ company, dept1: row[dept1Idx] || "", position: row[posIdx] || "" });
    excelMap.set(name, list);
  }

  // 2. 读取数据库
  const dbEmps = await prisma.employee.findMany({
    include: { positions: { include: { department: true, position: true } } },
  });

  const dbMap = new Map<string, { company: string; dept1: string; position: string }[]>();
  for (const emp of dbEmps) {
    const list: { company: string; dept1: string; position: string }[] = [];
    if (emp.positions.length > 0) {
      for (const ep of emp.positions) {
        list.push({
          company: ep.department?.company || emp.company || "",
          dept1: ep.department?.name || emp.dept1 || "",
          position: ep.position?.name || emp.position || "",
        });
      }
    } else {
      list.push({
        company: emp.company || "",
        dept1: emp.dept1 || "",
        position: emp.position || "",
      });
    }
    dbMap.set(emp.name, list);
  }

  // 3. 比较
  let mismatch = 0;
  let missingInDb = 0;
  let missingInExcel = 0;

  console.log("=== Excel 有但数据库缺失 ===");
  for (const [name, excelList] of excelMap) {
    const dbList = dbMap.get(name);
    if (!dbList) {
      missingInDb++;
      console.log(`  ${name} (Excel ${excelList.length} 个岗位)`);
    }
  }

  console.log("\n=== 数据库有但 Excel 缺失 ===");
  for (const [name, dbList] of dbMap) {
    if (!excelMap.has(name)) {
      missingInExcel++;
      console.log(`  ${name}`);
    }
  }

  console.log("\n=== 公司/部门/岗位不一致 ===");
  for (const [name, excelList] of excelMap) {
    const dbList = dbMap.get(name);
    if (!dbList) continue;

    // 简单比较：把列表排序后比较
    const sortKey = (x: any) => `${x.company}#${x.dept1}#${x.position}`;
    const eSorted = [...excelList].map(sortKey).sort();
    const dSorted = [...dbList].map(sortKey).sort();

    if (JSON.stringify(eSorted) !== JSON.stringify(dSorted)) {
      mismatch++;
      console.log(`\n  ${name}:`);
      console.log(`    Excel: ${eSorted.join(" | ")}`);
      console.log(`    DB:    ${dSorted.join(" | ")}`);
    }
  }

  console.log(`\n=== 统计 ===`);
  console.log(`Excel 总人数(含多岗): ${rows.length - 1}`);
  console.log(`Excel 唯一人数: ${excelMap.size}`);
  console.log(`数据库 Employee: ${dbEmps.length}`);
  console.log(`数据库 EmployeePosition: ${await prisma.employeePosition.count()}`);
  console.log(`Excel 有但 DB 缺失: ${missingInDb}`);
  console.log(`DB 有但 Excel 缺失: ${missingInExcel}`);
  console.log(`数据不一致: ${mismatch}`);
}

compare()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
