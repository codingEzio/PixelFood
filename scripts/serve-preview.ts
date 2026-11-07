import { selectedOutputs } from "../src/selected_catalog.ts";
import { previewHandler } from "../src/preview_server.ts";
const port = Number(Deno.args[0] ?? "18220");
if (
  Deno.args.length > 1 || !Number.isInteger(port) || port < 1024 || port > 65535
) {
  throw Error("Usage: deno task preview:serve [port 1024..65535]");
}
const { html } = await selectedOutputs(true);
const controller = new AbortController();
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  Deno.addSignalListener(signal, () => controller.abort());
}
const server = Deno.serve({
  hostname: "127.0.0.1",
  port,
  signal: controller.signal,
}, previewHandler(html));
await server.finished;
