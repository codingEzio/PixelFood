import { pngDimensions } from "../src/preview_receipt.ts";
import { selectedOutputs } from "../src/selected_catalog.ts";
const result = await selectedOutputs();
if (
  result.catalog !== await Deno.readTextFile("catalog.json") ||
  result.overview !== await Deno.readTextFile("previews/overview.svg")
) throw Error("Generated files are stale; run deno task build");
console.log(
  "Verified every asset hash, catalog membership, translations, and deterministic output",
);

const previewReceipt = JSON.parse(
  await Deno.readTextFile("previews/receipt.json"),
);
for (
  const [path, expectedHash] of [[
    "previews/overview.svg",
    previewReceipt.svgSha256,
  ], ["previews/overview.png", previewReceipt.pngSha256]]
) {
  const bytes = await Deno.readFile(path);
  const hash = Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new Uint8Array(bytes).buffer),
    ),
    (n) => n.toString(16).padStart(2, "0"),
  ).join("");
  if (hash !== expectedHash) {
    throw Error(
      `Stale static preview: ${path}; review and reseal the selected package`,
    );
  }
}
console.log("Static PNG and SVG receipt verified");

const dimensions = pngDimensions(await Deno.readFile("previews/overview.png"));
const svgWidth = Number(result.overview.match(/width="(\d+)"/)?.[1]);
const svgHeight = Number(result.overview.match(/height="(\d+)"/)?.[1]);
if (
  (previewReceipt.width !== undefined &&
    dimensions.width !== previewReceipt.width) ||
  (previewReceipt.height !== undefined &&
    dimensions.height !== previewReceipt.height) ||
  dimensions.width !== svgWidth || dimensions.height !== svgHeight
) {
  throw Error("Static preview dimensions differ from receipt or SVG");
}
