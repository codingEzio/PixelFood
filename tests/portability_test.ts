import { selectedOutputs } from "../src/selected_catalog.ts";
import { pngDimensions } from "../src/preview_receipt.ts";
import { previewHandler } from "../src/preview_server.ts";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw Error(message);
}

async function sha256(data: Uint8Array) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new Uint8Array(data).buffer),
    ),
    (x) => x.toString(16).padStart(2, "0"),
  ).join("");
}

Deno.test("gallery returns only its embedded page and selected artwork", async () => {
  const handler = previewHandler("embedded gallery");
  for (
    const path of [
      "/Local/originals/a.png",
      "/.env",
      "/.git/config",
      "/assets/webp/example.webp",
    ]
  ) {
    assert(
      handler(new Request("http://localhost" + path)).status === 404,
      path,
    );
  }
  assert(
    await handler(new Request("http://localhost/")).text() ===
      "embedded gallery",
    "GET",
  );
  assert(
    await handler(new Request("http://localhost/", { method: "HEAD" }))
      .text() === "",
    "HEAD",
  );
  assert(
    handler(new Request("http://localhost/", { method: "POST" })).status ===
      405,
    "POST",
  );
  const result = await selectedOutputs(true);
  const gallery = result.html.match(/const foods = (.+);/);
  assert(gallery && JSON.parse(gallery[1]).length === 54, "selected gallery");
});

Deno.test("PNG preview accepts the selected image and rejects malformed data", async () => {
  const original = await Deno.readFile("previews/overview.png");
  const dimensions = pngDimensions(original);
  assert(dimensions.width > 0 && dimensions.height > 0, "empty dimensions");
  for (
    const bytes of [new Uint8Array(), new Uint8Array(40), original.slice(0, 20)]
  ) {
    let failed = false;
    try {
      pngDimensions(bytes);
    } catch {
      failed = true;
    }
    assert(failed, "corrupt PNG accepted");
  }
});

Deno.test("export rejects added or substituted artwork and respects release blockers", async () => {
  await Deno.mkdir("Local", { recursive: true });
  const fixture = await Deno.makeTempDir({
    dir: "Local",
    prefix: "delete_after_use_selection_test_",
  });
  try {
    await Deno.mkdir(`${fixture}/scripts`);
    for (
      const p of [
        "public-files.json",
        "LICENSE-SCOPE.json",
        "selected.json",
        "provenance.json",
        "scripts/public-check.ts",
      ]
    ) {
      await Deno.copyFile(p, `${fixture}/${p}`);
    }
    const read = async (p: string) =>
      JSON.parse(await Deno.readTextFile(`${fixture}/${p}`));
    const write = async (p: string, value: unknown) =>
      await Deno.writeTextFile(`${fixture}/${p}`, JSON.stringify(value));
    const scope = await read("LICENSE-SCOPE.json");
    const selected = await read("selected.json");
    const provenance = await read("provenance.json");
    const policy = await read("public-files.json");
    const first = scope.artwork.assets[0];
    const id = "syntheticextra";
    assert(
      !scope.artwork.assets.some((x: { id: string }) => x.id === id),
      "synthetic ID collision",
    );
    const extraScope = { ...first, id, file: `assets/webp/${id}.webp` };
    const selectedFirst = selected.assets.find((x: { id: string }) =>
      x.id === first.id
    );
    const originalFirst = provenance.assets.find((x: { id: string }) =>
      x.id === first.id
    );
    const extraSelected = { ...selectedFirst, id, png: `assets/png/${id}.png` };
    const extraOriginal = {
      ...originalFirst,
      id,
      file: `assets/webp/${id}.webp`,
    };
    const run = async (...args: string[]) =>
      await new Deno.Command("deno", {
        cwd: fixture,
        args: [
          "run",
          "--cached-only",
          "--allow-read=.",
          "scripts/public-check.ts",
          ...args,
        ],
      }).output();
    scope.artwork.assets.push(extraScope);
    scope.artwork.selectedCount++;
    selected.assets.push(extraSelected);
    provenance.assets.push(extraOriginal);
    policy.files.push(extraScope.file, extraSelected.png);
    await write("LICENSE-SCOPE.json", scope);
    await write("selected.json", selected);
    await write("provenance.json", provenance);
    await write("public-files.json", policy);
    let result = await run();
    assert(
      !result.success &&
        new TextDecoder().decode(result.stderr).includes(
          "Invalid reviewed artwork selection",
        ),
      "added artwork not rejected by selection gate",
    );
    scope.artwork.assets.shift();
    scope.artwork.selectedCount--;
    selected.assets = selected.assets.filter((x: { id: string }) =>
      x.id !== first.id
    );
    provenance.assets = provenance.assets.filter((x: { id: string }) =>
      x.id !== first.id
    );
    policy.files = policy.files.filter((x: string) =>
      x !== first.file && x !== selectedFirst.png
    );
    await write("LICENSE-SCOPE.json", scope);
    await write("selected.json", selected);
    await write("provenance.json", provenance);
    await write("public-files.json", policy);
    result = await run();
    assert(
      !result.success &&
        new TextDecoder().decode(result.stderr).includes("reviewed image pin"),
      "substitution not rejected by image pin",
    );
    policy.releaseBlockers = ["fixture blocker"];
    await write("public-files.json", policy);
    result = await run("--release");
    assert(
      !result.success &&
        new TextDecoder().decode(result.stderr).includes("Release blocked"),
      "release gate did not fail closed",
    );
  } finally {
    await Deno.remove(fixture, { recursive: true });
  }
});

Deno.test("selected package export is repeatable and reads back every file", async () => {
  await Deno.mkdir("Local", { recursive: true });
  const fixture = await Deno.makeTempDir({
    dir: "Local",
    prefix: "delete_after_use_export_test_",
  });
  try {
    const policy = JSON.parse(await Deno.readTextFile("public-files.json"));
    const all = [...policy.files, "candidate-receipt.json"] as string[];
    assert(
      policy.files.includes("tests/portability_test.ts"),
      "test missing from exported policy",
    );
    for (const name of all) {
      const parts = name.split("/");
      assert(
        !name.startsWith("/") && !name.includes("\\") &&
          parts.every((part) =>
            part && ![".", "..", ".git", "Local"].includes(part)
          ),
        "unsafe fixture input path",
      );
      for (let i = 1; i <= parts.length; i++) {
        const stat = await Deno.lstat(parts.slice(0, i).join("/"));
        assert(!stat.isSymlink, "fixture input contains a symlink");
      }
      assert((await Deno.stat(name)).isFile, "fixture input is not a file");
      const output = `${fixture}/${name}`;
      await Deno.mkdir(output.slice(0, output.lastIndexOf("/")), {
        recursive: true,
      });
      await Deno.copyFile(name, output);
    }
    const run = async () =>
      await new Deno.Command("deno", {
        cwd: fixture,
        args: ["task", "public:prepare"],
      }).output();
    const first = await run();
    assert(
      first.success,
      `first export failed: ${new TextDecoder().decode(first.stderr)}`,
    );
    const line = new TextDecoder().decode(first.stdout).match(
      /Candidate: (Local\/public-candidates\/[a-f0-9]{64})/,
    );
    assert(line, "missing export receipt path");
    const output = `${fixture}/${line[1]}`;
    const receipt = JSON.parse(
      await Deno.readTextFile(`${output}/candidate-receipt.json`),
    );
    assert(receipt.files.length === policy.files.length, "export file count");
    for (const row of receipt.files) {
      const data = await Deno.readFile(`${output}/${row.path}`);
      assert(
        data.length === row.bytes && await sha256(data) === row.sha256,
        `readback mismatch: ${row.path}`,
      );
    }
    const second = await run();
    const next = new TextDecoder().decode(second.stdout).match(
      /Candidate: (Local\/public-candidates\/[a-f0-9]{64})/,
    );
    assert(
      second.success && next && next[1] === line[1],
      "repeat export not idempotent",
    );
    const scopePath = `${fixture}/LICENSE-SCOPE.json`;
    const originalScope = await Deno.readTextFile(scopePath);
    const editedScope = JSON.parse(originalScope);
    editedScope.artwork.selectedCount--;
    await Deno.writeTextFile(scopePath, JSON.stringify(editedScope));
    await Deno.mkdir(`${fixture}/Local/preview-export`, { recursive: true });
    const html = `${fixture}/Local/gallery.html`;
    const png = `${fixture}/Local/preview-export/overview.png`;
    await Deno.writeTextFile(html, "sentinel HTML");
    await Deno.writeTextFile(png, "sentinel PNG");
    for (const args of [["preview"], ["preview:png", "rsvg"]]) {
      const failed = await new Deno.Command("deno", {
        cwd: fixture,
        args: ["task", ...args],
      }).output();
      assert(
        !failed.success &&
          new TextDecoder().decode(failed.stderr).includes(
            "Rights scope differs",
          ),
        `scope change not rejected: ${args[0]}`,
      );
    }
    assert(
      await Deno.readTextFile(html) === "sentinel HTML",
      "invalid scope overwrote HTML",
    );
    assert(
      await Deno.readTextFile(png) === "sentinel PNG",
      "invalid scope overwrote PNG",
    );
    await Deno.writeTextFile(scopePath, originalScope);
    await Deno.writeTextFile(
      `${fixture}/previews/overview.svg`,
      "unexpected overview",
    );
    const changed = await new Deno.Command("deno", {
      cwd: fixture,
      args: ["task", "preview:png", "rsvg"],
    }).output();
    assert(
      !changed.success &&
        new TextDecoder().decode(changed.stderr).includes(
          "Selected overview differs",
        ),
      "changed overview not rejected",
    );
    assert(
      await Deno.readTextFile(png) === "sentinel PNG",
      "changed overview overwrote PNG",
    );
  } finally {
    await Deno.remove(fixture, { recursive: true });
  }
});
