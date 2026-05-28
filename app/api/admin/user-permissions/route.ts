import { NextResponse } from "next/server";
import { authenticate, checkPermission } from "@/lib/auth";
import { setGrant } from "@/server/rbac/grants";

export async function PUT(request: Request) {
  const payload = await authenticate(request);
  if (!payload) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  if (!(await checkPermission(payload.userId, "system", "admin"))) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, resourceKey, roleKey, value } = body;

  if (!userId || !resourceKey || !roleKey || typeof value !== "boolean") {
    return NextResponse.json(
      { error: "参数错误: 需要 userId, resourceKey, roleKey, value" },
      { status: 400 }
    );
  }

  try {
    await setGrant("user", userId, resourceKey, roleKey, value, {
      actorUserId: payload.userId,
    });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "操作失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
