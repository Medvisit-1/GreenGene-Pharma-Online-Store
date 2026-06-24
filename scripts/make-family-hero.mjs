import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const W = 1600, H = 1000;

/* ---------- palette ---------- */
const CREAM = "#ECE6DA", CREAM2 = "#E2DAC9";
const DEEP = "#173d2b", DEEPER = "#0f2b1e";
const SAGE = "#cfe0bb", SAGE2 = "#bcd3a3";
const ACCENT = "#9ccb4e", ACCENT2 = "#7fb53a";
const WHITE = "#ffffff";

/* ---------- hair styles (relative to head centre 0,-188 r38) ---------- */
const hair = {
  short: (c) => `<path d="M -41,-188 A 41 41 0 0 1 41,-188 L 35,-172 Q 0,-202 -35,-172 Z" fill="${c}"/>`,
  side: (c) => // thin elderly hair, slightly bald on top
    `<path d="M -41,-186 Q -44,-164 -33,-156 L -30,-168 Q -36,-180 -30,-190 Z" fill="${c}"/>
     <path d="M 41,-186 Q 44,-164 33,-156 L 30,-168 Q 36,-180 30,-190 Z" fill="${c}"/>
     <path d="M -34,-196 Q 0,-214 34,-196 Q 18,-206 0,-206 Q -18,-206 -34,-196 Z" fill="${c}"/>`,
  bun: (c) =>
    `<circle cx="0" cy="-230" r="15" fill="${c}"/>
     <path d="M -41,-188 A 41 41 0 0 1 41,-188 L 36,-170 Q 0,-204 -36,-170 Z" fill="${c}"/>`,
  long: (c) =>
    `<path d="M -41,-190 Q -54,-150 -45,-112 L -30,-112 Q -36,-160 -30,-188 Z" fill="${c}"/>
     <path d="M 41,-190 Q 54,-150 45,-112 L 30,-112 Q 36,-160 30,-188 Z" fill="${c}"/>
     <path d="M -41,-188 A 41 41 0 0 1 41,-188 L 35,-170 Q 0,-204 -35,-170 Z" fill="${c}"/>`,
  bob: (c) =>
    `<path d="M -42,-188 Q -46,-150 -40,-138 L -28,-140 Q -34,-170 -28,-188 Z" fill="${c}"/>
     <path d="M 42,-188 Q 46,-150 40,-138 L 28,-140 Q 34,-170 28,-188 Z" fill="${c}"/>
     <path d="M -42,-186 A 42 42 0 0 1 42,-186 L 36,-166 Q 0,-202 -36,-166 Z" fill="${c}"/>`,
};

/* ---------- one person, feet at y=0, drawn upward ---------- */
function person({ x, g, s = 1, skin, hairColor, style, cloth, beard = false }) {
  const parts = [];
  parts.push(`<ellipse cx="0" cy="6" rx="58" ry="13" fill="#0d2419" opacity="0.08"/>`);
  // gown / torso
  parts.push(`<path d="M -46,-148 C -60,-158 -56,-66 -52,-8 Q -52,8 -36,8 L 36,8 Q 52,8 52,-8 C 56,-66 60,-158 46,-148 C 30,-166 -30,-166 -46,-148 Z" fill="${cloth}"/>`);
  // subtle clothing highlight
  parts.push(`<path d="M -40,-150 C -50,-150 -48,-70 -45,-12 L -30,-12 C -33,-80 -30,-150 -24,-156 Z" fill="#ffffff" opacity="0.08"/>`);
  parts.push(`<rect x="-12" y="-168" width="24" height="28" rx="11" fill="${skin}"/>`);
  parts.push(`<circle cx="0" cy="-188" r="38" fill="${skin}"/>`);
  if (beard) parts.push(`<path d="M -31,-178 Q 0,-150 31,-178 Q 30,-146 0,-138 Q -30,-146 -31,-178 Z" fill="${hairColor}"/>`);
  parts.push(hair[style](hairColor));
  // simple smile
  parts.push(`<path d="M -9,-176 Q 0,-168 9,-176" stroke="#5b3a26" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0.5"/>`);
  return `<g transform="translate(${x},${g}) scale(${s})">${parts.join("")}</g>`;
}

/* ---------- leaf motif ---------- */
const leaf = (x, y, r, rot, fill, op = 1) =>
  `<g transform="translate(${x},${y}) rotate(${rot})" opacity="${op}">
     <path d="M0,${-r} C ${r * 0.75},${-r * 0.6} ${r * 0.75},${r * 0.6} 0,${r} C ${-r * 0.75},${r * 0.6} ${-r * 0.75},${-r * 0.6} 0,${-r} Z" fill="${fill}"/>
     <path d="M0,${-r} L0,${r}" stroke="#ffffff" stroke-width="${r * 0.06}" opacity="0.5"/>
   </g>`;

/* ---------- family line-up ---------- */
const adults = [
  { x: 250, g: 880, s: 1.02, skin: "#e7b48b", hairColor: "#b9b3a6", style: "side", cloth: DEEP, beard: true },        // grandfather
  { x: 430, g: 884, s: 0.95, skin: "#edc098", hairColor: "#c4bdb0", style: "bun", cloth: "#8aa873" },                  // grandmother
  { x: 605, g: 876, s: 1.05, skin: "#d99c6b", hairColor: "#3d2a1c", style: "short", cloth: "#2f6b47" },                // dad 1
  { x: 778, g: 882, s: 0.98, skin: "#e7b48b", hairColor: "#5b3d24", style: "long", cloth: "#c98a5e" },                 // mum 1
  { x: 1010, g: 876, s: 1.04, skin: "#c98a55", hairColor: "#241c16", style: "short", cloth: "#5d7a36" },               // dad 2
  { x: 1183, g: 882, s: 0.97, skin: "#dca877", hairColor: "#4a3322", style: "bob", cloth: "#b9926b" },                 // mum 2
];
const kids = [
  { x: 868, g: 906, s: 0.6, skin: "#edc49d", hairColor: "#4a3322", style: "short", cloth: ACCENT },
  { x: 968, g: 908, s: 0.55, skin: "#e7b48b", hairColor: "#2a2320", style: "bob", cloth: "#cfe0bb" },
];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${CREAM}"/>
      <stop offset="1" stop-color="${CREAM2}"/>
    </linearGradient>
    <linearGradient id="accentPill" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${ACCENT}"/>
      <stop offset="1" stop-color="${ACCENT2}"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" rx="40" fill="url(#bg)"/>

  <!-- soft backdrop circle behind family -->
  <circle cx="800" cy="700" r="470" fill="${SAGE}" opacity="0.55"/>
  <circle cx="800" cy="760" r="360" fill="${SAGE2}" opacity="0.45"/>

  <!-- decorative leaves -->
  ${leaf(120, 250, 70, -25, ACCENT, 0.85)}
  ${leaf(190, 360, 46, 35, DEEP, 0.5)}
  ${leaf(1480, 230, 78, 28, ACCENT, 0.85)}
  ${leaf(1410, 350, 50, -30, DEEP, 0.5)}
  ${leaf(1500, 720, 60, 12, SAGE2, 0.8)}
  ${leaf(95, 720, 60, -12, SAGE2, 0.8)}

  <!-- brand wordmark -->
  <g transform="translate(800,92)">
    ${leaf(-138, 0, 18, 18, ACCENT)}
    <text x="-110" y="9" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" letter-spacing="3" fill="${DEEP}">GREENGENE PHARMA</text>
  </g>

  <!-- ground -->
  <ellipse cx="800" cy="905" rx="720" ry="40" fill="${DEEP}" opacity="0.06"/>

  <!-- family -->
  ${adults.map(person).join("\n")}
  ${kids.map(person).join("\n")}

  <!-- headline -->
  <text x="800" y="250" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="96" font-weight="700" fill="${DEEPER}">Supplements for</text>
  <text x="800" y="358" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="96" font-weight="700" fill="${DEEPER}">all the family</text>

  <!-- 100% natural pill -->
  <g transform="translate(800,430)">
    <rect x="-165" y="0" width="330" height="62" rx="31" fill="url(#accentPill)"/>
    ${leaf(-128, 31, 17, 20, "#ffffff")}
    <text x="14" y="42" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="700" letter-spacing="1" fill="${DEEPER}">100% NATURAL</text>
  </g>

  <!-- subtle tagline -->
  <text x="800" y="540" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="27" fill="${DEEP}" opacity="0.8">Premium natural wellness for every generation</text>
</svg>`;

const out = join(homedir(), "Downloads", "greengene-family-hero.png");
await sharp(Buffer.from(svg)).resize(1600).png().toFile(out);
writeFileSync(join(homedir(), "Downloads", "greengene-family-hero.svg"), svg);
console.log("Saved:", out);
