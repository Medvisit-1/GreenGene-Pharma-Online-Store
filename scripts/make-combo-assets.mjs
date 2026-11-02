import sharp from "sharp";
import { homedir } from "node:os";
import { join } from "node:path";

const DL = join(homedir(), "Downloads");

/* ---------------- SAVE R75 starburst badge ---------------- */
function starburst(cx, cy, points, rOuter, rInner) {
  const step = Math.PI / points;
  let d = "";
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = i * step - Math.PI / 2;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    d += (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1);
  }
  return d + "Z";
}

const badge = `<svg xmlns="http://www.w3.org/2000/svg" width="440" height="440" viewBox="0 0 440 440">
  <defs>
    <radialGradient id="red" cx="42%" cy="36%" r="75%">
      <stop offset="0" stop-color="#f23842"/><stop offset="0.6" stop-color="#e01f28"/><stop offset="1" stop-color="#b3151c"/>
    </radialGradient>
  </defs>
  <path d="${starburst(220, 220, 16, 205, 168)}" fill="url(#red)" stroke="#a01118" stroke-width="2"/>
  <circle cx="220" cy="220" r="150" fill="none" stroke="#ffffff" stroke-width="4" stroke-opacity="0.9"/>
  <text x="220" y="196" text-anchor="middle" font-family="Jost" font-weight="700" font-size="62" letter-spacing="2" fill="#ffffff">SAVE</text>
  <text x="220" y="300" text-anchor="middle" font-family="Jost" font-weight="700" font-size="104" fill="#ffffff">R75</text>
</svg>`;

/* ---------------- Red gift ribbon + bow ---------------- */
const ribbon = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="460" viewBox="0 0 1200 460">
  <defs>
    <linearGradient id="satin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#b3001b"/><stop offset="0.35" stop-color="#ec1c34"/>
      <stop offset="0.55" stop-color="#ff3d52"/><stop offset="0.7" stop-color="#ec1c34"/><stop offset="1" stop-color="#a4001a"/>
    </linearGradient>
    <linearGradient id="satinLoop" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff4258"/><stop offset="0.5" stop-color="#e11026"/><stop offset="1" stop-color="#a4001a"/>
    </linearGradient>
    <linearGradient id="tail" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e11026"/><stop offset="1" stop-color="#8f0016"/>
    </linearGradient>
  </defs>

  <!-- horizontal bands tucking under the bow -->
  <path d="M0,150 C 220,150 400,180 520,215 L520,270 C 400,240 220,215 0,220 Z" fill="url(#satin)"/>
  <path d="M1200,150 C 980,150 800,180 680,215 L680,270 C 800,240 980,215 1200,220 Z" fill="url(#satin)"/>

  <!-- tails -->
  <path d="M560,235 C 545,320 520,360 470,430 L520,405 L556,452 L600,250 Z" fill="url(#tail)"/>
  <path d="M640,235 C 655,320 680,360 730,430 L680,405 L644,452 L600,250 Z" fill="url(#tail)"/>

  <!-- bow loops -->
  <path d="M600,222 C 500,150 360,158 360,232 C 360,300 500,300 600,240 Z" fill="url(#satinLoop)" stroke="#8f0016" stroke-width="2"/>
  <path d="M600,222 C 700,150 840,158 840,232 C 840,300 700,300 600,240 Z" fill="url(#satinLoop)" stroke="#8f0016" stroke-width="2"/>
  <!-- inner loop shadows -->
  <path d="M600,232 C 520,205 430,205 400,235 C 445,255 530,250 600,236 Z" fill="#8f0016" fill-opacity="0.35"/>
  <path d="M600,232 C 680,205 770,205 800,235 C 755,255 670,250 600,236 Z" fill="#8f0016" fill-opacity="0.35"/>

  <!-- centre knot -->
  <rect x="568" y="198" width="64" height="66" rx="14" fill="url(#satinLoop)" stroke="#8f0016" stroke-width="2"/>
</svg>`;

await sharp(Buffer.from(badge)).png().toFile(join(DL, "combo-save-r75.png"));
await sharp(Buffer.from(ribbon)).png().toFile(join(DL, "combo-ribbon-bow.png"));
// previews on a light grey so transparency is visible
await sharp(Buffer.from(badge)).flatten({ background: "#dddddd" }).png().toFile("/tmp/badge_prev.png");
await sharp(Buffer.from(ribbon)).flatten({ background: "#dddddd" }).png().toFile("/tmp/ribbon_prev.png");
console.log("saved");
