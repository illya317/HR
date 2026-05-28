import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { isKicked } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    if (await isKicked(request)) {
      const res = NextResponse.json(
        { error: "已在其他设备登录" },
        { status: 401 },
      );
      res.cookies.set("kicked", "1", {
        httpOnly: false,
        secure: false,
        path: "/",
        maxAge: 60,
      });
      return res;
    }
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  return NextResponse.json({ user });
}
