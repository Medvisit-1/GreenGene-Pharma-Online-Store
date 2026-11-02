import sharp from "sharp";
import { homedir } from "node:os";
import { join } from "node:path";

const W = 1200, H = 540;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="mag" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#e6198c"/><stop offset="1" stop-color="#f45fb0"/>
    </linearGradient>
  </defs>
  <text x="${W / 2}" y="150" text-anchor="middle" font-family="Jost" font-weight="600" font-size="82" letter-spacing="2" fill="#c9c9c9">Was R500</text>
  <line x1="${W / 2 - 195}" y1="122" x2="${W / 2 + 195}" y2="122" stroke="#e63b6a" stroke-width="9" stroke-linecap="round"/>
  <text x="${W / 2}" y="410" text-anchor="middle" font-family="Jost" font-weight="700" font-size="180" fill="url(#mag)">Now R425</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(join(homedir(), "Downloads", "combo-price-was-now.png"));
await sharp(Buffer.from(svg)).flatten({ background: "#0d0d0d" }).png().toFile("/tmp/price_dark.png");
await sharp(Buffer.from(svg)).flatten({ background: "#ffffff" }).png().toFile("/tmp/price_light.png");
console.log("saved");
