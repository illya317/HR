import { handleUpdateField, handleDelete } from "@/lib/crud";

const CONFIG = { entityType: "Project", modelKey: "project" as const, allowedFields: ["name","type","description","endDate"] };

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleUpdateField(request, params, CONFIG);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleDelete(request, params, CONFIG);
}
