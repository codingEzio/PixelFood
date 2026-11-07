import { outputs, sha256 } from "./catalog.ts";

/** Rebuild the reviewed selection without dropping its PNG or rights records. */
export async function selectedOutputs(
  includeGallery = false,
) {
  const generated = await outputs(includeGallery);
  const catalog = JSON.parse(generated.catalog);
  const selected = JSON.parse(await Deno.readTextFile("selected.json"));
  const scopeBytes = await Deno.readFile("LICENSE-SCOPE.json");
  const scope = JSON.parse(new TextDecoder().decode(scopeBytes));
  const packageReceipt = JSON.parse(
    await Deno.readTextFile("candidate-receipt.json"),
  );
  const scopeReceipt = packageReceipt.files.find((row: { path: string }) =>
    row.path === "LICENSE-SCOPE.json"
  );
  if (
    !scopeReceipt || scopeReceipt.bytes !== scopeBytes.length ||
    scopeReceipt.sha256 !== await sha256(scopeBytes)
  ) {
    throw Error("Rights scope differs from the selected package receipt");
  }
  const scopeRows = scope.artwork.assets;
  const rows = selected.assets;
  if (
    selected.schemaVersion !== 1 || !Array.isArray(rows) ||
    !Array.isArray(scopeRows) || rows.length !== catalog.assets.length ||
    scopeRows.length !== rows.length ||
    scope.artwork.selectedCount !== rows.length ||
    scope.artwork.selectedLicense !== "CC-BY-4.0" ||
    new Set(rows.map((row: { id: string }) => row.id)).size !== rows.length ||
    new Set(scopeRows.map((row: { id: string }) => row.id)).size !== rows.length
  ) throw Error("Selection, rights scope and catalog membership differ");

  const assets = [];
  for (const asset of catalog.assets) {
    const entry = rows.find((row: { id: string }) => row.id === asset.id);
    const rights = scopeRows.find((row: { id: string }) => row.id === asset.id);
    const png = `assets/png/${asset.id}.png`;
    const receipt = packageReceipt.files.find((row: { path: string }) =>
      row.path === png
    );
    if (
      !entry || !rights || rights.file !== asset.file ||
      rights.sha256 !== asset.sha256 ||
      rights.selection !== "selected" || entry.png !== png || !receipt ||
      receipt.sha256 !== entry.pngSha256 ||
      entry.importLicense !== asset.license ||
      rights.license !== "CC-BY-4.0-to-extent-of-owned-rights"
    ) throw Error(`Selection or rights record mismatch: ${asset.id}`);
    const bytes = await Deno.readFile(png);
    if (
      bytes.length !== receipt.bytes || await sha256(bytes) !== receipt.sha256
    ) {
      throw Error(`Selected PNG differs from its receipt: ${asset.id}`);
    }
    assets.push({
      ...asset,
      license: rights.license,
      importLicense: entry.importLicense,
      distribution: rights,
      png,
      pngSha256: entry.pngSha256,
    });
  }
  const selectedLabel =
    "Selected artwork · AI-generated · CC BY 4.0 to the extent of owned rights";
  const oldDescription =
    "A static overview made from the original transparent WebP exports. AI-generated, rights vary by image.";
  const oldFooter =
    "Actual collection exports · AI-generated artwork · Rights vary by image";
  if (
    !generated.overview.includes(oldDescription) ||
    !generated.overview.includes(oldFooter)
  ) {
    throw Error("Unexpected overview template");
  }
  return {
    catalog: JSON.stringify(
      {
        schemaVersion: catalog.schemaVersion,
        version: catalog.version,
        licenseScope: "LICENSE-SCOPE.json",
        assets,
      },
      null,
      2,
    ) + "\n",
    overview: generated.overview.replace(oldDescription, selectedLabel).replace(
      oldFooter,
      selectedLabel,
    ),
    html: generated.html,
  };
}
