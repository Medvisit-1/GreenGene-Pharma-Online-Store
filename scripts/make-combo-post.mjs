import sharp from "sharp";
import { homedir } from "node:os";
import { join } from "node:path";

const H = homedir();
const DL = join(H, "Downloads");
const S = 1080;

const LIME = "#a6d94a", LIME2 = "#8fc23a", WHITE = "#ffffff", MUTED = "#9db0a4", RED = "#e63329";

const leaf = (x, y, r, rot, fill, op = 1) =>
  `<g transform="translate(${x},${y}) rotate(${rot})" opacity="${op}"><path d="M0,${-r} C ${r * 0.8},${-r * 0.55} ${r * 0.8},${r * 0.55} 0,${r} C ${-r * 0.8},${r * 0.55} ${-r * 0.8},${-r * 0.55} 0,${-r} Z" fill="${fill}"/></g>`;

async function main() {
  // Crop the product hero (drop the baked-in bottom text), then tighten.
  const file = join(DL, "combo_promo_transparent.png");
  const sm = await sharp(file).metadata();
  const cropH = Math.max(10, Math.round((sm.height || 1800) * 0.78)); // keep bottles + bow + SAVE
  const cropped = await sharp(file)
    .extract({ left: 0, top: 0, width: sm.width || 1600, height: cropH })
    .png()
    .toBuffer();
  const product = await sharp(cropped)
    .trim()
    .resize({ height: 398, fit: "inside" })
    .png()
    .toBuffer();
  const pMeta = await sharp(product).metadata();
  const pW = pMeta.width, pH = pMeta.height;
  const pX = Math.round((S - pW) / 2);
  const pY = 330;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
    <defs>
      <radialGradient id="bg" cx="50%" cy="34%" r="85%">
        <stop offset="0" stop-color="#12301f"/>
        <stop offset="0.6" stop-color="#0a2016"/>
        <stop offset="1" stop-color="#040d08"/>
      </radialGradient>
      <linearGradient id="pill" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${LIME}"/><stop offset="1" stop-color="${LIME2}"/>
      </linearGradient>
    </defs>

    <rect width="${S}" height="${S}" fill="url(#bg)"/>
    <!-- faint leaf motifs -->
    ${leaf(120, 250, 150, -25, "#1c4a30", 0.35)}
    ${leaf(980, 300, 170, 30, "#1c4a30", 0.30)}
    ${leaf(60, 820, 120, 18, "#1c4a30", 0.25)}

    <!-- header: brand + 100% natural -->
    <g transform="translate(60,74)">
      ${leaf(0, 0, 15, 18, LIME)}
      <text x="24" y="8" font-family="Syne" font-weight="800" font-size="30" fill="${WHITE}">GreenGene <tspan fill="${LIME}">Pharma</tspan></text>
    </g>
    <g transform="translate(${S - 96}, 74)">
      <circle r="46" fill="none" stroke="${LIME}" stroke-width="2.5"/>
      <text x="0" y="-4" text-anchor="middle" font-family="Syne" font-weight="800" font-size="24" fill="${WHITE}">100%</text>
      <text x="0" y="18" text-anchor="middle" font-family="Instrument Sans" font-weight="600" font-size="13" letter-spacing="2" fill="${LIME}">NATURAL</text>
    </g>

    <!-- kicker + headline -->
    <text x="${S / 2}" y="188" text-anchor="middle" font-family="Instrument Sans" font-weight="700" font-size="20" letter-spacing="5" fill="${LIME}">THE COMBO MADE FOR HER</text>
    <text x="${S / 2}" y="252" text-anchor="middle" font-family="Syne" font-weight="800" font-size="52" fill="${WHITE}">Balance her rhythm.</text>
    <text x="${S / 2}" y="312" text-anchor="middle" font-family="Syne" font-weight="800" font-size="52" fill="${LIME}">Fuel her results.</text>

    <!-- (product composited here) -->

    <!-- benefit line -->
    <text x="${S / 2}" y="788" text-anchor="middle" font-family="Instrument Sans" font-weight="600" font-size="23" fill="${MUTED}">Hormonal support &#183; Slimming &#183; Energy &amp; vitality</text>

    <!-- offer -->
    <g transform="translate(${S / 2}, 862)">
      <rect x="-235" y="-38" width="470" height="76" rx="38" fill="url(#pill)"/>
      <text x="0" y="11" text-anchor="middle" font-family="Syne" font-weight="800" font-size="30" fill="#0a1f14">ORDER NOW &#183; R425</text>
    </g>

    <text x="${S / 2}" y="948" text-anchor="middle" font-family="Instrument Sans" font-weight="700" font-size="21" fill="${LIME}">Limited offer &#8212; ends 31 July  &#183;  greengenepharma.co.za</text>

    <text x="${S / 2}" y="1052" text-anchor="middle" font-family="Instrument Sans" font-size="12.5" fill="#5f6f64">This medicine has not been evaluated by SAHPRA and is not intended to diagnose, treat, cure or prevent any disease.</text>
  </svg>`;

  const out = join(DL, "greengene-combo-post.png");
  await sharp(Buffer.from(svg))
    .composite([{ input: product, left: pX, top: pY }])
    .png()
    .toFile(out);
  console.log("saved", out, `product ${pW}x${pH} at ${pX},${pY}`);
}
main();
