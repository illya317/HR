import { handleUpdateField, handleDelete } from "@/lib/crud";
import { prisma } from "@/lib/prisma";

const FIELDS = ["departmentId","positionId","isPrimary","startDate","endDate","personnelType","rank","title","reportTo","reportTo2","workPercent","isResearch"];

async function onBeforeUpdate(field: string, value: unknown) {
  // 兼容旧字段名
  if (field === "dept1") {
    const name = String(value || "");
    const dept = name ? await prisma.department.findFirst({ where: { name } }) : null;
    if (name && !dept) return null;
    return { field: "departmentId", value: dept?.id ?? null };
  }
  if (field === "position") {
    const name = String(value || "");
    const pos = name ? await prisma.position.findFirst({ where: { name } }) : null;
    if (name && !pos) return null;
    return { field: "positionId", value: pos?.id ?? null };
  }
  // FK by name
  if (field === "departmentId" && typeof value === "string") {
    const dept = await prisma.department.findFirst({ where: { name: value } });
    return { field, value: dept?.id ?? null };
  }
  if (field === "positionId" && typeof value === "string") {
    const pos = await prisma.position.findFirst({ where: { name: value } });
    return { field, value: pos?.id ?? null };
  }
  return { field, value };
}

const CONFIG = { entityType: "EDP", modelKey: "eDP" as const, allowedFields: FIELDS, onBeforeUpdate };

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleUpdateField(request, params, CONFIG);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleDelete(request, params, CONFIG);
}
