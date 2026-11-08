# X-PixelFood artwork

![X-PixelFood documentation mark](docs/icon.svg)

[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)
· [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md)

54 selected WebP + PNG assets. Open catalog.json for stable IDs, source/export
hashes and three-language labels. Use assets/webp/<id>.webp or losslessly
decoded assets/png/<id>.png; these are flat illustrations, not editable 3D
models.

## Use

Use `assets/webp/<id>.webp` directly. The package also includes
`losslessly decoded assets/png/<id>.png`. `catalog.json` records stable IDs and
source/export hashes; filenames remain stable. No server, account or build tool
is needed to use the exported assets.

WebP and PNG files retain transparent backgrounds. They are flat 2D
illustrations. The PNGs are losslessly decoded delivery copies, not private
source originals. Labels describe intended food subjects, not verified
ingredients or nutrition.

![Selected artwork](previews/overview.png)

## Optional local tools

The included Deno tools operate on the selected 54 images, not the whole private
library. Run `deno task build` and `deno task verify` to rebuild and check this
selection. `deno task preview` writes `Local/gallery.html`; `deno task demo`
serves it on loopback at `127.0.0.1:18220`.

For a local PNG preview, run `deno task preview:png rsvg` with `rsvg-convert`
and `dwebp` installed. It writes to `Local/preview-export/` and does not replace
the reviewed package preview; updating that package needs a separate review and
receipt. On macOS the default renderer uses Ego. `deno task setup` may install
missing tools using Homebrew. Browser UI has not been verified for this
candidate.

Run `deno task test` for local regression checks.

## License and attribution

Credit X-PixelFood and the supplied source/provenance; link to
https://creativecommons.org/licenses/by/4.0/ and state changes. CC BY 4.0
applies only to owned rights. Trademarks and other third-party rights are not
granted. AI-generated, owner-commissioned illustrations; this fact does not
establish copyright or rights in third-party elements.

Document mark: codingEzio,
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
([ARTWORK-LICENSE.md](ARTWORK-LICENSE.md)); indicate changes. This separate
grant covers only `docs/icon.svg` and does not change the selected collection
artwork scope.

## Source boundary

This local candidate excludes unresolved material, private originals, unselected
tool sources and original Git history. See LICENSE-SCOPE.json and
candidate-receipt.json. Selection is a bounded source, metadata and visual
review, not a guarantee of copyright or legal clearance.

## Optional private collection

Keep a full private data directory outside this repository. It contains
`foods.json`, `provenance.json`, `LICENSE-SCOPE.json`, and `assets/webp/`; the
first 54 public records and image hashes must match this repository. Keep
original images and sensitive source evidence separately. The full `foods.json`
is also suitable for consumers that require all IDs.

Run `deno task private:demo /absolute/path/to/private-data` and open
`http://127.0.0.1:18221/`. An optional second argument sets the port. This
read-only gallery embeds the full collection and serves only the page on
loopback. It does not write private data or change the public build. Public
tasks never read this directory; private assets and generated full previews must
not be added to Git or public exports. Changes to public assets require
reconciling their matching private records before using the private gallery.

### Maintaining private artwork

Keep original PNGs and private source receipts in `ROOT/originals/` and
`ROOT/receipts/`; these folders are not read by the gallery or build and are
never public exports. Preserve existing originals when migrating. Add an image
to `ROOT/assets/webp/` and its matching records to `ROOT/foods.json`,
`ROOT/provenance.json`, and `ROOT/LICENSE-SCOPE.json`. Keep all public entries
consistent. Inspect artwork and source evidence separately.

Run `deno task private:build /absolute/ROOT [ego|rsvg]`; the default is Ego on
macOS and librsvg elsewhere. The `rsvg` option requires `rsvg-convert` and
`dwebp`. It creates `ROOT/builds/BUILD_ID/` with catalog, SVG, PNG and receipt.
Catalog asset paths are relative to ROOT. Then run
`deno task private:verify /absolute/ROOT BUILD_ID` and inspect the preview.
Repeating the build verifies and reuses matching output; damaged or incomplete
output fails without replacement. Failed staging folders remain for inspection.
Keep all full-catalog outputs private. For Godspeed's catalog CLI, explicitly
use `ROOT/foods.json`; its export can modify that file.

After reviewing changes to public files, run `deno task public:receipt` to
refresh the tracked receipt. `public:check`, export, and release checks reject a
stale receipt. This local receipt does not approve a release or replace Git
review.
