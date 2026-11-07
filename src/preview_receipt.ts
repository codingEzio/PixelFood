/** Validate the PNG container before trusting an export receipt. */
export function pngDimensions(bytes: Uint8Array) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (
    bytes.length < 33 || signature.some((n, i) => bytes[i] !== n) ||
    new TextDecoder().decode(bytes.subarray(12, 16)) !== "IHDR"
  ) {
    throw Error("Invalid PNG preview");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(8) !== 13) throw Error("Invalid PNG header");
  const width = view.getUint32(16), height = view.getUint32(20);
  if (!width || !height) throw Error("Invalid PNG dimensions");
  return { width, height };
}
