import sharp from "sharp";

// Render just the "GlowGene" wordmark in several fonts to compare G legibility.
const candidates = [
  { name: "Dancing Script", family: "Dancing Script", size: 92, weight: 600 },
  { name: "Great Vibes", family: "Great Vibes", size: 96, weight: 400 },
  { name: "Sacramento", family: "Sacramento", size: 100, weight: 400 },
];

const W = 900, H = 200;
const gold = `<linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#f9ecc0"/><stop offset="0.32" stop-color="#e6c25a"/>
  <stop offset="0.52" stop-color="#c79f31"/><stop offset="0.68" stop-color="#f4dd8f"/>
  <stop offset="1" stop-color="#c99b2e"/></linearGradient>`;

const tiles = [];
for (const c of candidates) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>${gold}</defs>
    <rect width="${W}" height="${H}" fill="#000000"/>
    <text x="30" y="60" font-family="Jost" font-size="20" fill="#888">${c.name}</text>
    <text x="${W / 2}" y="150" text-anchor="middle" font-family="${c.family}" font-weight="${c.weight}" font-size="${c.size}"><tspan fill="url(#gold)">Glow</tspan><tspan fill="#f4f0e7">Gene</tspan></text>
  </svg>`;
  tiles.push(await sharp(Buffer.from(svg)).png().toBuffer());
}
const stacked = await sharp({ create: { width: W, height: H * tiles.length, channels: 3, background: "#000" } })
  .composite(tiles.map((b, i) => ({ input: b, top: i * H, left: 0 })))
  .png().toBuffer();
await sharp(stacked).toFile("/tmp/font_compare.png");
console.log("done");
