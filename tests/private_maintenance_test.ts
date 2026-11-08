import { selectedOutputs } from "../src/selected_catalog.ts";

Deno.test("private build is repeatable, isolated, and refuses damaged inputs or outputs", async () => {
  const root = await Deno.makeTempDir({
    dir: "/tmp",
    prefix: "pixelfood-test-",
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
    const id = "synthetictest";
    foods.push({ ...foods[0], id });
    provenance.assets.push({
      ...provenance.assets[0],
      id,
      file: `assets/webp/${id}.webp`,
    });
    scope.artwork.assets.push({
      ...scope.artwork.assets[0],
      id,
      file: `assets/webp/${id}.webp`,
    });
    await Deno.copyFile(
      `assets/webp/${foods[0].id}.webp`,
      `${root}/assets/webp/${id}.webp`,
    );
    await Deno.writeTextFile(`${root}/foods.json`, JSON.stringify(foods));
    await Deno.writeTextFile(
      `${root}/provenance.json`,
      JSON.stringify(provenance),
    );
    await Deno.writeTextFile(
      `${root}/LICENSE-SCOPE.json`,
      JSON.stringify(scope),
    );
    const publicBefore = (await selectedOutputs()).catalog;
    const run = async (mode: string, option: string) =>
      await new Deno.Command("deno", {
        args: ["task", `private:${mode}`, root, option],
        stdout: "piped",
        stderr: "piped",
      }).output();
    const first = await run("build", "rsvg");
    if (!first.success) {
      throw Error(`Build failed: ${new TextDecoder().decode(first.stderr)}`);
    }
    const match = new TextDecoder().decode(first.stdout).match(
      /[a-f0-9]{64}-rsvg/,
    );
    if (!match) throw Error("Missing build ID");
    const build = match[0];
    const catalog = JSON.parse(
      await Deno.readTextFile(`${root}/builds/${build}/catalog.json`),
    );
    if (
      catalog.assets.length !== 55 ||
      !catalog.assets.some((x: { id: string }) => x.id === id)
    ) throw Error("Synthetic food missing");
    if (
      !(await run("verify", build)).success ||
      !(await run("build", "rsvg")).success
    ) throw Error("Verification or repeat failed");
    if ((await selectedOutputs()).catalog !== publicBefore) {
      throw Error("Public output changed");
    }
    const asset = `${root}/assets/webp/${id}.webp`;
    await Deno.remove(asset);
    if ((await run("build", "rsvg")).success) {
      throw Error("Missing asset accepted");
    }
    await Deno.copyFile(`assets/webp/${foods[0].id}.webp`, asset);
    const receipt = `${root}/builds/${build}/receipt.json`;
    await Deno.writeTextFile(receipt, "damaged");
    if (
      (await run("build", "rsvg")).success ||
      (await run("verify", build)).success ||
      await Deno.readTextFile(receipt) !== "damaged"
    ) throw Error("Damaged build overwritten or accepted");
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
