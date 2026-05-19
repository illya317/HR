import { NextResponse } from "next/server";
import { authenticate, checkHRAccess, checkPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { matchEmployee } from "@/lib/search";
import { FENGHUA_BIO_GROUP, resolveCompanyFilter } from "@/lib/company";

// 字段列表（顺序）
const FIELDS = [
  { key: "employeeId", label: "ID" },
  { key: "name", label: "姓名" },
  { key: "alias", label: "别名" },
  { key: "company", label: "公司" },
  { key: "center", label: "中心" },
  { key: "dept1", label: "一级部门" },
  { key: "dept2", label: "二级部门" },
  { key: "position", label: "行政职务" },
  { key: "gmpDept", label: "GMP部门" },
  { key: "gmpPosition", label: "GMP岗位" },
  { key: "gender", label: "性别" },
  { key: "ethnicity", label: "民族" },
  { key: "hometown", label: "籍贯" },
  { key: "politics", label: "政治面貌" },
  { key: "education", label: "学历" },
  { key: "title", label: "职称" },
  { key: "school", label: "毕业院校" },
  { key: "major", label: "专业" },
  { key: "phone", label: "电话" },
  { key: "joinDate", label: "进司时间" },
  { key: "nature", label: "性质" },
];

// 字段权限暂未启用，所有 canAccessHR 用户均可查看全部字段
async function getVisibleFields(_userId: number, isAdmin: boolean): Promise<string[]> {
  return FIELDS.map((f) => f.key);
}

export async function GET(request: Request) {
  const payload = await authenticate(request);
  if (!payload) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  if (!(await checkHRAccess(payload.userId))) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const company = searchParams.get("company") || "";
  const dept = searchParams.get("dept") || "";
  const keyword = searchParams.get("keyword") || "";
  const exportExcel = searchParams.get("export") === "1";
  const isAdmin = await checkPermission(payload.userId, "system", "admin");

  // 在职/离职筛选（默认只看在职）
  const statusFilter = searchParams.get("status") || "在职";
  const employeeWhere: any = {};
  if (statusFilter === "在职") {
    employeeWhere.status = "在职";
    employeeWhere.deleted = false;
  } else if (statusFilter === "离职") {
    employeeWhere.status = "离职";
  }

  // 1. 获取基础员工列表
  let baseEmployees = await prisma.employee.findMany({
    where: employeeWhere,
    orderBy: [{ employeeId: "asc" }],
  });

  // 关键词支持拼音首字母搜索
  if (keyword) {
    baseEmployees = baseEmployees.filter((e) => matchEmployee(e, keyword));
  }

  const employeeIds = baseEmployees.map((e) => e.id);
  const empMap = new Map(baseEmployees.map((e) => [e.id, e]));

  // 2. 查询 EmployeeDepartmentPosition（带部门和岗位筛选）
  const epWhere: any = { employeeId: { in: employeeIds } };
  if (dept) {
    epWhere.department = { name: { contains: dept } };
  }

  // 公司筛选：通过 Department.managementGroup
  const targetCompany = company || "";
  if (targetCompany) {
    const mgmtNames = resolveCompanyFilter(targetCompany);
    if (!epWhere.department) epWhere.department = {};
    epWhere.department.managementGroup = { name: { in: mgmtNames } };
  }

  const eps = await prisma.employeeDepartmentPosition.findMany({
    where: epWhere,
    include: { department: { include: { managementGroup: true } }, position: true },
    orderBy: [{ employeeId: "asc" }, { sortOrder: "asc" }],
  });

  // 3. 常规体系 + GMP 合并为一行
  const epByEmp = new Map<number, any[]>();
  for (const ep of eps) {
    if (!epByEmp.has(ep.employeeId)) epByEmp.set(ep.employeeId, []);
    epByEmp.get(ep.employeeId)!.push(ep);
  }

  const rows: any[] = [];
  for (const emp of baseEmployees) {
    const epsForEmp = epByEmp.get(emp.id) || [];
    const defEP = epsForEmp.find((e: any) => e.system !== "GMP") || epsForEmp[0];
    const gmpEP = epsForEmp.find((e: any) => e.system === "GMP");
    const mgmt = defEP?.department?.managementGroup?.name;
    rows.push({
      id: emp.id, employeeId: emp.employeeId, name: emp.name, alias: emp.alias,
      company: mgmt === "GMP" ? "丰华制药" : mgmt === "常规体系" ? "丰华生物" : "",
      center: defEP?.center ?? "",
      dept1: defEP?.department?.name ?? "",
      dept2: "",
      position: defEP?.position?.name ?? "",
      gmpDept: gmpEP?.department?.name ?? "",
      gmpPosition: gmpEP?.position?.name ?? "",
      gender: emp.gender, ethnicity: emp.ethnicity, hometown: emp.hometown,
      politics: emp.politics, education: emp.education, title: emp.title,
      school: emp.school, major: emp.major, phone: emp.phone,
      joinDate: emp.joinDate, nature: emp.nature, status: emp.status,
      leaveDate: emp.leaveDate, deleted: emp.deleted, deletedTime: emp.deletedTime,
      deletedBy: emp.deletedBy, userId: emp.userId,
      employeeDepartmentPositionId: defEP?.id ?? null,
    });
  }

  rows.sort((a, b) => a.employeeId.localeCompare(b.employeeId));

  const visibleFields = await getVisibleFields(payload.userId, isAdmin);

  if (exportExcel) {
    const exportData = rows.map((emp) => {
      const row: Record<string, any> = {};
      for (const f of FIELDS) {
        if (visibleFields.includes(f.key)) {
          row[f.label] = (emp as any)[f.key] || "";
        }
      }
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "花名册");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="roster_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  }

  // 所有公司和部门（不随筛选变化，用于下拉框）
  const deptWhere: any = {};
  const allCompaniesRaw = await prisma.department.findMany({ where: deptWhere, select: { managementGroup: { select: { name: true } } }, distinct: ["managementGroupId"] });
  const allCompanies = allCompaniesRaw.map((d: any) => d.managementGroup?.name === "GMP" ? "丰华制药" : "丰华生物").filter(Boolean);
  const allDepts = [...new Set((await prisma.department.findMany({ where: deptWhere, select: { name: true } })).map((d: any) => d.name).filter(Boolean))];

  return NextResponse.json({ employees: rows, fields: FIELDS, visibleFields, allCompanies, allDepts });
}
