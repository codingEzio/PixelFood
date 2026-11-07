/** Optional local PNG export; macOS keeps its existing Ego renderer. */
import { sha256 } from "../src/catalog.ts";
import { pngDimensions } from "../src/preview_receipt.ts";
import { selectedOutputs } from "../src/selected_catalog.ts";
const renderer = Deno.args[0] ?? (Deno.build.os === "darwin" ? "ego" : "rsvg");
if (Deno.args.length > 1 || !["ego", "rsvg"].includes(renderer)) {
  throw Error("Usage: deno task preview:png [ego|rsvg]");
}
const root = decodeURIComponent(new URL("../", import.meta.url).pathname)
  .replace(/\/$/, "");
const outputDir = `${root}/Local/preview-export`;
const svg = await Deno.readTextFile(`${root}/previews/overview.svg`);
const selected = await selectedOutputs();
if (svg !== selected.overview) {
  throw Error(
    "Selected overview differs; review and rebuild the selected package first",
  );
}
await Deno.mkdir(outputDir, { recursive: true });
const width = Number(svg.match(/width="(\d+)"/)?.[1]);
const height = Number(svg.match(/height="(\d+)"/)?.[1]);
if (!width || !height) throw Error("Missing static preview dimensions");
if (renderer === "rsvg") {
  const directory = await Deno.makeTempDir({
    dir: outputDir,
    prefix: "delete_after_use_render_",
  });
  const temporary = `${directory}/overview.png`;
  try {
    const version = await new Deno.Command("rsvg-convert", {
      args: ["--version"],
    }).output();
    if (!version.success) throw Error("rsvg-convert --version failed");
    // Some native librsvg builds have no WebP loader. Decode locally to PNG
    // for the renderer only, without changing stored SVG or asset bytes.
    let renderSvg = svg;
    let decoded = 0;
    for (
      const match of svg.matchAll(/data:image\/webp;base64,([A-Za-z0-9+/=]+)/g)
    ) {
      const webp = Uint8Array.from(atob(match[1]), (c) => c.charCodeAt(0));
      const input = `${directory}/input.webp`;
      await Deno.writeFile(input, webp);
      const output = await new Deno.Command("dwebp", {
        args: [input, "-quiet", "-o", "-"],
      }).output();
      if (!output.success) throw Error("WebP preview decode failed");
      pngDimensions(output.stdout);
      // File-backed temporary images keep large catalogs below XML text limits.
      const decodedPath = `${directory}/decoded-${decoded}.png`;
      await Deno.writeFile(decodedPath, output.stdout);
      const decodedUrl = new URL(`file://${decodedPath}`).href;
      renderSvg = renderSvg.replace(match[0], decodedUrl);
      decoded++;
    }
    if (!decoded) throw Error("No embedded food images found");
    const renderInput = `${directory}/overview.svg`;
    await Deno.writeTextFile(renderInput, renderSvg);
    const decoderVersion = await new Deno.Command("dwebp", {
      args: ["-version"],
    }).output();
    if (!decoderVersion.success) throw Error("dwebp version lookup failed");
    const result = await new Deno.Command("rsvg-convert", {
      args: ["--output", temporary, renderInput],
      stdout: "inherit",
      stderr: "inherit",
    }).output();
    if (!result.success) throw Error("librsvg preview export failed");
    const png = await Deno.readFile(temporary);
    const dimensions = pngDimensions(png);
    if (dimensions.width !== width || dimensions.height !== height) {
      throw Error("Rendered PNG dimensions differ from SVG");
    }
    await Deno.rename(temporary, `${outputDir}/overview.png`);
    await Deno.writeTextFile(
      `${outputDir}/receipt.json`,
      JSON.stringify(
        {
          renderer: new TextDecoder().decode(version.stdout).split("\n")[0] +
            " local SVG rasterization",
          decoder: "libwebp dwebp " +
            new TextDecoder().decode(decoderVersion.stdout).trim(),
          decodedImages: decoded,
          svgSha256: await sha256(new TextEncoder().encode(svg)),
          pngSha256: await sha256(png),
          width,
          height,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(
      "Exported local static PNG with librsvg; inspect appearance before use",
    );
  } finally {
    try {
      await Deno.remove(directory, { recursive: true });
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        console.error("Temporary preview cleanup failed", error);
      }
    }
  }
  Deno.exit(0);
}
const code = `
const fs = await import("node:fs/promises");
const crypto = await import("node:crypto");
const root = ${JSON.stringify(root)};
const outputDir = ${JSON.stringify(outputDir)};
const task = await taskSpace("Static library preview");
try {
  const page = task.page("p1");
  await page.cdp("Emulation.setDeviceMetricsOverride", {width:${width},height:${height},deviceScaleFactor:1,mobile:false});
  await page.goto(${
  JSON.stringify(new URL("../previews/overview.svg", import.meta.url).href)
});
  await page.waitForFunction(() => document.readyState === "complete");
  await page.evaluate(async () => {
    await Promise.all([...document.querySelectorAll("image")].map(el => new Promise((resolve, reject) => {
      const image = new Image(); image.onload = resolve; image.onerror = reject; image.src = el.getAttribute("href");
    })));
  });
  await page.screenshot({path:outputDir + "/overview.png"});
  const hash = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
  await fs.writeFile(outputDir + "/receipt.json", JSON.stringify({
    renderer:"Ego Lite Chromium screenshot of overview.svg at 1 CSS pixel per pixel",
    svgSha256:hash(await fs.readFile(root + "/previews/overview.svg")),
    pngSha256:hash(await fs.readFile(outputDir + "/overview.png")),
    width:${width},height:${height}
  }, null, 2) + "\\n");
  console.log("Exported local static preview PNG and receipt");
} finally { await task.finish({keep:[]}); }
`;
const child = new Deno.Command("ego-browser", {
  args: ["nodejs"],
  stdin: "piped",
  stdout: "inherit",
  stderr: "inherit",
}).spawn();
const writer = child.stdin.getWriter();
await writer.write(new TextEncoder().encode(code));
await writer.close();
if (!(await child.status).success) {
  throw Error(
    "Preview export failed; the existing library assets remain available",
  );
}
