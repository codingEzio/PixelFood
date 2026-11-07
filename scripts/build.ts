import { selectedOutputs } from "../src/selected_catalog.ts";

const result = await selectedOutputs();
await Deno.mkdir("previews", { recursive: true });
for await (const entry of Deno.readDir("previews")) {
  if (entry.name.startsWith(".selected-build-")) {
    throw Error(
      `Unfinished selected build: previews/${entry.name}; inspect its backups before retrying`,
    );
  }
}
const destinations = ["catalog.json", "previews/overview.svg"];
const values = [result.catalog, result.overview];
const previous: (Uint8Array | null)[] = [];
for (const path of destinations) {
  try {
    const stat = await Deno.lstat(path);
    if (!stat.isFile || stat.isSymlink) throw Error(`Unsafe output: ${path}`);
    previous.push(await Deno.readFile(path));
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) previous.push(null);
    else throw error;
  }
}
const encoder = new TextEncoder();
const data = values.map((value) => encoder.encode(value));
if (
  previous.every((old, i) =>
    old && old.length === data[i].length &&
    old.every((byte, j) => byte === data[i][j])
  )
) {
  console.log("Selected catalog and static preview are already current");
} else {
  const stage = await Deno.makeTempDir({
    dir: "previews",
    prefix: ".selected-build-",
  });
  const staged = [`${stage}/catalog.next`, `${stage}/overview.next`];
  const backups = [`${stage}/catalog.previous`, `${stage}/overview.previous`];
  let completed = 0;
  let safeToRemove = false;
  try {
    await Deno.writeTextFile(
      `${stage}/state.json`,
      JSON.stringify(
        {
          previousExists: previous.map((value) => value !== null),
          destinations,
        },
        null,
        2,
      ) + "\n",
      { createNew: true },
    );
    for (let i = 0; i < destinations.length; i++) {
      if (previous[i]) {
        await Deno.writeFile(backups[i], previous[i]!, { createNew: true });
      }
      await Deno.writeFile(staged[i], data[i], { createNew: true });
    }
    for (let i = 0; i < destinations.length; i++) {
      await Deno.rename(staged[i], destinations[i]);
      completed++;
    }
    safeToRemove = true;
    console.log("Built selected catalog and static preview");
  } catch (error) {
    try {
      for (let i = completed - 1; i >= 0; i--) {
        if (previous[i]) await Deno.rename(backups[i], destinations[i]);
        else await Deno.remove(destinations[i]);
      }
      safeToRemove = true;
    } catch {
      throw Error(
        `Build failed and rollback needs attention; retained backups: ${stage}`,
        { cause: error },
      );
    }
    throw error;
  } finally {
    if (safeToRemove) await Deno.remove(stage, { recursive: true });
  }
}
