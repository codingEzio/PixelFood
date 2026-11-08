import { privateOutputs, sha256 } from "../src/private_catalog.ts";
import { pngDimensions } from "../src/preview_receipt.ts";

const [mode, input, option] = Deno.args;
if (
  !input || !input.startsWith("/") || !["build", "verify"].includes(mode) ||
  Deno.args.length > 3
) {
  throw Error(
    "Usage: private-maintenance build ROOT [ego|rsvg] | verify ROOT BUILD_ID",
  );
}
const root = await Deno.realPath(input);
const repo = await Deno.realPath(".");
if (
  root === "/" || root === repo || root.startsWith(`${repo}/`) ||
  repo.startsWith(`${root}/`)
) {
  throw Error("Private root must be outside the repository");
}
const builds = `${root}/builds`;
const encoder = new TextEncoder();
const fileUrl = (path: string) => {
  const url = new URL("file:///");
  url.pathname = path;
  return url.href;
};
const generated = await privateOutputs(root);
const digest = await sha256(
  encoder.encode(generated.catalog + generated.overview),
);
const ensureDirectory = async (path: string) => {
  try {
    await Deno.mkdir(path);
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) throw error;
  }
  const stat = await Deno.lstat(path);
  if (!stat.isDirectory || stat.isSymlink) {
    throw Error(`Unsafe directory: ${path}`);
  }
};
const check = async (id: string) => {
  if (!/^[a-f0-9]{64}-(ego|rsvg)$/.test(id)) throw Error("Invalid build ID");
  const dir = `${builds}/${id}`;
  for (const path of [builds, dir]) {
    const stat = await Deno.lstat(path);
    if (!stat.isDirectory || stat.isSymlink) {
      throw Error("Unsafe build directory");
    }
  }
  const read = async (name: string) => {
    const path = `${dir}/${name}`;
    const stat = await Deno.lstat(path);
    if (!stat.isFile || stat.isSymlink) throw Error(`Unsafe output: ${name}`);
    return await Deno.readFile(path);
  };
  const catalog = await read("catalog.json"),
    svg = await read("overview.svg"),
    png = await read("overview.png");
  const receipt = JSON.parse(
    new TextDecoder().decode(await read("receipt.json")),
  );
  const dimensions = pngDimensions(png);
  const expectedWidth = Number(generated.overview.match(/width="(\d+)"/)?.[1]);
  const expectedHeight = Number(
    generated.overview.match(/height="(\d+)"/)?.[1],
  );
  if (
    id !== `${digest}-${receipt.renderer}` ||
    new TextDecoder().decode(catalog) !== generated.catalog ||
    new TextDecoder().decode(svg) !== generated.overview ||
    receipt.svgSha256 !== await sha256(svg) ||
    receipt.pngSha256 !== await sha256(png) ||
    receipt.width !== dimensions.width ||
    receipt.height !== dimensions.height ||
    dimensions.width !== expectedWidth || dimensions.height !== expectedHeight
  ) throw Error("Private build is stale or damaged");
  console.log(`Verified private build: ${id}`);
};
if (mode === "verify") {
  if (!option) throw Error("Provide the private build ID");
  await check(option);
  Deno.exit(0);
}
const renderer = option ?? (Deno.build.os === "darwin" ? "ego" : "rsvg");
if (!["ego", "rsvg"].includes(renderer)) {
  throw Error("Renderer must be ego or rsvg");
}
await ensureDirectory(builds);
const id = `${digest}-${renderer}`;
let existing = true;
try {
  await Deno.lstat(`${builds}/${id}`);
} catch (error) {
  if (!(error instanceof Deno.errors.NotFound)) throw error;
  existing = false;
}
if (existing) {
  await check(id);
  Deno.exit(0);
}
const stage = await Deno.makeTempDir({ dir: builds, prefix: ".pending-" });
await Deno.writeTextFile(`${stage}/catalog.json`, generated.catalog, {
  createNew: true,
});
await Deno.writeTextFile(`${stage}/overview.svg`, generated.overview, {
  createNew: true,
});
const width = Number(generated.overview.match(/width="(\d+)"/)?.[1]);
const height = Number(generated.overview.match(/height="(\d+)"/)?.[1]);
if (!width || !height) throw Error(`Missing dimensions; retained ${stage}`);
if (renderer === "rsvg") {
  let svg = generated.overview, count = 0;
  for (
    const match of generated.overview.matchAll(
      /data:image\/webp;base64,([A-Za-z0-9+/=]+)/g,
    )
  ) {
    const source = `${stage}/input.webp`,
      decoded = `${stage}/decoded-${count}.png`;
    await Deno.writeFile(
      source,
      Uint8Array.from(atob(match[1]), (c) => c.charCodeAt(0)),
    );
    const output = await new Deno.Command("dwebp", {
      args: [source, "-quiet", "-o", "-"],
    }).output();
    if (!output.success) throw Error(`WebP decode failed; retained ${stage}`);
    pngDimensions(output.stdout);
    await Deno.writeFile(decoded, output.stdout, { createNew: true });
    svg = svg.replace(match[0], fileUrl(decoded));
    count++;
  }
  if (!count) throw Error(`No images; retained ${stage}`);
  await Deno.writeTextFile(`${stage}/render.svg`, svg, { createNew: true });
  const render = await new Deno.Command("rsvg-convert", {
    args: ["--output", `${stage}/overview.png`, `${stage}/render.svg`],
  }).output();
  if (!render.success) throw Error(`PNG rendering failed; retained ${stage}`);
  await Deno.remove(`${stage}/input.webp`);
  await Deno.remove(`${stage}/render.svg`);
  for (let i = 0; i < count; i++) {
    await Deno.remove(`${stage}/decoded-${i}.png`);
  }
} else {
  const code =
    `const t=await taskSpace("PixelFood private preview");try{const p=t.page("p1");await p.cdp("Emulation.setDeviceMetricsOverride",{width:${width},height:${height},deviceScaleFactor:1,mobile:false});await p.goto(${
      JSON.stringify(fileUrl(`${stage}/overview.svg`))
    });await p.waitForFunction(()=>document.readyState==="complete");await p.evaluate(async()=>{await Promise.all([...document.querySelectorAll("image")].map(el=>new Promise((resolve,reject)=>{const i=new Image();i.onload=resolve;i.onerror=reject;i.src=el.getAttribute("href")})))});await p.screenshot({path:${
      JSON.stringify(`${stage}/overview.png`)
    }})}finally{await t.finish({keep:[]})}`;
  const child = new Deno.Command("ego-browser", {
    args: ["nodejs"],
    stdin: "piped",
    stdout: "inherit",
    stderr: "inherit",
  }).spawn();
  const writer = child.stdin.getWriter();
  await writer.write(encoder.encode(code));
  await writer.close();
  if (!(await child.status).success) {
    throw Error(`Ego preview failed; retained ${stage}`);
  }
}
const png = await Deno.readFile(`${stage}/overview.png`);
const dimensions = pngDimensions(png);
if (dimensions.width !== width || dimensions.height !== height) {
  throw Error(`PNG dimensions differ; retained ${stage}`);
}
await Deno.writeTextFile(
  `${stage}/receipt.json`,
  JSON.stringify(
    {
      renderer,
      svgSha256: await sha256(encoder.encode(generated.overview)),
      pngSha256: await sha256(png),
      width,
      height,
    },
    null,
    2,
  ) + "\n",
  { createNew: true },
);
// No pre-existing build is replaced; a conflicting concurrent build fails visibly.
await Deno.mkdir(`${builds}/${id}`);
for (
  const name of ["catalog.json", "overview.svg", "overview.png", "receipt.json"]
) {
  await Deno.rename(`${stage}/${name}`, `${builds}/${id}/${name}`);
}
await Deno.remove(stage);
await check(id);
