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
