import sharp from "sharp";
import { homedir } from "node:os";
import { join } from "node:path";

const W = 1900, H = 250;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <text x="${W / 2}" y="90" text-anchor="middle" font-family="Jost" font-weight="500" font-size="50" fill="#ffffff">
    <tspan>Exclusive to GreenGene Pharma Online Store</tspan><tspan dx="16" fill="#f06fb6">(www.greengenepharma.co.za)</tspan>
  </text>
  <text x="${W / 2}" y="170" text-anchor="middle" font-family="Jost" font-weight="400" font-size="44" fill="#ffffff" fill-opacity="0.85">Valid until 31 July or while stock lasts</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(join(homedir(), "Downloads", "combo-disclaimer.png"));
await sharp(Buffer.from(svg)).flatten({ background: "#0d0d0d" }).png().toFile("/tmp/disclaimer_prev.png");
console.log("saved");
