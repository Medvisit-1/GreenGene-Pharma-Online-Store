import sharp from "sharp";
import { homedir } from "node:os";
import { join } from "node:path";

const HOME = homedir();
const DL = join(HOME, "Downloads");
const W = 1600, H = 740;
const O = 150; // feather overlap
const slotW = Math.ceil((W + 2 * O) / 3); // ~634
const step = slotW - O;

const sources = [
  { file: "family1.jpg", warm: false },
  { file: "family4.jpg", warm: true }, // B&W → warm-toned, put in the bright golden middle
  { file: "family2.jpg", warm: false },
];

/* horizontal feather mask (white = keep, transparent = blend away) */
function maskBuf(fadeL, fadeR) {
  const stops = [];
  if (fadeL > 0) {
    stops.push(`<stop offset="0" stop-color="#fff" stop-opacity="0"/>`);
    stops.push(`<stop offset="${(fadeL / slotW).toFixed(3)}" stop-color="#fff" stop-opacity="1"/>`);
  } else {
    stops.push(`<stop offset="0" stop-color="#fff" stop-opacity="1"/>`);
  }
  if (fadeR > 0) {
    stops.push(`<stop offset="${((slotW - fadeR) / slotW).toFixed(3)}" stop-color="#fff" stop-opacity="1"/>`);
    stops.push(`<stop offset="1" stop-color="#fff" stop-opacity="0"/>`);
  } else {
    stops.push(`<stop offset="1" stop-color="#fff" stop-opacity="1"/>`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${slotW}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">${stops.join("")}</linearGradient></defs><rect width="${slotW}" height="${H}" fill="url(#g)"/></svg>`;
  return Buffer.from(svg);
}

async function slice(src, i) {
  let img = sharp(join(DL, src.file)).resize(slotW, H, {
    fit: "cover",
    position: sharp.strategy.attention,
  });
  if (src.warm) {
    // tone the B&W shot to warm golden so it matches the others
    img = img.greyscale().tint({ r: 255, g: 224, b: 188 });
  }
  const fadeL = i === 0 ? 0 : O;
  const fadeR = i === sources.length - 1 ? 0 : O;
  const buf = await img.png().toBuffer();
  return sharp(buf)
    .composite([{ input: maskBuf(fadeL, fadeR), blend: "dest-in" }])
    .png()
    .toBuffer();
}

const leaf = (x, y, r, rot, fill, op = 1) =>
  `<g transform="translate(${x},${y}) rotate(${rot})" opacity="${op}"><path d="M0,${-r} C ${r * 0.78},${-r * 0.55} ${r * 0.78},${r * 0.55} 0,${r} C ${-r * 0.78},${r * 0.55} ${-r * 0.78},${-r * 0.55} 0,${-r} Z" fill="${fill}"/></g>`;

const overlaySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0b2419" stop-opacity="0.62"/>
      <stop offset="0.22" stop-color="#0b2419" stop-opacity="0.12"/>
      <stop offset="0.5" stop-color="#0b2419" stop-opacity="0.10"/>
      <stop offset="0.72" stop-color="#0b2419" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#0b2419" stop-opacity="0.82"/>
    </linearGradient>
    <linearGradient id="pill" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#9ccb4e"/><stop offset="1" stop-color="#7fb53a"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>

  <!-- brand wordmark -->
  <g transform="translate(${W / 2}, 70)">
    ${leaf(-150, -8, 16, 18, "#9ccb4e")}
    <text x="-122" y="0" font-family="Syne" font-size="27" font-weight="700" letter-spacing="5" fill="#ffffff">GREENGENE PHARMA</text>
  </g>

  <!-- headline (two lines) -->
  <g fill="#ffffff" stroke="#0b2419" stroke-width="1.4" stroke-opacity="0.22" style="paint-order:stroke" font-family="Syne" font-weight="800" text-anchor="middle">
    <text x="${W / 2}" y="${H - 200}" font-size="66">Supplements for</text>
    <text x="${W / 2}" y="${H - 128}" font-size="66">all the family</text>
  </g>

  <!-- 100% natural pill -->
  <g transform="translate(${W / 2}, ${H - 86})">
    <rect x="-170" y="0" width="340" height="58" rx="29" fill="url(#pill)"/>
    ${leaf(-132, 29, 15, 20, "#0f2b1e")}
    <text x="22" y="39" text-anchor="middle" font-family="Syne" font-size="29" font-weight="700" letter-spacing="1.5" fill="#0f2b1e">100% NATURAL</text>
  </g>
</svg>`;

async function main() {
  const slices = await Promise.all(sources.map((s, i) => slice(s, i)));
  const base = sharp({
    create: { width: W, height: H, channels: 3, background: "#e6dac6" },
  });
  const composited = await base
    .composite(slices.map((buf, i) => ({ input: buf, left: i * step, top: 0 })))
    .png()
    .toBuffer();

  const graded = await sharp(composited)
    .modulate({ saturation: 1.02, brightness: 1.07 })
    .toBuffer();

  const warm = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#f4cd8c" opacity="0.2"/></svg>`
  );

  const out = join(DL, "greengene-hero.png");
  await sharp(graded)
    .composite([
      { input: warm, blend: "soft-light" },
      { input: Buffer.from(overlaySvg), blend: "over" },
    ])
    .png()
    .toFile(out);
  console.log("Saved:", out);
}

main();
