import Image from "next/image";

/**
 * Opening intro ("Bloom"): a warm aurora breathes in, a gold hairline circle
 * draws itself while two botanical sprigs grow either side, the GreenGene
 * Pharma logo settles in the centre, a personal welcome rises word by word,
 * then the scene opens like an iris onto the page.
 *
 * Pure CSS + SVG (no animation loop, no client bundle). The inline script plays
 * it once per browser session, personalises the welcome with the visitor's
 * saved first name (kept only on their device), and skips it for visitors who
 * prefer reduced motion.
 */
type CSS = React.CSSProperties;

const SPRIG = "M60 236 C 66 190, 70 150, 92 112 S 128 52, 132 16";
const LEAVES = [
  "M70 196 C 46 186, 34 168, 34 150 C 54 156, 68 172, 70 196 Z",
  "M78 160 C 100 152, 114 136, 118 116 C 96 120, 82 138, 78 160 Z",
  "M90 122 C 66 110, 58 92, 60 74 C 80 82, 90 100, 90 122 Z",
  "M108 84 C 128 76, 140 60, 142 42 C 122 46, 110 64, 108 84 Z",
  "M124 44 C 110 34, 106 20, 110 6 C 124 14, 128 30, 124 44 Z",
];

function Words({ text, start, cls }: { text: string; start: number; cls: string }) {
  return (
    <span className={cls} data-start={start}>
      {text.split(" ").map((w, i) => (
        <span key={i} className="gn-w">
          <span style={{ "--d": `${start + i * 0.07}s` } as CSS}>{w}</span>
        </span>
      ))}
    </span>
  );
}

function Sprig({ side }: { side: "l" | "r" }) {
  return (
    <svg className={`gn-sprig ${side}`} viewBox="0 0 160 240" aria-hidden="true">
      <path className="gn-stem" d={SPRIG} pathLength={1} />
      {LEAVES.map((d, i) => (
        <path key={i} className="gn-leaf" d={d} pathLength={1} style={{ "--i": i } as CSS} />
      ))}
    </svg>
  );
}

export function NightIntro({ greeting, name }: { greeting: string; name?: string }) {
  return (
    <>
      <div className="gn-intro" aria-hidden="true" data-greeting={greeting} data-name={name ?? ""} suppressHydrationWarning>
        <div className="gn-iris" />
        <div className="gn-scene">
          <div className="gn-aura a" />
          <div className="gn-aura b" />
          <div className="gn-grain" />
          <div className="gn-mark">
            <svg className="gn-ring" viewBox="0 0 200 200" aria-hidden="true">
              <circle className="gn-ring-faint" cx="100" cy="100" r="96" />
              <circle className="gn-ring-draw" cx="100" cy="100" r="96" pathLength={1} />
            </svg>
            <div className="gn-comet"><i /></div>
            <Sprig side="l" />
            <Sprig side="r" />
            <div className="gn-plate">
              <Image src="/logo-contrast.png" alt="" width={1547} height={756} sizes="220px" preload />
            </div>
          </div>
          <div className="gn-copy">
            <Words cls="gn-eyebrow" text={greeting} start={2.05} />
            <Words cls="gn-hello" text={name ? `Welcome back, ${name}` : "Welcome to GreenGene"} start={2.25} />
            <Words cls="gn-tag" text="your path to healthy living" start={2.7} />
          </div>
        </div>
        <button type="button" className="gn-skip">Skip</button>
      </div>
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `(function(){var o=document.currentScript.previousElementSibling;if(!o)return;try{if(sessionStorage.getItem('gn-intro')||matchMedia('(prefers-reduced-motion:reduce)').matches){o.style.display='none';return}sessionStorage.setItem('gn-intro','1');var n=o.dataset.name||localStorage.getItem('gg-name');if(n&&!o.dataset.name){var h=o.querySelector('.gn-hello');var s=+h.dataset.start;h.innerHTML=('Welcome back, '+n).split(' ').map(function(w,i){var t=document.createElement('span');t.textContent=w;return '<span class="gn-w"><span style="--d:'+(s+i*0.07)+'s">'+t.innerHTML+'</span></span>'}).join('')}}catch(e){}var b=o.querySelector('.gn-skip');if(b)b.onclick=function(){o.classList.add('skip')};o.addEventListener('animationend',function(e){if(e.target===o)o.style.display='none'})})();`,
        }}
      />
    </>
  );
}
