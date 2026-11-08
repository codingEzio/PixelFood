# X-PixelFood artwork

![X-PixelFood documentation mark](docs/icon.svg)

[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)
· [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md)

54点の選定済みWebP +
PNG素材です。安定したIDと由来／出力ハッシュを持つカタログを添付します。

## 使う

`assets/webp/<id>.webp` を直接使用し、`losslessly decoded assets/png/<id>.png`
も同梱します。catalog.json
に安定IDと元／出力ハッシュがあり、使用にサーバー・アカウント・ビルドツールは不要です。
WebP／PNG は透過で、PNG
は無損失デコードした配布用コピー、私有原本ではありません。名称は意図した食べ物で、材料や栄養を証明しません。

![Selected artwork](previews/overview.png)

## 任意のローカルツール

付属の Deno ツールは選定済みの 54
画像だけを扱い、私有ライブラリー全体を表しません。`deno task build` と
`deno task verify` で選定物を再構築・検証できます。`deno task preview` は
`Local/gallery.html` に出力し、`deno task demo` はループバック `127.0.0.1:18220`
で提供します。

`rsvg-convert` と `dwebp` があれば `deno task preview:png rsvg` で
`Local/preview-export/` に PNG
を出力します。審査済みパッケージのプレビューは上書きせず、更新には別途審査と
receipt の再作成が必要です。macOS では Ego を使用します。`deno task setup` は
Homebrew で不足ツールをインストールする場合があります。この候補のブラウザー UI
は未検証です。

`deno task test` でローカル回帰テストを実行できます。

## ライセンスと出典

X-PixelFoodと同梱の出典を表示し、https://creativecommons.org/licenses/by/4.0/
へリンクして変更を明記してください。CC BY4.0
は所有者が許諾できる権利だけを対象とし、商標や第三者の権利を与えません。委託されたAI生成の平面イラストで、編集可能な3Dモデルや食材・栄養の証拠ではありません。AI生成という事実だけで著作権や第三者要素の権利は確立しません。

文書用マーク：codingEzio、[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
([ARTWORK-LICENSE.md](ARTWORK-LICENSE.md))。変更を明記してください。この独立した許諾は
`docs/icon.svg` だけを対象とし、選定済みコレクションの作品範囲は変更しません。

## ソース範囲

このローカル候補は未解決素材、私有原本、未選定のツールソースと元の Git
履歴を除外します。LICENSE-SCOPE.jsonとcandidate-receipt.jsonを確認してください。範囲内の出典、容器メタデータと可視内容の審査であり、包括的な権利保証ではありません。公開は別途承認が必要です。

## 非公開コレクションの管理

リポジトリ外の `ROOT` に
`foods.json`、`provenance.json`、`LICENSE-SCOPE.json`、`assets/webp/`
を保存し、公開済み項目を一致させます。元の PNG と非公開の出典記録は
`ROOT/originals/` と `ROOT/receipts/`
に保管し、既存の原本を残します。画像追加時は WebP
と三つの記録を更新し、画像と出典を別途確認してください。

`deno task private:demo /absolute/ROOT`
はローカル専用の閲覧画面です。`deno task private:build /absolute/ROOT [ego|rsvg]`
は catalog、SVG、PNG、検証記録を `ROOT/builds/BUILD_ID/` に作成します。macOS
の既定は Ego、その他は librsvg です。rsvg には `rsvg-convert` と `dwebp`
が必要です。`deno task private:verify /absolute/ROOT BUILD_ID`
で検証し、画像も確認してください。再実行時は既存結果を検証し、破損時には上書きしません。失敗した一時ファイルは調査用に残ります。catalog
の画像パスは ROOT 基準です。Godspeed の catalog CLI には `ROOT/foods.json`
を指定します。export
はこのファイルを変更する場合があります。非公開画像と生成物を Git
や公開配布に含めないでください。
