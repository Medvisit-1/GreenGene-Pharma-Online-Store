import sharp from "sharp";
import { homedir } from "node:os";
import { join } from "node:path";

// Standalone text element only: "FACE CREAM · 30 ML" in white, transparent bg.
const W = 900, H = 140;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * 2}" height="${H * 2}" viewBox="0 0 ${W} ${H}">
  <text x="${W / 2}" y="90" text-anchor="middle" font-family="Jost" font-size="46" letter-spacing="4" fill="#ffffff">FACE CREAM &#183; 30 ML</text>
</svg>`;

// transparent version
await sharp(Buffer.from(svg)).png().toFile(join(homedir(), "Downloads", "GlowGene-facecream-30ml-white.png"));
// preview on dark bg so we can see the white
await sharp(Buffer.from(svg)).flatten({ background: "#111111" }).png().toFile("/tmp/facecream_preview.png");
console.log("saved");
