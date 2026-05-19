import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const positions = await prisma.position.findMany({
    include: {
      department: { select: { name: true } },
    },
    orderBy: [{ managementGroup: { name: "asc" } }, { department: { name: "asc" } }, { code: "asc" }],
  });
  return NextResponse.json({ positions });
}
