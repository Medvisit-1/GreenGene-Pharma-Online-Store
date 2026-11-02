import sharp from "sharp";
import { homedir } from "node:os";
import { join } from "node:path";

const W = 1900, H = 260;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <text x="${W / 2}" y="170" text-anchor="middle" font-family="Jost" font-weight="700" font-size="120" fill="#ffffff">
    <tspan fill="#e6198c">Hormonal Support</tspan><tspan dx="24" fill="#f06fb6">+</tspan><tspan dx="24" fill="#f7a8d4">Slimming</tspan>
  </text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(join(homedir(), "Downloads", "hormonal-support-slimming.png"));
await sharp(Buffer.from(svg)).flatten({ background: "#ffffff" }).png().toFile("/tmp/title_light.png");
await sharp(Buffer.from(svg)).flatten({ background: "#141313" }).png().toFile("/tmp/title_dark.png");
console.log("saved");
