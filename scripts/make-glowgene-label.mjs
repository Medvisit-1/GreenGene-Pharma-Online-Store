import sharp from "sharp";
import { homedir } from "node:os";
import { join } from "node:path";

// 1.6cm x 14cm strip. Design space 1654 x 189 (300dpi), rendered at 2x (~600dpi).
const W = 1654, H = 189;
const GOLD = "#d4af37";

const leaf = (x, y, r, fill) =>
  `<path transform="translate(${x},${y})" d="M0,${-r} C ${r * 0.8},${-r * 0.55} ${r * 0.8},${r * 0.55} 0,${r} C ${-r * 0.8},${r * 0.55} ${-r * 0.8},${-r * 0.55} 0,${-r} Z" fill="${fill}"/>`;

const cx = W / 2; // 827

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * 2}" height="${H * 2}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="35%" r="80%">
      <stop offset="0" stop-color="#0a0a0a"/><stop offset="0.72" stop-color="#000000"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#f9ecc0"/><stop offset="0.32" stop-color="#e6c25a"/>
      <stop offset="0.52" stop-color="#c79f31"/><stop offset="0.68" stop-color="#f4dd8f"/>
      <stop offset="1" stop-color="#c99b2e"/>
    </linearGradient>
    <linearGradient id="vline" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#d4af37" stop-opacity="0"/><stop offset="0.5" stop-color="#d4af37"/><stop offset="1" stop-color="#d4af37" stop-opacity="0"/>
    </linearGradient>
    <filter id="glow" x="-40%" y="-90%" width="180%" height="280%">
      <feGaussianBlur stdDeviation="5.5"/>
    </filter>
  </defs>

  <rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="12" fill="url(#bg)" stroke="${GOLD}" stroke-opacity="0.5" stroke-width="2.5"/>

  <!-- left: actives (one line) -->
  <text x="298" y="101" font-family="Jost" font-size="16.5" letter-spacing="1.4" fill="#e0c97e" text-anchor="middle">GLUTATHIONE &#183; VITAMIN C &#183; TRIPEPTIDES &#183; KOJIC ACID</text>

  <!-- divider left -->
  <rect x="560" y="52" width="1.4" height="85" fill="url(#vline)"/>
  ${leaf(560.7, 94, 6, GOLD)}

  <!-- centre: wordmark (glow behind, then two-tone) -->
  <text x="${cx}" y="128" text-anchor="middle" font-family="Cormorant Garamond" font-style="italic" font-size="102" fill="#e8c56c" fill-opacity="0.8" filter="url(#glow)">GlowGene</text>
  <text x="${cx}" y="128" text-anchor="middle" font-family="Cormorant Garamond" font-style="italic" font-size="102"><tspan fill="url(#gold)">Glow</tspan><tspan fill="#f4f0e7">Gene</tspan></text>

  <!-- divider right -->
  <rect x="1093" y="52" width="1.4" height="85" fill="url(#vline)"/>
  ${leaf(1093.7, 94, 6, GOLD)}

  <!-- right: tagline (one line) -->
  <text x="1358" y="103" font-family="Cormorant Garamond" font-style="italic" font-size="26" fill="#cdbb9e" text-anchor="middle">Anti-oxidant &#183; Anti-pigment &#183; Youthful glow</text>
</svg>`;

const out = join(homedir(), "Downloads", "glowgene-label-black.png");
await sharp(Buffer.from(svg)).png().toFile(out);
console.log("saved", out);
