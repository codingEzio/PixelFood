# X-PixelFood 素材

![X-PixelFood documentation mark](docs/icon.svg)

[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)
· [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md)

54 件入選 WebP + PNG 素材。catalog.json 提供穩定
ID、來源／輸出雜湊與三語名稱。可使用 assets/webp/<id>.webp 或無損解碼的
assets/png/<id>.png；這是平面插圖，非可編輯 3D 模型。

## 使用

直接使用 `assets/webp/<id>.webp`，另附
`losslessly decoded assets/png/<id>.png`。catalog.json 提供穩定 ID
與來源／輸出雜湊；檔名保持穩定。使用素材不需要伺服器、帳號或建置工具。 WebP／PNG
均保留透明背景；PNG
是無損解碼的交付副本，不是私人原稿。名稱表示繪製主題，不證明配料或營養。

![入選素材](previews/overview.png)

## 可選本機工具

隨附的 Deno 工具只處理入選的 54 張圖，不代表完整私人圖庫。執行 `deno task build`
與 `deno task verify` 重建並驗證選集；`deno task preview` 寫入
`Local/gallery.html`，`deno task demo` 在回環位址 `127.0.0.1:18220` 提供頁面。

安裝 `rsvg-convert` 與 `dwebp` 後，可執行 `deno task preview:png rsvg` 產生本機
PNG，輸出至
`Local/preview-export/`，不會取代已審查的封包預覽；更新正式封包須另行審查並重封收據。macOS
預設使用 Ego；`deno task setup` 可能透過 Homebrew
安裝缺少的工具。本候選的瀏覽器介面尚未驗證。

執行 `deno task test` 進行本機回歸測試。

## 授權與署名

請標示 X-PixelFood 與所附來源／出處、連結
https://creativecommons.org/licenses/by/4.0/ 並註明修改。CC BY 4.0
僅涵蓋可授權的自有權利，不授予商標或第三方權利。這些插圖為委託 AI
生成；此事實不證明著作權成立或第三方元素權利。

文件標誌：codingEzio，[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
([ARTWORK-LICENSE.md](ARTWORK-LICENSE.md))；請註明修改。此獨立授權僅涵蓋
`docs/icon.svg`，不變更已選定的收藏作品範圍。

## 來源範圍

本機候選包排除來源未解素材、私人原檔、未選入的工具原始碼及原 Git 歷史。詳見
LICENSE-SCOPE.json 與
candidate-receipt.json。此次僅核對來源、容器中繼資料與可見內容，不保證著作權成立或全面法律清除；尚未授權發布。

## 私人圖庫

完整資料放在儲存庫外的私人目錄，包含
`foods.json`、`provenance.json`、`LICENSE-SCOPE.json` 及
`assets/webp/`。公開選集的資料與雜湊必須一致；原稿與敏感來源資料另行保存。完整
`foods.json` 可供需要全部 ID 的程式使用。

執行 `deno task private:demo /私人資料的絕對路徑`，於本機開啟
`http://127.0.0.1:18221/`；第二個參數可指定埠號。此圖庫唯讀，僅透過本機回環位址提供嵌入圖片的頁面。公開建置不讀取私人目錄；勿將私人素材或完整預覽加入
Git 或公開匯出。公開素材更新後，須同步核對私人紀錄。

### 維護私人素材

原始 PNG 與私人來源收據分別保存在
`ROOT/originals/`、`ROOT/receipts/`，不供圖庫或建置讀取，也不公開匯出；遷移時保留既有原稿。新增
WebP 到 `ROOT/assets/webp/`，同步更新
`ROOT/foods.json`、`ROOT/provenance.json`、`ROOT/LICENSE-SCOPE.json`，並保持公開項目一致。另行檢視素材與來源證據。

執行 `deno task private:build /絕對ROOT [ego|rsvg]`：macOS 預設
Ego，其他系統預設 librsvg；`rsvg` 需 `rsvg-convert` 和 `dwebp`。輸出至
`ROOT/builds/BUILD_ID/`，包含 catalog、SVG、PNG 和收據；catalog 的素材路徑相對於
ROOT。執行
`deno task private:verify /絕對ROOT BUILD_ID`，並檢視預覽。重跑會驗證並重用相同輸出；損壞或不完整的輸出不會被覆蓋，失敗暫存保留供檢查。完整圖庫產物保持私人。Godspeed
catalog CLI 請明確指向 `ROOT/foods.json`；其 export 可能修改此檔。
