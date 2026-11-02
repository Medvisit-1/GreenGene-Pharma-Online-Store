import sharp from "sharp";
import { homedir } from "node:os";
import { join } from "node:path";

const DL = join(homedir(), "Downloads");
const W = 1120, H = 300;

// Venus / female symbol — hormonal support (for her)
const venus = (cx, cy) => `
  <circle cx="${cx}" cy="${cy - 24}" r="40" fill="none" stroke="#ffffff" stroke-width="13"/>
  <line x1="${cx}" y1="${cy + 16}" x2="${cx}" y2="${cy + 78}" stroke="#ffffff" stroke-width="13" stroke-linecap="round"/>
  <line x1="${cx - 27}" y1="${cy + 50}" x2="${cx + 27}" y2="${cy + 50}" stroke="#ffffff" stroke-width="13" stroke-linecap="round"/>`;

// Slim waist with inward arrows — slimming
const slim = (cx, cy) => `
  <line x1="${cx}" y1="${cy - 68}" x2="${cx}" y2="${cy + 68}" stroke="#ffffff" stroke-width="12" stroke-linecap="round"/>
  <path d="M${cx - 78},${cy - 46} L${cx - 34},${cy} L${cx - 78},${cy + 46}" fill="none" stroke="#ffffff" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M${cx + 78},${cy - 46} L${cx + 34},${cy} L${cx + 78},${cy + 46}" fill="none" stroke="#ffffff" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>`;

function card(text, grad, icon, file) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">${grad}</linearGradient>
    </defs>
    <rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="40" fill="url(#g)"/>
    <circle cx="175" cy="150" r="98" fill="#ffffff" fill-opacity="0.18" stroke="#ffffff" stroke-opacity="0.55" stroke-width="4"/>
    ${icon(175, 150)}
    <text x="320" y="150" dominant-baseline="central" font-family="Jost" font-weight="700" font-size="78" fill="#ffffff">${text}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toFile(join(DL, file)).then(() =>
    sharp(Buffer.from(svg)).flatten({ background: "#0d0d0d" }).png().toFile("/tmp/" + file));
}

await card(
  "Hormonal Support",
  `<stop offset="0" stop-color="#c2178a"/><stop offset="1" stop-color="#e6198c"/>`,
  venus,
  "card-hormonal-support.png"
);
await card(
  "Slimming",
  `<stop offset="0" stop-color="#ee5aa8"/><stop offset="1" stop-color="#f79ad0"/>`,
  slim,
  "card-slimming.png"
);
console.log("saved");
