import { handleUpdateField, handleDelete } from "@/lib/crud-inventory";

const FIELDS = ["code", "name", "packagingSpec", "unit", "stockType", "lastBalance", "currentInbound", "currentOutbound", "availableStock", "remark"];
const CONFIG = { entityType: "StockFinishedGoods", modelKey: "stockFinishedGoods" as const, allowedFields: FIELDS };

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleUpdateField(request, params, CONFIG);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleDelete(request, params, CONFIG);
}
