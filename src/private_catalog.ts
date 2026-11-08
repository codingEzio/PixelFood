import { renderOverview } from "./overview.ts";
export const locales = ["en", "zh-TW", "zh-CN"] as const;
export interface Food {
  id: string;
  names: Record<typeof locales[number], string>;
  category: string;
}
export interface Receipt {
  id: string;
  file: string;
  sha256: string;
  bytes: number;
  width: number;
  height: number;
  originalSha256: string;
  originalWidth: number;
  originalHeight: number;
  creation: string;
  license: string;
  processing: string;
}
export async function sha256(bytes: Uint8Array): Promise<string> {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new Uint8Array(bytes).buffer),
    ),
    (v) => v.toString(16).padStart(2, "0"),
  ).join("");
}
export async function privateOutputs(
  root: string,
  includeGallery = false,
) {
  const foods: Food[] = JSON.parse(
    await Deno.readTextFile(`${root}/foods.json`),
  );
  const receipts: Receipt[] =
    JSON.parse(await Deno.readTextFile(`${root}/provenance.json`)).assets;
  const scope = JSON.parse(
    await Deno.readTextFile(`${root}/LICENSE-SCOPE.json`),
  );
  const ids = new Set(foods.map((f) => f.id));
  if (
    !foods.length || ids.size !== foods.length ||
    receipts.length !== foods.length ||
    new Set(receipts.map((r) => r.id)).size !== receipts.length
  ) throw Error("Duplicate or missing catalog records");
  const expected = foods.map((f) => `${f.id}.webp`).sort();
  const actual = [];
  for await (const e of Deno.readDir(`${root}/assets/webp`)) {
    if (!e.isFile) throw Error(`Unexpected asset directory: ${e.name}`);
    actual.push(e.name);
  }
  if (JSON.stringify(expected) !== JSON.stringify(actual.sort())) {
    throw Error("Asset files differ from the catalog");
  }
  // A private full catalog may add items, but must not silently replace public ones.
  const publicFoods: Food[] = JSON.parse(await Deno.readTextFile("foods.json"));
  const publicReceipts: Receipt[] =
    JSON.parse(await Deno.readTextFile("provenance.json")).assets;
  for (const publicFood of publicFoods) {
    const food = foods.find((row) => row.id === publicFood.id);
    const receipt = receipts.find((row) => row.id === publicFood.id);
    const expected = publicReceipts.find((row) => row.id === publicFood.id);
    if (
      JSON.stringify(food) !== JSON.stringify(publicFood) || !receipt ||
      !expected || receipt.sha256 !== expected.sha256
    ) {
      throw Error(
        `Private catalog differs from public selection: ${publicFood.id}`,
      );
    }
  }
  const embedded: (Food & Receipt & { data: string })[] = [];
  const catalog = [];
  for (const food of foods) {
    if (
      !/^[a-z][a-z0-9]*$/.test(food.id) ||
      !["meals", "grains", "vegetables", "protein", "snacks"].includes(
        food.category,
      ) ||
      locales.some((l) => !food.names[l]?.trim())
    ) throw Error(`Invalid food: ${food.id}`);
    const receipt = receipts.find((r) => r.id === food.id);
    if (!receipt || receipt.file !== `assets/webp/${food.id}.webp`) {
      throw Error(`Missing receipt: ${food.id}`);
    }
    const bytes = await Deno.readFile(`${root}/${receipt.file}`);
    if (
      bytes.length !== receipt.bytes || await sha256(bytes) !== receipt.sha256
    ) throw Error(`Asset changed without receipt: ${food.id}`);
    if (
      new TextDecoder().decode(bytes.subarray(0, 4)) !== "RIFF" ||
      new TextDecoder().decode(bytes.subarray(8, 12)) !== "WEBP"
    ) throw Error(`Invalid WebP: ${food.id}`);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let dimensionsVerified = false;
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const tag = new TextDecoder().decode(bytes.subarray(offset, offset + 4));
      const size = view.getUint32(offset + 4, true);
      if (offset + 8 + size > bytes.length) {
        throw Error(`Truncated WebP: ${food.id}`);
      }
      if (["EXIF", "XMP "].includes(tag)) {
        throw Error(`Review private image metadata before import: ${food.id}`);
      }
      if (tag === "VP8X" && size >= 10) {
        const at = offset + 8;
        const width = 1 + bytes[at + 4] + (bytes[at + 5] << 8) +
          (bytes[at + 6] << 16);
        const height = 1 + bytes[at + 7] + (bytes[at + 8] << 8) +
          (bytes[at + 9] << 16);
        if (
          width !== receipt.width || height !== receipt.height ||
          !(bytes[at] & 16)
        ) {
          throw Error(
            `Dimensions or alpha flag differ from receipt: ${food.id}`,
          );
        }
        dimensionsVerified = true;
      }
      offset += 8 + size + (size % 2);
    }
    if (!dimensionsVerified) {
      throw Error(`Expected alpha WebP with VP8X header: ${food.id}`);
    }
    const distribution = scope.artwork.assets.find((asset: { id: string }) =>
      asset.id === food.id
    );
    if (
      !distribution || distribution.file !== receipt.file ||
      distribution.sha256 !== receipt.sha256
    ) {
      throw Error(`Stale license scope: ${food.id}`);
    }
    const row = {
      ...food,
      ...receipt,
      importLicense: receipt.license,
      license: distribution.license,
      distribution,
    };
    catalog.push(row);
    // Keep the gallery offline and independent of file:// fetch restrictions.
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    embedded.push({ ...row, data: `data:image/webp;base64,${btoa(binary)}` });
  }
  let html = "";
  if (includeGallery) {
    const script = await Deno.readTextFile("src/gallery.js");
    html = (await Deno.readTextFile("src/gallery.html"))
      .replace(
        "/*__FOODS__*/",
        () =>
          `const foods = ${
            JSON.stringify(embedded).replaceAll("<", "\\u003c")
          };`,
      )
      .replace("/*__SCRIPT__*/", () => script);
  }
  return {
    catalog: JSON.stringify(
      {
        schemaVersion: 1,
        version: "0.1.0",
        licenseScope: "LICENSE-SCOPE.json",
        assets: catalog,
      },
      null,
      2,
    ) + "\n",
    overview: renderOverview(embedded),
    html,
  };
}
