import { handleUpdateField, handleDelete } from "@/lib/crud";

const CONFIG = { entityType: "CompanyRelation", modelKey: "companyRelation" as const, allowedFields: ["parentId","childId","shareRatio","isConsolidated"] };

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleUpdateField(request, params, CONFIG);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleDelete(request, params, CONFIG);
}
