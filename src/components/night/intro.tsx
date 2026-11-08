import Image from "next/image";

/**
 * Opening intro: an Estrogene bottle opens, capsules and light spill out, the
 * GreenGene Pharma logo appears, then the page fades in.
 * Pure CSS (transform/opacity only), no animation loop and no client bundle.
 * A tiny inline script plays it once per browser session and skips it for
 * visitors who prefer reduced motion. Without JS the CSS still fades it away.
 */
const CAPS = [
  [-170, -60, 40], [-120, -150, -30], [-60, -210, 70], [0, -240, -10], [60, -205, 55], [120, -150, -60],
  [170, -70, 20], [-90, -110, 100], [95, -105, -90], [-30, -170, 30], [35, -180, -45], [0, -120, 80],
];
const SPARKS = [-200, -150, -105, -60, -20, 20, 60, 105, 150, 200, -130, 130, -40, 40];

export function NightIntro() {
  return (
    <>
      <div className="gn-intro" aria-hidden="true" suppressHydrationWarning>
        <div className="gn-glow" />
        <div className="gn-stage">
          <div className="gn-mouth" />
          {SPARKS.map((x, i) => (
            <i key={`s${i}`} className="gn-spark" style={{ "--dx": `${x}px`, "--dy": `${-130 - ((i * 37) % 120)}px`, "--d": `${1.05 + (i % 7) * 0.06}s` } as React.CSSProperties} />
          ))}
          {CAPS.map(([x, y, r], i) => (
            <i key={`c${i}`} className="gn-pill" style={{ "--dx": `${x}px`, "--dy": `${y}px`, "--r": `${r}deg`, "--d": `${1.0 + i * 0.05}s` } as React.CSSProperties} />
          ))}
          <div className="gn-bottle">
            {/* eslint-disable-next-line @next/next/no-img-element -- small static asset, split into cap + body */}
            <img className="gn-body" src="/intro/estrogene.webp" alt="" width={342} height={640} decoding="async" fetchPriority="high" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="gn-cap" src="/intro/estrogene.webp" alt="" width={342} height={640} decoding="async" />
          </div>
        </div>
        <div className="gn-logo">
          <Image src="/logo-contrast.png" alt="" width={1547} height={756} sizes="260px" />
          <span>Empower your wellness, live better</span>
        </div>
        <button type="button" className="gn-skip">Skip intro</button>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html:
            "(function(){var o=document.currentScript.previousElementSibling;if(!o)return;try{if(sessionStorage.getItem('gn-intro')||matchMedia('(prefers-reduced-motion:reduce)').matches){o.style.display='none';return}sessionStorage.setItem('gn-intro','1')}catch(e){}var b=o.querySelector('.gn-skip');if(b)b.onclick=function(){o.classList.add('skip')};o.addEventListener('animationend',function(e){if(e.target===o&&e.animationName==='gn-out')o.style.display='none'})})();",
        }}
      />
    </>
  );
}
