// @deprecated 兼容入口，新代码请使用 /api/hr/edps/[id] 替代。此文件不再新增业务逻辑。
import { createProxyHandler } from "@/lib/proxy-route";

export const PUT = createProxyHandler("/api/hr/edps");
export const DELETE = createProxyHandler("/api/hr/edps");
