// @deprecated 兼容入口，新代码请使用 /api/hr/employees/search。本文件纯代理，不再新增业务逻辑。
export async function GET(request: Request) {
  const url = new URL(request.url);
  const target = new URL("/api/hr/employees/search", url.origin);
  target.search = url.search;
  return fetch(target, { headers: request.headers });
}
