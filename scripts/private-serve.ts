import { privateOutputs } from "../src/private_catalog.ts";
import { previewHandler } from "../src/preview_server.ts";

const [root, portArg = "18221"] = Deno.args;
const port = Number(portArg);
if (
  !root || Deno.args.length > 2 || !Number.isInteger(port) || port < 1024 ||
  port > 65535
) {
  throw Error("Usage: deno task private:demo /absolute/private/data [port]");
}
if (!root.startsWith("/")) throw Error("Private data path must be absolute");
const resolved = await Deno.realPath(root);
const repository = await Deno.realPath(".");
if (resolved === repository || resolved.startsWith(`${repository}/`)) {
  throw Error("Private data must be outside the repository");
}
const { html } = await privateOutputs(resolved, true);
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
