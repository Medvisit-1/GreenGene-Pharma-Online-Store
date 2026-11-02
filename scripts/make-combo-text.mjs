import sharp from "sharp";
import { homedir } from "node:os";
import { join } from "node:path";

const W = 2100, H = 300;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="mag" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#b8177d"/><stop offset="0.55" stop-color="#e01e8b"/><stop offset="1" stop-color="#f45fb0"/>
    </linearGradient>
  </defs>
  <text x="${W / 2}" y="200" text-anchor="middle" fill="url(#mag)">
    <tspan font-family="Cormorant Garamond" font-style="italic" font-weight="600" font-size="130">The Ultimate Combo</tspan><tspan dx="45" font-family="Dancing Script" font-weight="600" font-size="140">for her</tspan>
  </text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(join(homedir(), "Downloads", "the-ultimate-combo-for-her.png"));
await sharp(Buffer.from(svg)).flatten({ background: "#ffffff" }).png().toFile("/tmp/combo_text_light.png");
await sharp(Buffer.from(svg)).flatten({ background: "#141313" }).png().toFile("/tmp/combo_text_dark.png");
console.log("saved");
