import { selectedOutputs } from "../src/selected_catalog.ts";

// Inspect an explicit local review payload. This is not permission to publish.
type Policy = { files: string[]; releaseBlockers: string[] };
if (
  Deno.args.some((arg) => !["--export", "--release", "--reseal"].includes(arg))
) {
  throw Error("Unknown option");
}
const policy: Policy = JSON.parse(await Deno.readTextFile("public-files.json"));
if (Deno.args.includes("--release") && policy.releaseBlockers.length) {
  console.error("Release blocked: " + policy.releaseBlockers.join("; "));
  Deno.exit(1);
}
const hash = async (bytes: Uint8Array) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new Uint8Array(bytes).buffer),
    ),
  )
    .map((n) => n.toString(16).padStart(2, "0")).join("");
const files = [...policy.files].sort();
if (!files.length || new Set(files).size !== files.length) {
  throw Error("Invalid file list");
}
// This candidate is limited to the 54 individually reviewed illustrations.
const readJson = async (path: string) => {
  const stat = await Deno.lstat(path);
  if (!stat.isFile || stat.isSymlink) {
    throw Error(`Unsafe selection input: ${path}`);
  }
  return JSON.parse(await Deno.readTextFile(path));
};
if (
  ![
    "LICENSE-SCOPE.json",
    "selected.json",
    "provenance.json",
    "foods.json",
    "catalog.json",
    "previews/overview.svg",
    "previews/overview.png",
    "previews/receipt.json",
  ].every((p) => files.includes(p)) ||
  files.includes("candidate-receipt.json")
) throw Error("Incomplete selection policy");
const selectionScope = await readJson("LICENSE-SCOPE.json");
const selection = await readJson("selected.json");
const provenance = await readJson("provenance.json");
const reviewed = selectionScope.artwork.assets;
const selected = selection.assets;
const originals = provenance.assets;
if (
  selection.schemaVersion !== 1 || !Array.isArray(reviewed) ||
  !Array.isArray(selected) || !Array.isArray(originals) ||
  reviewed.length !== 54 || selected.length !== 54 || originals.length !== 54 ||
  selectionScope.artwork.selectedCount !== 54 ||
  selectionScope.artwork.selectedLicense !== "CC-BY-4.0" ||
  new Set(reviewed.map((a: { id: string }) => a.id)).size !== 54 ||
  new Set(selected.map((a: { id: string }) => a.id)).size !== 54 ||
  new Set(originals.map((a: { id: string }) => a.id)).size !== 54
) {
  throw Error("Invalid reviewed artwork selection");
}
const expectedImages = new Map<string, string>();
for (const asset of reviewed) {
  const entry = selected.find((a: { id: string }) => a.id === asset.id);
  const origin = originals.find((a: { id: string }) => a.id === asset.id);
  if (
    !/^[a-z][a-z0-9]*$/.test(asset.id) ||
    asset.selection !== "selected" ||
    asset.license !== "CC-BY-4.0-to-extent-of-owned-rights" ||
    asset.file !== `assets/webp/${asset.id}.webp` ||
    !/^[a-f0-9]{64}$/.test(asset.sha256) || !entry || !origin ||
    entry.png !== `assets/png/${asset.id}.png` ||
    !/^[a-f0-9]{64}$/.test(entry.pngSha256) ||
    origin.file !== asset.file || origin.sha256 !== asset.sha256 ||
    origin.license !== entry.importLicense
  ) {
    throw Error("Invalid reviewed artwork record");
  }
  expectedImages.set(asset.file, asset.sha256);
  expectedImages.set(entry.png, entry.pngSha256);
}
// Pin the already reviewed IDs and bytes; a new or replacement image needs a
// deliberate scope review and pin update, not just matching mutable JSON.
const reviewedImagePin =
  "7af954730a557e2bda86669e4112c9bfe59cebda62dd009acf5c506d4bb764b6";
const pinRows = reviewed.map((asset: { id: string; sha256: string }) => {
  const entry = selected.find((a: { id: string }) => a.id === asset.id);
  return [asset.id, asset.sha256, entry.pngSha256];
}).sort((a: string[], b: string[]) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
if (
  await hash(new TextEncoder().encode(JSON.stringify(pinRows))) !==
    reviewedImagePin
) {
  throw Error("Artwork selection differs from the reviewed image pin");
}
const listedImages = files.filter((path) => path.startsWith("assets/"));
if (
  listedImages.length !== expectedImages.size ||
  listedImages.some((path) => !expectedImages.has(path)) ||
  files.some((path) =>
    /\.(?:png|webp)$/i.test(path) &&
    path !== "previews/overview.png" && !expectedImages.has(path)
  )
) {
  throw Error("Payload artwork differs from reviewed selection");
}
// The approved metadata and source receipts are pinned independently of the
// mutable package receipt. Expanding or editing them requires a new review.
const approved = {
  "foods.json":
    "d8b4ccca70771bdf47723fa8e5e44d91d041aa1ebd24d93ae075eea14cebe954",
  "provenance.json":
    "f93848b93e9cd9167d8c7a2c255dcc71a547b0b27414f1c4e45971321a8ed3ad",
  "LICENSE-SCOPE.json":
    "fd78e49460620c28e2191bb0901a860942310fedd01c3d1d6c2c16611db28ef8",
  "selected.json":
    "46569dd583bbd28d207c555140ac724e74a0d93452312dd9de7b5cb9992dc849",
  "previews/overview.png":
    "4d095931d9fc7e246dc3bdf5d33643b3e5afd14f7b089f681051cd0b08f5bff3",
  "previews/receipt.json":
    "f5d813876ad2042fde70893db3991595942756cf81ff561e232ae4b1ec552396",
};
for (const [path, digest] of Object.entries(approved)) {
  if (await hash(await Deno.readFile(path)) !== digest) {
    throw Error(`Approved selection metadata differs: ${path}`);
  }
}
const generated = await selectedOutputs();
if (
  generated.catalog !== await Deno.readTextFile("catalog.json") ||
  generated.overview !== await Deno.readTextFile("previews/overview.svg")
) {
  throw Error("Public catalog or preview differs from approved selection");
}
const records: {
  path: string;
  sha256: string;
  bytes: number;
  executable: boolean;
}[] = [];
const source = new Map<string, Uint8Array>();
for (const path of files) {
  if (
    path.startsWith("/") || path.includes("\\") ||
    path.split("/").some((p) =>
      !p || p === "." || p === ".." || p === ".git" || p === "Local" ||
      p === ".local" ||
      p.startsWith(".env")
    )
  ) throw Error(`Unsafe payload path: ${path}`);
  const parts = path.split("/");
  for (let i = 1; i <= parts.length; i++) {
    if ((await Deno.lstat(parts.slice(0, i).join("/"))).isSymlink) {
      throw Error(`Symlink in payload: ${path}`);
    }
  }
  const stat = await Deno.stat(path);
  if (!stat.isFile) throw Error(`Not a regular file: ${path}`);
  const bytes = await Deno.readFile(path);
  // Binary assets are verified by their normal owner checks and hashed here.
  if (!/\.(png|webp|icns|woff2|ttf)$/i.test(path)) {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (/\/(?:Users|home)\/[^\s/]+|[A-Z]:\\Users\\[^\s\\]+/.test(text)) {
      throw Error(`Personal absolute home path: ${path}`);
    }
    if (
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{30,}\b/
        .test(text)
    ) {
      throw Error(`Credential-shaped text: ${path}`);
    }
  }
  const digest = await hash(bytes);
  if (expectedImages.has(path) && expectedImages.get(path) !== digest) {
    throw Error(`Reviewed artwork differs: ${path}`);
  }
  source.set(path, bytes);
  records.push({
    path,
    sha256: digest,
    bytes: bytes.length,
    executable: !!((stat.mode ?? 0) & 0o111),
  });
}
const seal = await hash(new TextEncoder().encode(JSON.stringify(records)));
const receipt = {
  schemaVersion: 1,
  scope: "selected-artwork-and-tools-local-candidate",
  seal,
  files: records,
  releaseBlockers: policy.releaseBlockers,
  limitations: [
    "Working files only; Git index/history and remote state require separate review.",
    "Pattern checks are not a complete secret or rights audit.",
  ],
};
const receiptText = JSON.stringify(receipt, null, 2) + "\n";
if (Deno.args.includes("--reseal")) {
  if (Deno.args.length !== 1) {
    throw Error("Reseal cannot be combined with other options");
  }
  const temporary = ".candidate-receipt.next";
  await Deno.writeTextFile(temporary, receiptText, { createNew: true });
  await Deno.rename(temporary, "candidate-receipt.json");
  if (await Deno.readTextFile("candidate-receipt.json") !== receiptText) {
    throw Error("Receipt readback failed");
  }
} else if (await Deno.readTextFile("candidate-receipt.json") !== receiptText) {
  throw Error(
    "Candidate receipt is stale; run deno task public:receipt after review",
  );
}
if (Deno.args.includes("--export")) {
  const parent = "Local/public-candidates";
  for (const directory of ["Local", parent]) {
    try {
      const stat = await Deno.lstat(directory);
      if (!stat.isDirectory || stat.isSymlink) {
        throw Error(`Unsafe output directory: ${directory}`);
      }
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }
  const output = `${parent}/${seal}`;
  let exists = false;
  try {
    const stat = await Deno.lstat(output);
    if (stat.isSymlink || !stat.isDirectory) {
      throw Error("Unsafe candidate directory");
    }
    exists = true;
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  if (!exists) {
    await Deno.mkdir(output, { recursive: true });
    for (const record of records) {
      const target = `${output}/${record.path}`;
      await Deno.mkdir(target.slice(0, target.lastIndexOf("/")), {
        recursive: true,
      });
      await Deno.writeFile(target, source.get(record.path)!, {
        mode: record.executable ? 0o755 : 0o644,
        createNew: true,
      });
    }
    await Deno.writeTextFile(`${output}/candidate-receipt.json`, receiptText, {
      createNew: true,
    });
  }
  const actual: string[] = [];
  const directories: string[] = [];
  const walk = async (base = "") => {
    for await (const entry of Deno.readDir(`${output}/${base}`)) {
      const path = base ? `${base}/${entry.name}` : entry.name;
      if (entry.isSymlink) throw Error(`Candidate symlink: ${path}`);
      if (entry.isDirectory) {
        directories.push(path);
        await walk(path);
      } else if (entry.isFile) actual.push(path);
      else throw Error(`Unexpected candidate entry: ${path}`);
    }
  };
  await walk();
  const expectedDirectories = new Set<string>();
  for (const path of files) {
    const parts = path.split("/");
    for (let i = 1; i < parts.length; i++) {
      expectedDirectories.add(parts.slice(0, i).join("/"));
    }
  }
  if (
    JSON.stringify(actual.sort()) !==
      JSON.stringify([...files, "candidate-receipt.json"].sort()) ||
    JSON.stringify(directories.sort()) !==
      JSON.stringify([...expectedDirectories].sort())
  ) {
    throw Error(
      "Candidate contains missing or unexpected entries; no files overwritten",
    );
  }
  for (const record of records) {
    const target = `${output}/${record.path}`;
    const stat = await Deno.stat(target);
    if (
      await hash(await Deno.readFile(target)) !== record.sha256 ||
      (stat.mode !== null &&
        (stat.mode & 0o777) !== (record.executable ? 0o755 : 0o644))
    ) {
      throw Error(
        `Candidate bytes/mode mismatch: ${record.path}; no files overwritten`,
      );
    }
  }
  const receiptMode =
    (await Deno.stat(`${output}/candidate-receipt.json`)).mode;
  if (
    await Deno.readTextFile(`${output}/candidate-receipt.json`) !==
      receiptText ||
    (receiptMode !== null && (receiptMode & 0o777) !== 0o644)
  ) {
    throw Error("Candidate receipt mismatch; no files overwritten");
  }
  console.log(`Candidate: ${output}`);
}
console.log(JSON.stringify(receipt, null, 2));
