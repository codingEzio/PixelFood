import type { Food } from "./catalog.ts";
const escape = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
/** A static contact sheet of actual exports, with no interface controls. */
export function renderOverview(foods: (Food & { data: string })[]): string {
  const columns = 6;
  const rows = Math.ceil(foods.length / columns);
  const height = 180 + rows * 204;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="${height}" viewBox="0 0 1280 ${height}" role="img" aria-labelledby="title desc">
<title id="title">X-PixelFood — ${foods.length} food illustrations</title>
<desc id="desc">A static overview made from the original transparent WebP exports. AI-generated, rights vary by image.</desc>
<rect width="1280" height="${height}" fill="#f8f7f1"/>
<g font-family="Arial, sans-serif" fill="#252a20">
<text x="32" y="58" font-size="36" font-weight="700">X-PixelFood</text>
<text x="32" y="91" font-size="17" fill="#646c58">${foods.length} transparent food illustrations · Pixel / voxel style · 2D WebP</text>
${
    foods.map((f, i) => {
      const x = 32 + (i % columns) * 204;
      const y = 120 + Math.floor(i / columns) * 204;
      return `<g><image x="${
        x + 14
      }" y="${y}" width="164" height="164" href="${f.data}"/><text x="${
        x + 96
      }" y="${y + 182}" text-anchor="middle" font-size="13">${
        escape(f.names.en)
      }</text></g>`;
    }).join("\n")
  }
<text x="32" y="${
    height - 20
  }" font-size="13" fill="#646c58">Actual collection exports · AI-generated artwork · Rights vary by image</text>
</g></svg>\n`;
}
