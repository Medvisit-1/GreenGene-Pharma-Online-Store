import sharp from "sharp";
import pngToIco from "png-to-ico";
import { writeFileSync } from "node:fs";

// GreenGene mark on a clean white rounded background, for crisp browser tabs.
const SRC = "src/app/icon.png";
const S = 256;
const pad = Math.round(S * 0.14);

const bg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}"><rect width="${S}" height="${S}" rx="${Math.round(S * 0.22)}" fill="#ffffff"/></svg>`
);

const mark = await sharp(SRC)
  .resize(S - pad * 2, S - pad * 2, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer();

const base = await sharp(bg)
  .composite([{ input: mark, gravity: "centre" }])
  .png()
  .toBuffer();

const sizes = [16, 32, 48, 64, 128, 256];
const pngs = await Promise.all(
  sizes.map((s) => sharp(base).resize(s, s).png().toBuffer())
);

const ico = await pngToIco(pngs);
writeFileSync("src/app/favicon.ico", ico);
// also refresh icon.png with the white-bg version so all tabs match
writeFileSync("/tmp/favicon-preview.png", await sharp(base).resize(128).png().toBuffer());
console.log("favicon.ico written (" + ico.length + " bytes)");
