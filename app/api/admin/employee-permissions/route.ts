import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getEmployeesWithPermissions, syncUserGrants } from "@/server/services/employee-permissions";

export async function GET(request: Request) {
  const { error, status } = await requireAdmin(request);
  if (error) return NextResponse.json({ error }, { status });

  const employees = await getEmployeesWithPermissions();
  return NextResponse.json({ employees });
}

export async function PUT(request: Request) {
  const { error, status } = await requireAdmin(request);
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { employeeId, name, grants } = body as {
    employeeId: string;
    name: string;
    grants?: { resourceKey: string; roleKey: string; value: boolean }[];
  };

  const result = await syncUserGrants(employeeId, name, grants);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status || 400 }
    );
  }

  return NextResponse.json({ success: true });
}
