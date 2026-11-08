/** Serve only the generated helper, never paths from the private repository. */
export function previewHandler(html: string): (request: Request) => Response {
  return (request) => {
    if (!["GET", "HEAD"].includes(request.method)) {
      return new Response("Method not allowed", { status: 405 });
    }
    if (new URL(request.url).pathname !== "/") {
      return new Response("Not found", { status: 404 });
    }
    return new Response(request.method === "HEAD" ? null : html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  };
}

/** Restrict the private gallery to the actual loopback host and listening port. */
export function privatePreviewHandler(
  html: string,
  port: number,
): (request: Request) => Response {
  const handler = previewHandler(html);
  const hosts = new Set([`localhost:${port}`, `127.0.0.1:${port}`]);
  return (request) => {
    const host = request.headers.get("host");
    if (!host || !hosts.has(host.toLowerCase())) {
      return new Response("Invalid host", {
        status: 403,
        headers: { "cache-control": "no-store" },
      });
    }
    return handler(request);
  };
}
