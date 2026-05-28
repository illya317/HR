// @deprecated 兼容入口，新代码请使用 /api/hr/positions。本文件纯代理，不再新增业务逻辑。
async function proxy(request: Request) {
  const url = new URL(request.url);
  const target = new URL("/api/hr/positions", url.origin);
  target.search = url.search;
  if (!url.searchParams.has("pageSize")) {
    target.searchParams.set("pageSize", "99999");
  }
  const body = ["POST", "PUT", "PATCH"].includes(request.method)
    ? await request.text()
    : undefined;
  return fetch(target, {
    method: request.method,
    headers: request.headers,
    body,
  });
}

export async function GET(request: Request) {
  return proxy(request);
}

export async function POST(request: Request) {
  return proxy(request);
}

export async function PUT(request: Request) {
  return proxy(request);
}

export async function DELETE(request: Request) {
  return proxy(request);
}
