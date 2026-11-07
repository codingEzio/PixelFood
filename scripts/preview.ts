import { selectedOutputs } from "../src/selected_catalog.ts";
const result = await selectedOutputs(true);
await Deno.mkdir("Local", { recursive: true });
await Deno.writeTextFile("Local/gallery.html", result.html);
console.log("Optional local tool: Local/gallery.html (ignored by Git)");
