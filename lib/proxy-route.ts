export function createProxyHandler(targetPathPrefix: string) {
  return async function handler(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { id } = await params;
    const url = new URL(`${targetPathPrefix}/${id}`, request.url);

    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("content-length");

    const res = await fetch(url, {
      method: request.method,
      headers,
      body: request.body,
      // @ts-expect-error duplex is needed for Node.js stream forwarding
      duplex: "half",
      redirect: "manual",
    });

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    });
  };
}
