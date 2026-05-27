import { handleUpdateField, handleDelete } from "@/lib/crud-inventory";

const FIELDS = ["code", "name", "spec", "unit", "manufacturer", "status", "lastBalance", "currentPurchase", "currentConsume", "remark"];
const CONFIG = { entityType: "StockRawMaterial", modelKey: "stockRawMaterial" as const, allowedFields: FIELDS };

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleUpdateField(request, params, CONFIG);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleDelete(request, params, CONFIG);
}
