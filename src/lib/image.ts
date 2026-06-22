import "server-only";
import sharp from "sharp";

export const RASTER_EXT = ["png", "jpg", "jpeg", "webp", "avif"];

/**
 * Normalize a product image so uploads look consistent with each other:
 *  - auto-trim surrounding transparent / solid-colour margin so the product
 *    fills the frame (this is what makes a padded square upload stop looking
 *    tiny next to tightly-cropped photos)
 *  - cap the longest side so files stay reasonable
 * Falls back to the original bytes if anything goes wrong, and leaves GIFs
 * untouched to preserve animation.
 */
export async function normalizeImage(buf: Buffer, ext: string): Promise<Buffer> {
  const e = ext.toLowerCase();
  if (e === "gif" || !RASTER_EXT.includes(e)) return buf;

  const base = () => sharp(buf, { failOn: "none" }).rotate(); // honour EXIF orientation
  const encode = (img: sharp.Sharp): Promise<Buffer> =>
    e === "jpg" || e === "jpeg"
      ? img.flatten({ background: "#ffffff" }).jpeg({ quality: 82 }).toBuffer()
      : e === "webp"
        ? img.webp({ quality: 85 }).toBuffer()
        : e === "avif"
          ? img.avif({ quality: 60 }).toBuffer()
          : img.png({ compressionLevel: 9 }).toBuffer();

  const box = { fit: "inside" as const, withoutEnlargement: true };
  try {
    // trim() can throw on a blank image — retry without it before giving up.
    return await encode(base().trim({ threshold: 12 }).resize(1400, 1400, box));
  } catch {
    try {
      return await encode(base().resize(1400, 1400, box));
    } catch {
      return buf;
    }
  }
}
