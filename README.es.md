# X-PixelFood artwork

![X-PixelFood documentation mark](docs/icon.svg)

[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)
· [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md)

54 recursos WebP + PNG seleccionados, con catálogo de ID estables y hashes de
fuente y exportación.

## Uso

Use `assets/webp/<id>.webp` directamente; se incluye también
`losslessly decoded assets/png/<id>.png`. catalog.json conserva ID y hashes
estables. Para usar los archivos no necesita servidor, cuenta o herramientas de
compilación. WebP y PNG conservan transparencia. Los PNG son copias de entrega
decodificadas sin pérdida, no originales privados. Los nombres indican el sujeto
previsto, no ingredientes o nutrición comprobados.

![Selected artwork](previews/overview.png)

## Herramientas locales opcionales

Las herramientas Deno incluidas usan solo las 54 imágenes seleccionadas, no toda
la biblioteca privada. `deno task build` y `deno task verify` reconstruyen y
comprueban la selección. `deno task preview` escribe `Local/gallery.html`;
`deno task demo` sirve la página en loopback `127.0.0.1:18220`.

Con `rsvg-convert` y `dwebp`, `deno task preview:png rsvg` crea un PNG en
`Local/preview-export/` sin sustituir la vista previa revisada del paquete;
actualizar el paquete requiere otra revisión y un nuevo recibo. En macOS se usa
Ego; `deno task setup` puede instalar herramientas con Homebrew. La interfaz aún
no se ha verificado para este candidato.

Ejecute `deno task test` para las pruebas de regresión locales.

## Licencia y atribución

Atribuya X-PixelFood y la procedencia incluida; enlace
https://creativecommons.org/licenses/by/4.0/ e indique cambios. CC BY4.0 cubre
sólo derechos propios disponibles. No concede marcas ni derechos ajenos. Son
ilustraciones planas generadas por IA a petición del propietario, no modelos3D
editables ni prueba de ingredientes o nutrición. Generarlas con IA no establece
copyright ni derechos sobre elementos de terceros.

Marca de documentación: codingEzio,
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
([ARTWORK-LICENSE.md](ARTWORK-LICENSE.md)); indique los cambios. Esta licencia
separada cubre solo `docs/icon.svg` y no cambia el alcance de las obras
seleccionadas de la colección.

## Ámbito de fuente

Este candidato local excluye material sin resolver, originales privados,
herramientas no seleccionadas y la historia Git original. Consulte
LICENSE-SCOPE.json y candidate-receipt.json. Es revisión limitada de
procedencia, metadatos y contenido visible, no garantía jurídica universal.
Publicar requiere otra autorización.
