import { NextResponse } from "next/server";
import { withFinanceAccess } from "@/lib/with-auth";
import { getCostSummary } from "@/server/services/finance-cost";

export async function GET(request: Request) {
  return withFinanceAccess(async (req) => {
    const { searchParams } = new URL(req.url);
    const params = {
      year: searchParams.has("year") ? parseInt(searchParams.get("year")!) : undefined,
      month: searchParams.has("month") ? parseInt(searchParams.get("month")!) : undefined,
      productName: searchParams.get("productName") ?? undefined,
      customerName: searchParams.get("customerName") ?? undefined,
      salesperson: searchParams.get("salesperson") ?? undefined,
      sourceFile: searchParams.get("sourceFile") ?? undefined,
    };

    const summary = await getCostSummary(params);
    return NextResponse.json({ success: true, data: summary });
  })(request);
}
