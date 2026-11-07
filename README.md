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
