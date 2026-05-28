import type { TabConfig, FieldConfig } from "../types";
import { extractFK, fk } from "./shared";

const projectFields: FieldConfig[] = [
  { key: "name", label: "项目名称", editable: true, required: true },
  { key: "type", label: "类型", editable: true },
  { key: "description", label: "说明", editable: true, type: "textarea" },
  { key: "endDate", label: "截止时间", editable: true, type: "date" },
];

export const projectConfig: TabConfig = {
  title: "项目",
  apiPath: "/api/hr/projects",
  entityType: "Project",
  fields: projectFields,
  canCreate: true,
  canDelete: true,
  listGetter: (d: unknown) => (d as Record<string, unknown>).projects as unknown[],
};

const employeeProjectFields: FieldConfig[] = [
  { key: "employeeId", label: "员工", type: "fk", editable: true, required: true },
  { key: "projectId", label: "项目", type: "fk", editable: true, required: true },
  { key: "role", label: "角色", editable: true },
  { key: "startDate", label: "开始日期", editable: true, type: "date" },
  { key: "endDate", label: "结束日期", editable: true, type: "date" },
];

export const employeeProjectConfig: TabConfig = {
  title: "项目员工",
  apiPath: "/api/hr/employee-projects",
  entityType: "EmployeeProject",
  fields: employeeProjectFields,
  fkFields: {
    employeeId: fk("employee", "employeeName"),
    projectId: fk("project", "projectName"),
  },
  canCreate: true,
  canDelete: true,
  listGetter: (d: unknown) => (d as Record<string, unknown>).entries as unknown[],
  buildCreateBody: (form) => {
    const out = extractFK(form, ["projectId"]);
    const emp = form.employeeId as Record<string, unknown>;
    if (emp && typeof emp === "object" && "subtitle" in emp) {
      out.employeeId = emp.subtitle;
    } else if (emp && typeof emp === "object" && "name" in emp) {
      out.employeeId = emp.name;
    }
    return out;
  },
};
