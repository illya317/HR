import { handleUpdateField, handleDelete } from "@/lib/crud-inventory";

const FIELDS = ["code", "name", "spec", "unit", "packagingType", "status", "lastBalance", "currentInbound", "currentOutbound", "batchNo", "expiryDate", "remark"];
const CONFIG = { entityType: "StockPackaging", modelKey: "stockPackaging" as const, allowedFields: FIELDS };

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleUpdateField(request, params, CONFIG);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleDelete(request, params, CONFIG);
}
