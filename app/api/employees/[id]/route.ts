import { handleUpdateField, handleDelete } from "@/lib/crud";

const FIELDS = ["employeeId","name","alias","gender","birthDate","ethnicity","hometown","politics","education","title","school","major","phone","workStartDate","idNumber","otherId","userId"];

async function onBeforeUpdate(field: string, value: unknown) {
  if (field === "gender") {
    if (value === "男" || value === true) return { field, value: true };
    if (value === "女" || value === false) return { field, value: false };
    return { field, value: null };
  }
  return { field, value };
}

const CONFIG = { entityType: "Employee", modelKey: "employee" as const, allowedFields: FIELDS, onBeforeUpdate };

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleUpdateField(request, params, CONFIG);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleDelete(request, params, CONFIG);
}
