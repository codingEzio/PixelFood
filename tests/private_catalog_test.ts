import { privateOutputs } from "../src/private_catalog.ts";
import { privatePreviewHandler } from "../src/preview_server.ts";
import { selectedOutputs } from "../src/selected_catalog.ts";

Deno.test("private collection adds an item without changing public output and rejects bad records", async () => {
  await Deno.mkdir("Local", { recursive: true });
  const root = await Deno.makeTempDir({
    dir: "Local",
    prefix: "private-test-",
  });
  try {
    await Deno.mkdir(`${root}/assets/webp`, { recursive: true });
    const foods = JSON.parse(await Deno.readTextFile("foods.json"));
    const provenance = JSON.parse(await Deno.readTextFile("provenance.json"));
    const scope = JSON.parse(await Deno.readTextFile("LICENSE-SCOPE.json"));
    for (const food of foods) {
      await Deno.copyFile(
        `assets/webp/${food.id}.webp`,
        `${root}/assets/webp/${food.id}.webp`,
      );
    }
    const extra = {
      ...foods[0],
      id: "synthetictest",
      names: { ...foods[0].names, en: "Test $' $$ $& $` name" },
    };
    const extraReceipt = {
      ...provenance.assets[0],
      id: extra.id,
      file: `assets/webp/${extra.id}.webp`,
    };
    const extraScope = {
      ...scope.artwork.assets[0],
      id: extra.id,
      file: extraReceipt.file,
    };
    foods.push(extra);
    provenance.assets.push(extraReceipt);
    scope.artwork.assets.push(extraScope);
    await Deno.copyFile(
      `assets/webp/${foods[0].id}.webp`,
      `${root}/${extraReceipt.file}`,
    );
    const save = async () => {
      await Deno.writeTextFile(`${root}/foods.json`, JSON.stringify(foods));
      await Deno.writeTextFile(
        `${root}/provenance.json`,
        JSON.stringify(provenance),
      );
      await Deno.writeTextFile(
        `${root}/LICENSE-SCOPE.json`,
        JSON.stringify(scope),
      );
    };
    await save();
    const publicBefore = await selectedOutputs();
    const privateResult = await privateOutputs(root, true);
    if (
      JSON.parse(privateResult.catalog).assets.length !== 55 ||
      !privateResult.html.includes("synthetictest")
    ) throw Error("Private item missing");
    const match = privateResult.html.match(/const foods = (.*);/);
    if (
      !match ||
      JSON.parse(match[1]).find((food: { id: string }) => food.id === extra.id)
          ?.names.en !== extra.names.en
    ) throw Error("Private names were changed during HTML embedding");
    if (
      (await selectedOutputs()).catalog !== publicBefore.catalog ||
      publicBefore.catalog.includes("synthetictest")
    ) throw Error("Private item reached public catalog");
    const reject = async () => {
      let failed = false;
      try {
        await privateOutputs(root);
      } catch {
        failed = true;
      }
      if (!failed) throw Error("Invalid private data accepted");
    };
    foods[0].names.en = "Changed";
    await save();
    await reject();
    foods[0].names.en =
      JSON.parse(await Deno.readTextFile("foods.json"))[0].names.en;
    foods.push(extra);
    await save();
    await reject();
    foods.pop();
    await save();
    await Deno.remove(`${root}/${extraReceipt.file}`);
    await reject();
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("private gallery only accepts loopback Host with the listening port", () => {
  const handler = privatePreviewHandler("private page", 18221);
  const request = (host: string | null) =>
    new Request("http://127.0.0.1:18221/", {
      headers: host === null ? {} : { host },
    });
  for (
    const host of ["localhost:18221", "LOCALHOST:18221", "127.0.0.1:18221"]
  ) {
    if (handler(request(host)).status !== 200) {
      throw Error(
        `Valid Host rejected: ${host}`,
      );
    }
  }
  for (
    const host of [
      null,
      "attacker.invalid:18221",
      "127.0.0.1:18222",
      "localhost",
      "localhost.attacker.invalid:18221",
      "127.0.0.1:18221@attacker.invalid",
      "[::1]:18221",
      "127.0.0.1:018221",
    ]
  ) {
    if (handler(request(host)).status !== 403) {
      throw Error(`Invalid Host accepted: ${host}`);
    }
  }
});
