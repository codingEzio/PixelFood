# X-PixelFood artwork

![X-PixelFood documentation mark](docs/icon.svg)

[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)
· [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md)

선택한WebP + PNG자산54개와 안정된 ID、원본／출력 해시를 가진 카탈로그입니다.

## 사용

`assets/webp/<id>.webp`를 직접 사용하며
`losslessly decoded assets/png/<id>.png`도 포함합니다. catalog.json에 안정된ID와
원본／출력 해시가 있으며 사용에 서버、계정、빌드 도구가 필요하지 않습니다.
WebP／PNG는 투명 배경을 유지하고 PNG는 무손실 해제한 배포 복사본으로 개인 원본이
아닙니다. 이름은 의도한 음식이며 재료나 영양 증거가 아닙니다.

![Selected artwork](previews/overview.png)

## 선택적 로컬 도구

포함된 Deno 도구는 선택된 이미지 54개만 처리하며 전체 개인 라이브러리를 뜻하지
않습니다. `deno task build`와 `deno task verify`로 선택 항목을 재생성하고
검증합니다. `deno task preview`는 `Local/gallery.html`을 만들고
`deno task demo`는 루프백 `127.0.0.1:18220`에서 제공합니다.

`rsvg-convert`와 `dwebp`가 있으면 `deno task preview:png rsvg`가 PNG를
`Local/preview-export/`에 만듭니다. 검토된 패키지 미리보기는 덮어쓰지 않으며
패키지 갱신에는 별도 검토와 receipt 재생성이 필요합니다. macOS에서는 Ego를
사용합니다. `deno task setup`은 Homebrew로 누락된 도구를 설치할 수 있습니다. 이
후보의 브라우저 UI는 아직 검증하지 않았습니다.

`deno task test`로 로컬 회귀 테스트를 실행할 수 있습니다.

## 라이선스와 출처

X-PixelFood와 동봉 출처를 표시하고 https://creativecommons.org/licenses/by/4.0/
에 연결하며 변경을 명시합니다. CC BY4.0은 보유자가 허가할 수 있는 권리만
적용하며 상표나 제3자 권리를 부여하지 않습니다.소유자가 의뢰한 AI 생성 평면
삽화로 편집 가능한3D모델이나 식재료／영양 증거가 아닙니다. AI 생성 사실만으로
저작권이나 제3자 요소 권리가 확인되지 않습니다.

문서 마크: codingEzio, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
([ARTWORK-LICENSE.md](ARTWORK-LICENSE.md)). 변경 사항을 표시하십시오. 이 별도
허가는 `docs/icon.svg`에만 적용되며 선택한 컬렉션 작품의 범위를 변경하지
않습니다.

## 소스 범위

로컬 후보는 미해결 자산、개인 원본、선택되지 않은 도구 소스와 원본 Git 이력을
제외합니다. LICENSE-SCOPE.json과candidate-receipt.json을 확인하십시오.
출처、컨테이너 메타데이터、보이는 내용의 한정 검토이며 포괄적 권리 보증은
아닙니다. 공개는 별도 승인이 필요합니다.
